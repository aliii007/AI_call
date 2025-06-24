# AI Sales Call Assistant

A comprehensive AI-powered sales call assistant that provides real-time suggestions, transcription, and analytics during video calls. Built with React, Node.js, MongoDB, and integrated with Zoom, Google Meet, OpenAI, and AssemblyAI.

## 🚀 Features

### Core Functionality
- **Real-time AI Suggestions**: Context-aware sales suggestions during live calls
- **Live Transcription**: Automatic speech-to-text with speaker identification
- **Multi-platform Support**: Zoom SDK and Google Meet integration
- **Document Processing**: AI-powered context extraction from sales materials
- **Analytics Dashboard**: Comprehensive performance metrics and insights
- **WebSocket Communication**: Real-time updates and notifications

### AI Capabilities
- **OpenAI GPT-4 Integration**: Advanced conversation analysis and suggestion generation
- **AssemblyAI Transcription**: High-accuracy speech-to-text with sentiment analysis
- **Context-Aware Suggestions**: Leverages uploaded documents and conversation history
- **Conversation Analysis**: Sentiment tracking, objection detection, and buying signals

### Video Conferencing
- **Zoom Web SDK**: Full integration with Zoom meetings
- **Google Meet API**: Calendar integration and meeting management
- **Real-time Monitoring**: Webhook support for meeting events
- **Recording Support**: Access to meeting recordings and transcripts

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Recharts** for analytics visualization
- **Socket.io Client** for real-time communication

### Backend
- **Node.js** with Express
- **MongoDB** with Mongoose ODM
- **Socket.io** for WebSocket communication
- **JWT Authentication**
- **Multer** for file uploads
- **OpenAI API** for AI suggestions
- **AssemblyAI** for transcription
- **Zoom SDK** and **Google Meet API**

## 📋 Prerequisites

Before running the application, you'll need:

1. **Node.js** (v18 or higher)
2. **MongoDB** (local installation or MongoDB Atlas)
3. API keys for:
   - **OpenAI API** - For AI suggestions and conversation analysis
   - **AssemblyAI** - For real-time transcription
   - **Zoom SDK** - For Zoom meeting integration
   - **Google Cloud Console** - For Google Meet integration

## 🚀 Quick Start

### 1. Clone and Install Dependencies

```bash
# Install dependencies
npm install
```

### 2. Database Setup

**Option A: Local MongoDB**
```bash
# Install MongoDB locally
# macOS
brew install mongodb-community

# Ubuntu
sudo apt-get install mongodb

# Start MongoDB service
mongod
```

**Option B: MongoDB Atlas (Cloud)**
1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Get your connection string
4. Use it in your `.env` file

### 3. Environment Configuration

Create a `.env` file in the root directory:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/ai-sales-assistant
# Or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ai-sales-assistant

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=3001
NODE_ENV=development

# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-api-key-here
OPENAI_MODEL=gpt-4-turbo-preview

# AssemblyAI Configuration
ASSEMBLYAI_API_KEY=your-assemblyai-api-key-here

# Zoom SDK Configuration
ZOOM_SDK_KEY=your-zoom-sdk-key-here
ZOOM_SDK_SECRET=your-zoom-sdk-secret-here
ZOOM_WEBHOOK_SECRET=your-zoom-webhook-secret-here

# Google Meet Configuration
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here

# AI Configuration
AI_SUGGESTION_INTERVAL=30000
TRANSCRIPTION_LANGUAGE=en-US
AI_CONFIDENCE_THRESHOLD=0.8
```

### 4. Start the Application

```bash
# Start both frontend and backend
npm run dev

# Or start them separately:
# Backend: npm run server
# Frontend: vite (in another terminal)
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## 🔧 API Configuration

### OpenAI Setup
1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Create an API key
3. Add to your `.env` file as `OPENAI_API_KEY`

