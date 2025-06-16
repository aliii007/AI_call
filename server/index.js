import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import authRoutes from './routes/auth.js';

// Get current file path (ES modules equivalent of __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import services
import aiService from './services/aiService.js';
import transcriptionService from './services/transcriptionService.js';
import zoomService from './services/zoomService.js';
import config from './config/config.js';

// Import routes
import aiRoutes from './routes/ai.js';
import meetingRoutes from './routes/meetings.js';
import authenticate from './middleware/authenticate.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('uploads'));

// Create uploads directory if it doesn't exist
if (!fs.existsSync('./uploads')) {
  fs.mkdirSync('./uploads');
}

// Mock database
const users = [
  {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah@company.com',
    password: '$2a$10$123456789', // hashed password
    role: 'user'
  }
];

const calls = [];
const documents = [];
const transcripts = [];
const aiSuggestions = [];

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|mp3|wav|mp4/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Routes
app.use('/api/ai', aiRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/auth', authRoutes);

// Calls
app.get('/api/calls', authenticate, (req, res) => {
  const userCalls = calls.filter(call => call.userId === req.user.userId);
  res.json(userCalls);
});

app.post('/api/calls', authenticate, async (req, res) => {
  try {
    const newCall = {
      id: Math.random().toString(36).substr(2, 9),
      ...req.body,
      userId: req.user.userId,
      createdAt: new Date(),
      status: 'active',
      transcript: [],
      suggestions: []
    };
    
    calls.push(newCall);

    // Start AI monitoring for this call
    if (req.body.meetingId && req.body.platform === 'zoom') {
      await zoomService.startAIMonitoring(req.body.meetingId, newCall.id, io);
    }

    res.status(201).json(newCall);
  } catch (error) {
    console.error('Call creation error:', error);
    res.status(500).json({ error: 'Failed to create call' });
  }
});

// Documents
app.get('/api/documents', authenticate, (req, res) => {
  const userDocs = documents.filter(doc => doc.userId === req.user.userId);
  res.json(userDocs);
});

app.post('/api/documents/upload', authenticate, upload.single('file'), async (req, res) => {
  try {
    const newDocument = {
      id: Math.random().toString(36).substr(2, 9),
      name: req.file.originalname,
      type: path.extname(req.file.originalname).toLowerCase().replace('.', ''),
      url: `/uploads/${req.file.filename}`,
      uploadDate: new Date(),
      processed: false,
      tags: req.body.tags ? req.body.tags.split(',') : [],
      userId: req.user.userId
    };

    documents.push(newDocument);
    
    // Process document with AI for context extraction
    try {
      const fileContent = fs.readFileSync(req.file.path, 'utf8');
      const context = await aiService.processDocumentForContext(fileContent, newDocument.type);
      
      newDocument.context = context;
      newDocument.processed = true;
      
      io.emit('documentProcessed', newDocument);
    } catch (aiError) {
      console.error('AI document processing error:', aiError);
      // Mark as processed even if AI processing fails
      setTimeout(() => {
        newDocument.processed = true;
        io.emit('documentProcessed', newDocument);
      }, 5000);
    }

    res.status(201).json(newDocument);
  } catch (error) {
    console.error('Document upload error:', error);
    res.status(500).json({ error: 'Failed to upload document' });
  }
});

// Analytics
app.get('/api/analytics', authenticate, (req, res) => {
  const userCalls = calls.filter(call => call.userId === req.user.userId);
  const userSuggestions = aiSuggestions.filter(s => s.userId === req.user.userId);
  
  const analytics = {
    totalCalls: userCalls.length,
    averageDuration: userCalls.reduce((acc, call) => acc + (call.duration || 0), 0) / userCalls.length || 0,
    successRate: userCalls.filter(call => call.status === 'successful').length / userCalls.length * 100 || 0,
    suggestionEffectiveness: userSuggestions.filter(s => s.used).length / userSuggestions.length * 100 || 0,
    totalSuggestions: userSuggestions.length,
    suggestionsUsed: userSuggestions.filter(s => s.used).length
  };

  res.json(analytics);
});

// WebSocket for real-time features
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('joinCall', async (data) => {
    const { callId, userId } = data;
    socket.join(callId);
    console.log(`User ${socket.id} joined call ${callId}`);

    // Start real-time transcription
    try {
      await transcriptionService.startRealTimeTranscription(
        callId,
        (transcript) => {
          // Store transcript
          transcripts.push({
            ...transcript,
            userId
          });

          // Emit to call participants
          io.to(callId).emit('newTranscript', transcript);

          // Update AI conversation context
          aiService.updateConversationContext(callId, transcript);

          // Generate AI suggestion if conditions are met
          generateAISuggestionIfNeeded(callId, userId);
        },
        (error) => {
          console.error('Transcription error:', error);
          io.to(callId).emit('transcriptionError', { error: error.message });
        }
      );
    } catch (error) {
      console.error('Failed to start transcription:', error);
      socket.emit('error', { message: 'Failed to start transcription' });
    }
  });

  socket.on('leaveCall', async (data) => {
    const { callId } = data;
    socket.leave(callId);
    
    // Stop transcription
    try {
      await transcriptionService.stopRealTimeTranscription(callId);
      aiService.clearConversationContext(callId);
    } catch (error) {
      console.error('Failed to stop transcription:', error);
    }
  });

  socket.on('useSuggestion', (data) => {
    const { suggestionId, callId } = data;
    
    // Mark suggestion as used
    const suggestion = aiSuggestions.find(s => s.id === suggestionId);
    if (suggestion) {
      suggestion.used = true;
      suggestion.usedAt = new Date();
      
      io.to(callId).emit('suggestionUsed', { suggestionId });
    }
  });

  socket.on('requestSuggestion', async (data) => {
    const { callId, userId } = data;
    await generateAISuggestionIfNeeded(callId, userId, true);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Generate AI suggestion helper function
async function generateAISuggestionIfNeeded(callId, userId, forceGenerate = false) {
  try {
    const callTranscripts = transcripts.filter(t => t.callId === callId);
    const userDocuments = documents.filter(d => d.userId === userId && d.processed);
    
    // Check if we should generate a suggestion
    const lastSuggestion = aiSuggestions
      .filter(s => s.callId === callId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
    
    const timeSinceLastSuggestion = lastSuggestion 
      ? Date.now() - new Date(lastSuggestion.timestamp).getTime()
      : config.AI_SUGGESTION_INTERVAL + 1;

    if (!forceGenerate && timeSinceLastSuggestion < config.AI_SUGGESTION_INTERVAL) {
      return; // Too soon for another suggestion
    }

    if (callTranscripts.length < 2) {
      return; // Need more conversation context
    }

    // Build document context
    const documentContext = userDocuments
      .map(doc => doc.context ? JSON.stringify(doc.context) : '')
      .join('\n');

    // Generate suggestion
    const suggestion = await aiService.generateSuggestion(
      callId,
      callTranscripts.slice(-10), // Last 10 transcript entries
      documentContext
    );

    // Store suggestion
    const suggestionWithUser = {
      ...suggestion,
      userId
    };
    aiSuggestions.push(suggestionWithUser);

    // Emit to call participants
    io.to(callId).emit('newSuggestion', suggestionWithUser);

  } catch (error) {
    console.error('Failed to generate AI suggestion:', error);
  }
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    services: {
      ai: !!config.OPENAI_API_KEY,
      transcription: !!config.ASSEMBLYAI_API_KEY,
      zoom: !!config.ZOOM_SDK_KEY,
      meet: !!config.GOOGLE_CLIENT_ID
    }
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

const PORT = config.PORT;

server.listen(PORT, () => {
  console.log(`🚀 AI Sales Call Assistant Server running on port ${PORT}`);
  console.log(`📡 WebSocket server ready for real-time communication`);
  console.log(`🤖 AI Services: ${config.OPENAI_API_KEY ? '✅' : '❌'} OpenAI`);
  console.log(`🎤 Transcription: ${config.ASSEMBLYAI_API_KEY ? '✅' : '❌'} AssemblyAI`);
  console.log(`📹 Zoom SDK: ${config.ZOOM_SDK_KEY ? '✅' : '❌'} Configured`);
  console.log(`📱 Google Meet: ${config.GOOGLE_CLIENT_ID ? '✅' : '❌'} Configured`);
});

export default app;