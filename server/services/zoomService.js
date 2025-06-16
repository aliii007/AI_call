import axios from 'axios';
import jwt from 'jsonwebtoken';
import config from '../config/config.js';

class ZoomService {
  constructor() {
    this.baseURL = 'https://api.zoom.us/v2';
    this.webhookEvents = new Map();
  }

  // Generate Zoom JWT token
  generateJWT() {
    const payload = {
      iss: config.ZOOM_SDK_KEY,
      exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour expiration
    };
    
    return jwt.sign(payload, config.ZOOM_SDK_SECRET);
  }

  // Create Zoom meeting
  async createMeeting(userId, meetingData) {
    try {
      const token = this.generateJWT();
      
      const response = await axios.post(
        `${this.baseURL}/users/${userId}/meetings`,
        {
          topic: meetingData.topic || 'AI-Assisted Sales Call',
          type: 2, // Scheduled meeting
          start_time: meetingData.startTime,
          duration: meetingData.duration || 60,
          timezone: meetingData.timezone || 'UTC',
          settings: {
            host_video: true,
            participant_video: true,
            join_before_host: false,
            mute_upon_entry: true,
            waiting_room: false,
            audio: 'both',
            auto_recording: 'cloud', // Enable cloud recording
            recording_authentication: false,
            meeting_authentication: false,
            approval_type: 0
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        meetingId: response.data.id,
        joinUrl: response.data.join_url,
        startUrl: response.data.start_url,
        password: response.data.password,
        topic: response.data.topic,
        startTime: response.data.start_time
      };
    } catch (error) {
      console.error('Failed to create Zoom meeting:', error.response?.data || error.message);
      throw error;
    }
  }

  // Get meeting details
  async getMeeting(meetingId) {
    try {
      const token = this.generateJWT();
      
      const response = await axios.get(
        `${this.baseURL}/meetings/${meetingId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Failed to get meeting details:', error.response?.data || error.message);
      throw error;
    }
  }

  // List user meetings
  async listMeetings(userId, type = 'scheduled') {
    try {
      const token = this.generateJWT();
      
      const response = await axios.get(
        `${this.baseURL}/users/${userId}/meetings`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          params: {
            type,
            page_size: 30
          }
        }
      );

      return response.data.meetings || [];
    } catch (error) {
      console.error('Failed to list meetings:', error.response?.data || error.message);
      throw error;
    }
  }

  // Get meeting recordings
  async getMeetingRecordings(meetingId) {
    try {
      const token = this.generateJWT();
      
      const response = await axios.get(
        `${this.baseURL}/meetings/${meetingId}/recordings`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Failed to get meeting recordings:', error.response?.data || error.message);
      throw error;
    }
  }

  // Handle Zoom webhooks
  handleWebhook(event, payload) {
    const eventHandlers = this.webhookEvents.get(event) || [];
    eventHandlers.forEach(handler => {
      try {
        handler(payload);
      } catch (error) {
        console.error(`Error handling webhook event ${event}:`, error);
      }
    });
  }

  // Register webhook event handler
  onWebhookEvent(event, handler) {
    const handlers = this.webhookEvents.get(event) || [];
    handlers.push(handler);
    this.webhookEvents.set(event, handlers);
  }

  // Verify webhook signature
  verifyWebhookSignature(payload, signature, timestamp) {
    const message = `v0:${timestamp}:${payload}`;
    const expectedSignature = `v0=${require('crypto')
      .createHmac('sha256', config.ZOOM_WEBHOOK_SECRET)
      .update(message)
      .digest('hex')}`;
    
    return signature === expectedSignature;
  }

  // Start meeting with AI monitoring
  async startAIMonitoring(meetingId, callId, io) {
    // Register webhook handlers for this meeting
    this.onWebhookEvent('meeting.started', (payload) => {
      if (payload.object.id === meetingId) {
        io.emit('meetingStarted', { callId, meetingId });
      }
    });

    this.onWebhookEvent('meeting.ended', (payload) => {
      if (payload.object.id === meetingId) {
        io.emit('meetingEnded', { callId, meetingId });
      }
    });

    this.onWebhookEvent('meeting.participant_joined', (payload) => {
      if (payload.object.id === meetingId) {
        io.emit('participantJoined', { 
          callId, 
          meetingId, 
          participant: payload.object.participant 
        });
      }
    });

    this.onWebhookEvent('meeting.participant_left', (payload) => {
      if (payload.object.id === meetingId) {
        io.emit('participantLeft', { 
          callId, 
          meetingId, 
          participant: payload.object.participant 
        });
      }
    });
  }

  // Generate Zoom SDK signature for client-side SDK
  async generateSDKSignature(meetingNumber, role) {
    const timestamp = new Date().getTime() - 30000;
    const msg = Buffer.from(config.ZOOM_SDK_KEY + meetingNumber + timestamp + role).toString('base64');
    const crypto = await import('crypto');
    const hash = crypto.createHmac('sha256', config.ZOOM_SDK_SECRET).update(msg).digest('base64');
    
    return Buffer.from(`${config.ZOOM_SDK_KEY}.${meetingNumber}.${timestamp}.${role}.${hash}`).toString('base64');
  }
}

const zoomService = new ZoomService();
export default zoomService;