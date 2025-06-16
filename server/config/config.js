import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';

// Get current file path (ES modules equivalent of __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export default {
  // Server Configuration
  PORT: process.env.PORT || 3001,
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key',
  
  // OpenAI Configuration
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
  
  // AssemblyAI Configuration
  ASSEMBLYAI_API_KEY: process.env.ASSEMBLYAI_API_KEY,
  
  // Zoom SDK Configuration
  ZOOM_SDK_KEY: process.env.ZOOM_SDK_KEY,
  ZOOM_SDK_SECRET: process.env.ZOOM_SDK_SECRET,
  ZOOM_WEBHOOK_SECRET: process.env.ZOOM_WEBHOOK_SECRET,
  
  // Google Meet Configuration (if using Google Meet SDK)
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  
  // Microsoft Teams Configuration (if using Teams SDK)
  TEAMS_APP_ID: process.env.TEAMS_APP_ID,
  TEAMS_APP_SECRET: process.env.TEAMS_APP_SECRET,
  
  // Database Configuration
  DATABASE_URL: process.env.DATABASE_URL || 'sqlite://./database.sqlite',
  
  // Redis Configuration (for caching and sessions)
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  
  // File Storage Configuration
  UPLOAD_PATH: process.env.UPLOAD_PATH || './uploads',
  MAX_FILE_SIZE: process.env.MAX_FILE_SIZE || '10MB',
  
  // AI Configuration
  AI_SUGGESTION_INTERVAL: parseInt(process.env.AI_SUGGESTION_INTERVAL) || 30000, // 30 seconds
  TRANSCRIPTION_LANGUAGE: process.env.TRANSCRIPTION_LANGUAGE || 'en-US',
  AI_CONFIDENCE_THRESHOLD: parseFloat(process.env.AI_CONFIDENCE_THRESHOLD) || 0.8,
};