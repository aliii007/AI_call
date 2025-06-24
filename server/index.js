import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get current file path (ES modules equivalent of __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import configuration and database
import config from './config/config.js';
import database from './config/database.js';

// Import middleware
import { globalErrorHandler } from './middleware/errorHandler.js';
import { generalLimiter } from './middleware/rateLimiter.js';
import { authenticate } from './middleware/auth.js';

// Import routes
import authRoutes from './routes/auth.js';
import callRoutes from './routes/calls.js';
import meetingRoutes from './routes/meetings.js';
// import documentRoutes from './routes/documents.js';
// import transcriptRoutes from './routes/transcripts.js';
// import aiRoutes from './routes/ai.js';
// import analyticsRoutes from './routes/analytics.js';

// Import services
import aiService from './services/aiService.js';
import transcriptionService from './services/transcriptionService.js';
import zoomService from './services/zoomService.js';
import googleMeetService from './services/googleMeetService.js';

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: config.CORS_ORIGIN,
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "ws:", "wss:"]
    }
  }
}));

// CORS configuration
app.use(cors({
  origin: config.CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rate limiting
app.use(generalLimiter);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve static files
app.use('/uploads', express.static(uploadsDir));

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
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

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/calls', callRoutes);
app.use('/api/meetings', meetingRoutes);
// app.use('/api/documents', documentRoutes);
// app.use('/api/transcripts', transcriptRoutes);
// app.use('/api/ai', aiRoutes);
// app.use('/api/analytics', analyticsRoutes);

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const dbHealth = await database.healthCheck();
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      environment: config.NODE_ENV,
      services: {
        database: dbHealth,
        ai: !!config.OPENAI_API_KEY,
        transcription: !!config.ASSEMBLYAI_API_KEY,
        zoom: !!config.ZOOM_SDK_KEY,
        meet: !!config.GOOGLE_CLIENT_ID
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error.message
    });
  }
});

