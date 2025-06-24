import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get current file path (ES modules equivalent of __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import services
import aiService from './services/aiService.js';
import transcriptionService from './services/transcriptionService.js';
import zoomService from './services/zoomService.js';
import config from './config/config.js';
import { supabase } from './lib/supabase.js';

// Import routes
import aiRoutes from './routes/ai.js';
import meetingRoutes from './routes/meetings.js';
import callRoutes from './routes/calls.js';
import documentRoutes from './routes/documents.js';
import analyticsRoutes from './routes/analytics.js';
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
app.use('/api/calls', callRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/analytics', analyticsRoutes);

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
        async (transcript) => {
          // Store transcript in Supabase
          const { error } = await supabase
            .from('transcripts')
            .insert({
              call_id: callId,
              speaker: transcript.speaker,
              text: transcript.text,
              confidence: transcript.confidence,
              timestamp: transcript.timestamp
            });

          if (error) {
            console.error('Error storing transcript:', error);
          }

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

  socket.on('useSuggestion', async (data) => {
    const { suggestionId, callId } = data;
    
    try {
      // Mark suggestion as used in Supabase
      const { error } = await supabase
        .from('ai_suggestions')
        .update({ 
          used: true, 
          used_at: new Date().toISOString() 
        })
        .eq('id', suggestionId);

      if (error) {
        console.error('Error updating suggestion:', error);
      } else {
        io.to(callId).emit('suggestionUsed', { suggestionId });
      }
    } catch (error) {
      console.error('Error marking suggestion as used:', error);
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
    // Get recent transcripts from Supabase
    const { data: transcripts, error: transcriptError } = await supabase
      .from('transcripts')
      .select('*')
      .eq('call_id', callId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (transcriptError) {
      console.error('Error fetching transcripts:', transcriptError);
      return;
    }

    // Get user documents from Supabase
    const { data: documents, error: documentsError } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', userId)
      .eq('processed', true);

    if (documentsError) {
      console.error('Error fetching documents:', documentsError);
      return;
    }

    // Check if we should generate a suggestion
    const { data: lastSuggestion, error: suggestionError } = await supabase
      .from('ai_suggestions')
      .select('*')
      .eq('call_id', callId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (suggestionError && suggestionError.code !== 'PGRST116') {
      console.error('Error fetching last suggestion:', suggestionError);
    }

    const timeSinceLastSuggestion = lastSuggestion 
      ? Date.now() - new Date(lastSuggestion.created_at).getTime()
      : config.AI_SUGGESTION_INTERVAL + 1;

    if (!forceGenerate && timeSinceLastSuggestion < config.AI_SUGGESTION_INTERVAL) {
      return; // Too soon for another suggestion
    }

    if (!transcripts || transcripts.length < 2) {
      return; // Need more conversation context
    }

    // Build document context
    const documentContext = documents
      ?.map(doc => doc.content || '')
      .join('\n') || '';

    // Generate suggestion
    const suggestion = await aiService.generateSuggestion(
      callId,
      transcripts.slice(0, 10), // Last 10 transcript entries
      documentContext
    );

    // Store suggestion in Supabase
    const { data: storedSuggestion, error: storeError } = await supabase
      .from('ai_suggestions')
      .insert({
        call_id: callId,
        user_id: userId,
        type: suggestion.type,
        text: suggestion.text,
        confidence: suggestion.confidence,
        context: suggestion.context,
        reasoning: suggestion.reasoning
      })
      .select()
      .single();

    if (storeError) {
      console.error('Error storing suggestion:', storeError);
      return;
    }

    // Emit to call participants
    io.to(callId).emit('newSuggestion', storedSuggestion);

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
      supabase: !!config.SUPABASE_URL,
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
  console.log(`🗄️  Supabase: ${config.SUPABASE_URL ? '✅' : '❌'} Connected`);
  console.log(`🤖 AI Services: ${config.OPENAI_API_KEY ? '✅' : '❌'} OpenAI`);
  console.log(`🎤 Transcription: ${config.ASSEMBLYAI_API_KEY ? '✅' : '❌'} AssemblyAI`);
  console.log(`📹 Zoom SDK: ${config.ZOOM_SDK_KEY ? '✅' : '❌'} Configured`);
  console.log(`📱 Google Meet: ${config.GOOGLE_CLIENT_ID ? '✅' : '❌'} Configured`);
});

export default app;