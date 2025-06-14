import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export class APIService {
  // AI Services
  static async generateAISuggestion(callId: string, transcriptHistory: any[], documentContext?: string, userPreferences?: any) {
    const response = await apiClient.post('/ai/suggestion', {
      callId,
      transcriptHistory,
      documentContext,
      userPreferences
    });
    return response.data;
  }

  static async analyzeConversation(transcriptHistory: any[]) {
    const response = await apiClient.post('/ai/analyze', {
      transcriptHistory
    });
    return response.data;
  }

  static async processDocument(content: string, type: string) {
    const response = await apiClient.post('/ai/process-document', {
      content,
      type
    });
    return response.data;
  }

  // Transcription Services
  static async startTranscription(callId: string) {
    const response = await apiClient.post('/ai/transcription/start', {
      callId
    });
    return response.data;
  }

  static async stopTranscription(callId: string) {
    const response = await apiClient.post('/ai/transcription/stop', {
      callId
    });
    return response.data;
  }

  static async transcribeAudioFile(audioFilePath: string, options?: any) {
    const response = await apiClient.post('/ai/transcription/file', {
      audioFilePath,
      options
    });
    return response.data;
  }

  static async getTranscriptionStatus(transcriptId: string) {
    const response = await apiClient.get(`/ai/transcription/status/${transcriptId}`);
    return response.data;
  }

  // Zoom Meeting Services
  static async createZoomMeeting(userId: string, meetingData: any) {
    const response = await apiClient.post('/meetings/zoom/create', {
      userId,
      meetingData
    });
    return response.data;
  }

  static async getZoomMeeting(meetingId: string) {
    const response = await apiClient.get(`/meetings/zoom/${meetingId}`);
    return response.data;
  }

  static async listZoomMeetings(userId: string, type?: string) {
    const response = await apiClient.get(`/meetings/zoom/user/${userId}`, {
      params: { type }
    });
    return response.data;
  }

  static async getZoomRecordings(meetingId: string) {
    const response = await apiClient.get(`/meetings/zoom/${meetingId}/recordings`);
    return response.data;
  }

  static async generateZoomSDKSignature(meetingNumber: string, role: number) {
    const response = await apiClient.post('/meetings/zoom/sdk-signature', {
      meetingNumber,
      role
    });
    return response.data;
  }

  // Google Meet Services
  static async createGoogleMeet(userTokens: any, meetingData: any) {
    const response = await apiClient.post('/meetings/meet/create', {
      userTokens,
      meetingData
    });
    return response.data;
  }

  static async getGoogleMeet(eventId: string, userTokens: any) {
    const response = await apiClient.get(`/meetings/meet/${eventId}`, {
      params: { userTokens: JSON.stringify(userTokens) }
    });
    return response.data;
  }

  static async listGoogleMeets(userTokens: any, maxResults?: number) {
    const response = await apiClient.get('/meetings/meet/user/list', {
      params: { 
        userTokens: JSON.stringify(userTokens),
        maxResults
      }
    });
    return response.data;
  }

  static async getGoogleAuthUrl() {
    const response = await apiClient.get('/meetings/meet/auth-url');
    return response.data;
  }

  static async exchangeGoogleCode(code: string) {
    const response = await apiClient.post('/meetings/meet/exchange-code', {
      code
    });
    return response.data;
  }

  // Call Management
  static async getCalls() {
    const response = await apiClient.get('/calls');
    return response.data;
  }

  static async createCall(callData: any) {
    const response = await apiClient.post('/calls', callData);
    return response.data;
  }

  // Document Management
  static async getDocuments() {
    const response = await apiClient.get('/documents');
    return response.data;
  }

  static async uploadDocument(formData: FormData) {
    const response = await apiClient.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Analytics
  static async getAnalytics() {
    const response = await apiClient.get('/analytics');
    return response.data;
  }

  // Authentication
  static async login(email: string, password: string) {
    const response = await apiClient.post('/auth/login', {
      email,
      password
    });
    return response.data;
  }

  // Health Check
  static async getHealth() {
    const response = await apiClient.get('/health');
    return response.data;
  }
}

export default APIService;