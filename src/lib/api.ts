import axios from 'axios';

// Use environment variable or fallback to default
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

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
      window.location.href = '/signin';
    }
    return Promise.reject(error);
  }
);

export class APIService {
  // Authentication
  static async login(email: string, password: string) {
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data;
  }
  
  static async register(name: string, email: string, password: string) {
    const response = await apiClient.post('/auth/register', { name, email, password });
    return response.data;
  }

  static async getProfile() {
    const response = await apiClient.get('/auth/me');
    return response.data;
  }

  static async updateProfile(updates: any) {
    const response = await apiClient.patch('/auth/me', updates);
    return response.data;
  }

  static async changePassword(currentPassword: string, newPassword: string) {
    const response = await apiClient.patch('/auth/change-password', {
      currentPassword,
      newPassword
    });
    return response.data;
  }

  // Calls
  static async getCalls(params?: any) {
    const response = await apiClient.get('/calls', { params });
    return response.data;
  }

  static async createCall(callData: any) {
    const response = await apiClient.post('/calls', callData);
    return response.data;
  }

  static async getCall(id: string) {
    const response = await apiClient.get(`/calls/${id}`);
    return response.data;
  }

  static async updateCall(id: string, updates: any) {
    const response = await apiClient.patch(`/calls/${id}`, updates);
    return response.data;
  }

  static async deleteCall(id: string) {
    const response = await apiClient.delete(`/calls/${id}`);
    return response.data;
  }

  static async startCall(id: string) {
    const response = await apiClient.patch(`/calls/${id}/start`);
    return response.data;
  }

  static async endCall(id: string) {
    const response = await apiClient.patch(`/calls/${id}/end`);
    return response.data;
  }

  // Zoom Meeting Services
  static async createZoomMeeting(meetingData: any) {
    const response = await apiClient.post('/meetings/zoom/create', { meetingData });
    return response.data;
  }

  static async getZoomMeeting(meetingId: string) {
    const response = await apiClient.get(`/meetings/zoom/${meetingId}`);
    return response.data;
  }

  static async listZoomMeetings(type?: string) {
    const response = await apiClient.get('/meetings/zoom/user/list', {
      params: { type }
    });
    return response.data;
  }

  static async generateZoomSDKSignature(meetingNumber: string, role: number = 0) {
    const response = await apiClient.post('/meetings/zoom/sdk-signature', {
      meetingNumber,
      role
    });
    return response.data;
  }

  // Google Meet Services
  static async getGoogleAuthUrl() {
    const response = await apiClient.get('/meetings/google/auth-url');
    return response.data;
  }

  static async exchangeGoogleCode(code: string) {
    const response = await apiClient.post('/meetings/google/exchange-code', { code });
    return response.data;
  }

  static async createGoogleMeet(userTokens: any, meetingData: any) {
    const response = await apiClient.post('/meetings/google/create', {
      userTokens,
      meetingData
    });
    return response.data;
  }

  static async listGoogleMeets(userTokens: any, maxResults?: number) {
    const response = await apiClient.get('/meetings/google/user/list', {
      params: { 
        userTokens: JSON.stringify(userTokens),
        maxResults
      }
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