### AssemblyAI Setup
1. Sign up at [AssemblyAI](https://www.assemblyai.com/)
2. Get your API key from the dashboard
3. Add to your `.env` file as `ASSEMBLYAI_API_KEY`

### Zoom SDK Setup
1. Create a Zoom App at [Zoom Marketplace](https://marketplace.zoom.us/)
2. Choose "SDK App" type
3. Get your SDK Key and Secret
4. Add webhook endpoint: `http://your-domain.com/api/meetings/zoom/webhook`
5. Add credentials to your `.env` file

### Google Meet Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google Calendar API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3001/api/meetings/google/callback`
6. Add credentials to your `.env` file

## 📱 Usage

### Starting a Call
1. Navigate to the "Active Call" page
2. Choose your video platform (Zoom or Google Meet)
3. Create or join a meeting
4. AI assistance will automatically start monitoring

### Document Management
1. Go to the "Documents" page
2. Upload sales materials (PDFs, presentations, etc.)
3. AI will process and extract relevant context
4. Documents are used to enhance suggestion quality

### Analytics
1. Visit the "Analytics" page
2. View performance metrics and trends
3. Analyze conversation effectiveness
4. Export reports for further analysis

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user profile
- `PATCH /api/auth/me` - Update user profile

### Calls
- `GET /api/calls` - Get user's calls
- `POST /api/calls` - Create new call
- `GET /api/calls/:id` - Get specific call
- `PATCH /api/calls/:id` - Update call
- `DELETE /api/calls/:id` - Delete call

### Meetings
- `POST /api/meetings/zoom/create` - Create Zoom meeting
- `GET /api/meetings/zoom/:meetingId` - Get meeting details
- `POST /api/meetings/google/create` - Create Google Meet

### WebSocket Events
- `joinCall` - Join call room for real-time updates
- `newTranscript` - Receive new transcript entries
- `newSuggestion` - Receive AI suggestions
- `useSuggestion` - Mark suggestion as used

## 🏗️ Architecture

### Frontend Architecture
```
src/
├── components/          # Reusable UI components
│   ├── call/           # Call-specific components
│   ├── layout/         # Layout components
│   └── ui/             # Base UI components
├── pages/              # Page components
├── lib/                # API services and utilities
├── hooks/              # Custom React hooks
├── contexts/           # React contexts
└── types/              # TypeScript definitions
```

### Backend Architecture
```
server/
├── config/             # Configuration files
├── models/             # MongoDB models
├── services/           # Business logic services
├── routes/             # API routes
├── middleware/         # Express middleware
└── index.js           # Main server file
```

## 🗄️ Database Schema

### Users Collection
- Authentication and profile information
- Preferences and settings
- Role-based access control

### Calls Collection
- Call metadata and status
- Performance data and metrics
- Meeting platform integration

### Transcripts Collection
- Real-time speech-to-text data
- Speaker identification
- Confidence scores and timing

### AI Suggestions Collection
- Generated suggestions with context
- Usage tracking and feedback
- Performance analytics

### Documents Collection
- Uploaded sales materials
- AI-processed content and context
- Access tracking and metadata

## 🔒 Security

- JWT-based authentication
- Password hashing with bcrypt
- API rate limiting
- Input validation and sanitization
- CORS configuration
- Webhook signature verification

## 🚀 Deployment

### Environment Variables
Ensure all required environment variables are set in production:
- Use strong JWT secrets
- Configure proper CORS origins
- Set up SSL certificates for webhooks
- Use production database URLs

### Recommended Deployment Platforms
- **Frontend**: Vercel, Netlify
- **Backend**: Railway, Render, AWS EC2, DigitalOcean
- **Database**: MongoDB Atlas, AWS DocumentDB
- **File Storage**: AWS S3, Cloudinary

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Check the documentation
- Review API integration guides
- Open an issue on GitHub
- Contact the development team

## 🔄 Updates

The application supports:
- Hot reloading in development
- Automatic dependency updates
- Real-time feature updates
- Progressive enhancement