// WebSocket for real-time features
io.on('connection', (socket) => {
  console.log(`👤 User connected: ${socket.id}`);

  socket.on('joinCall', async (data) => {
    try {
      const { callId, userId, platform } = data;
      
      if (!callId || !userId) {
        socket.emit('error', { message: 'Call ID and User ID are required' });
        return;
      }

      socket.join(callId);
      console.log(`📞 User ${socket.id} joined call ${callId} on ${platform || 'unknown'} platform`);

      // Start platform-specific monitoring
      if (platform === 'zoom') {
        await zoomService.startAIMonitoring(data.meetingId, callId, io);
      } else if (platform === 'google_meet') {
        await googleMeetService.startAIMonitoring(data.meetingId, callId, io);
      }

      // Start real-time transcription
      await transcriptionService.startRealTimeTranscription(
        callId,
        async (transcript) => {
          try {
            // Store transcript in database
            const Transcript = (await import('./models/Transcript.js')).default;
            await Transcript.create({
              call: callId,
              speaker: transcript.speaker,
              text: transcript.text,
              confidence: transcript.confidence,
              timestamp: transcript.timestamp,
              startTime: transcript.startTime,
              endTime: transcript.endTime,
              words: transcript.words
            });

            // Emit to call participants
            io.to(callId).emit('newTranscript', transcript);

            // Update AI conversation context
            aiService.updateConversationContext(callId, transcript);

            // Generate AI suggestion if conditions are met
            generateAISuggestionIfNeeded(callId, userId);
          } catch (error) {
            console.error('Error processing transcript:', error);
          }
        },
        (error) => {
          console.error('Transcription error:', error);
          io.to(callId).emit('transcriptionError', { error: error.message });
        }
      );

      // Emit successful join
      socket.emit('callJoined', { callId, platform });
    } catch (error) {
      console.error('Error joining call:', error);
      socket.emit('error', { message: 'Failed to join call' });
    }
  });

  socket.on('leaveCall', async (data) => {
    try {
      const { callId } = data;
      socket.leave(callId);
      
      // Stop transcription
      await transcriptionService.stopRealTimeTranscription(callId);
      aiService.clearConversationContext(callId);
      
      console.log(`📞 User ${socket.id} left call ${callId}`);
      socket.emit('callLeft', { callId });
    } catch (error) {
      console.error('Error leaving call:', error);
    }
  });

  socket.on('useSuggestion', async (data) => {
    try {
      const { suggestionId, callId, feedback } = data;
      
      // Mark suggestion as used in database
      const AISuggestion = (await import('./models/AISuggestion.js')).default;
      await AISuggestion.findByIdAndUpdate(suggestionId, {
        used: true,
        usedAt: new Date(),
        feedback: feedback || null
      });

      io.to(callId).emit('suggestionUsed', { suggestionId });
    } catch (error) {
      console.error('Error marking suggestion as used:', error);
    }
  });

  socket.on('requestSuggestion', async (data) => {
    try {
      const { callId, userId } = data;
      await generateAISuggestionIfNeeded(callId, userId, true);
    } catch (error) {
      console.error('Error requesting suggestion:', error);
    }
  });

  socket.on('meetingEvent', async (data) => {
    try {
      const { callId, event, platform, payload } = data;
      
      // Handle platform-specific meeting events
      console.log(`📹 Meeting event: ${event} on ${platform} for call ${callId}`);
      
      // Broadcast to all participants in the call
      io.to(callId).emit('meetingEvent', { event, platform, payload });
    } catch (error) {
      console.error('Error handling meeting event:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log(`👤 User disconnected: ${socket.id}`);
  });
});

// Generate AI suggestion helper function
async function generateAISuggestionIfNeeded(callId, userId, forceGenerate = false) {
  try {
    // Import models
    const Transcript = (await import('./models/Transcript.js')).default;
    const Document = (await import('./models/Document.js')).default;
    const AISuggestion = (await import('./models/AISuggestion.js')).default;
    const User = (await import('./models/User.js')).default;

    // Get recent transcripts
    const transcripts = await Transcript.find({ call: callId })
      .sort({ timestamp: -1 })
      .limit(10);

    // Get user documents and preferences
    const [documents, user] = await Promise.all([
      Document.find({
        user: userId,
        processed: true
      }),
      User.findById(userId)
    ]);

    // Check if we should generate a suggestion
    const lastSuggestion = await AISuggestion.findOne({ call: callId })
      .sort({ createdAt: -1 });

    const timeSinceLastSuggestion = lastSuggestion 
      ? Date.now() - lastSuggestion.createdAt.getTime()
      : config.AI_SUGGESTION_INTERVAL + 1;

    if (!forceGenerate && timeSinceLastSuggestion < config.AI_SUGGESTION_INTERVAL) {
      return; // Too soon for another suggestion
    }

    if (!transcripts || transcripts.length < 2) {
      return; // Need more conversation context
    }

    // Build document context
    const documentContext = documents
      .map(doc => doc.extractedText || doc.content || '')
      .join('\n');

    // Generate suggestion
    const suggestion = await aiService.generateSuggestion(
      callId,
      transcripts.slice(0, 10),
      documentContext,
      user?.preferences || {}
    );

    // Store suggestion in database
    const storedSuggestion = await AISuggestion.create({
      call: callId,
      user: userId,
      type: suggestion.type,
      text: suggestion.text,
      confidence: suggestion.confidence,
      context: suggestion.context,
      reasoning: suggestion.reasoning,
      priority: suggestion.priority,
      triggerContext: suggestion.triggerContext
    });

    // Emit to call participants
    io.to(callId).emit('newSuggestion', storedSuggestion);

  } catch (error) {
    console.error('Failed to generate AI suggestion:', error);
  }
}

// 404 handler for API routes
app.all('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Global error handling middleware
app.use(globalErrorHandler);

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await database.connect();
    
    // Create database indexes
    await database.createIndexes();
    
    // Start server
    server.listen(config.PORT, () => {
      console.log(`🚀 AI Sales Call Assistant Server running on port ${config.PORT}`);
      console.log(`📡 WebSocket server ready for real-time communication`);
      console.log(`🗄️  Database: ${database.connection ? '✅' : '❌'} Connected`);
      console.log(`🤖 AI Services: ${config.OPENAI_API_KEY ? '✅' : '❌'} OpenAI`);
      console.log(`🎤 Transcription: ${config.ASSEMBLYAI_API_KEY ? '✅' : '❌'} AssemblyAI`);
      console.log(`📹 Zoom SDK: ${config.ZOOM_SDK_KEY ? '✅' : '❌'} Configured`);
      console.log(`📱 Google Meet: ${config.GOOGLE_CLIENT_ID ? '✅' : '❌'} Configured`);
      console.log(`🌍 Environment: ${config.NODE_ENV}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🔄 SIGTERM received. Shutting down gracefully...');
  server.close(async () => {
    await database.disconnect();
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('🔄 SIGINT received. Shutting down gracefully...');
  server.close(async () => {
    await database.disconnect();
    process.exit(0);
  });
});

// Start the server
startServer();

export default app;