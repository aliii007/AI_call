import express from 'express';
import { catchAsync } from '../middleware/errorHandler.js';
import { validateObjectId } from '../middleware/validation.js';
import { authenticate } from '../middleware/auth.js';
import zoomService from '../services/zoomService.js';
import googleMeetService from '../services/googleMeetService.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// ==================== ZOOM ROUTES ====================

// Create Zoom meeting
router.post('/zoom/create', catchAsync(async (req, res) => {
  const { meetingData } = req.body;

  if (!meetingData) {
    return res.status(400).json({
      success: false,
      message: 'Meeting data is required'
    });
  }

  // Use user email as Zoom user ID (or you can store Zoom user ID in user profile)
  const zoomUserId = req.user.email;

  const meeting = await zoomService.createMeeting(zoomUserId, meetingData);

  res.status(201).json({
    success: true,
    message: 'Zoom meeting created successfully',
    data: {
      meeting
    }
  });
}));

// Get Zoom meeting details
router.get('/zoom/:meetingId', validateObjectId('meetingId'), catchAsync(async (req, res) => {
  const { meetingId } = req.params;

  const meeting = await zoomService.getMeeting(meetingId);

  res.json({
    success: true,
    data: {
      meeting
    }
  });
}));

// List Zoom meetings
router.get('/zoom/user/list', catchAsync(async (req, res) => {
  const { type = 'scheduled', pageSize = 30 } = req.query;
  const zoomUserId = req.user.email;

  const meetings = await zoomService.listMeetings(zoomUserId, type, parseInt(pageSize));

  res.json({
    success: true,
    data: meetings
  });
}));

// Update Zoom meeting
router.patch('/zoom/:meetingId', validateObjectId('meetingId'), catchAsync(async (req, res) => {
  const { meetingId } = req.params;
  const updateData = req.body;

  const meeting = await zoomService.updateMeeting(meetingId, updateData);

  res.json({
    success: true,
    message: 'Zoom meeting updated successfully',
    data: {
      meeting
    }
  });
}));

// Delete Zoom meeting
router.delete('/zoom/:meetingId', validateObjectId('meetingId'), catchAsync(async (req, res) => {
  const { meetingId } = req.params;

  await zoomService.deleteMeeting(meetingId);

  res.json({
    success: true,
    message: 'Zoom meeting deleted successfully'
  });
}));

// Get Zoom meeting recordings
router.get('/zoom/:meetingId/recordings', validateObjectId('meetingId'), catchAsync(async (req, res) => {
  const { meetingId } = req.params;

  const recordings = await zoomService.getMeetingRecordings(meetingId);

  res.json({
    success: true,
    data: {
      recordings
    }
  });
}));

// Get Zoom meeting participants
router.get('/zoom/:meetingId/participants', validateObjectId('meetingId'), catchAsync(async (req, res) => {
  const { meetingId } = req.params;

  const participants = await zoomService.getMeetingParticipants(meetingId);

  res.json({
    success: true,
    data: participants
  });
}));

// Generate Zoom SDK signature
router.post('/zoom/sdk-signature', catchAsync(async (req, res) => {
  const { meetingNumber, role = 0 } = req.body;

  if (!meetingNumber) {
    return res.status(400).json({
      success: false,
      message: 'Meeting number is required'
    });
  }

  const signature = zoomService.generateSDKSignature(meetingNumber, role);

  res.json({
    success: true,
    data: {
      signature
    }
  });
}));

// Zoom webhook endpoint
router.post('/zoom/webhook', catchAsync(async (req, res) => {
  const signature = req.headers['authorization'];
  const timestamp = req.headers['x-zm-request-timestamp'];
  const body = JSON.stringify(req.body);

  // Verify webhook signature
  if (!zoomService.verifyWebhookSignature(body, signature, timestamp)) {
    return res.status(401).json({
      success: false,
      message: 'Invalid webhook signature'
    });
  }

  const { event, payload } = req.body;
  
  // Handle webhook event
  zoomService.handleWebhook(event, payload);

  res.status(200).json({
    success: true,
    message: 'Webhook processed successfully'
  });
}));

// ==================== GOOGLE MEET ROUTES ====================

// Get Google OAuth URL
router.get('/google/auth-url', catchAsync(async (req, res) => {
  const { state } = req.query;
  
  const authUrl = googleMeetService.generateAuthUrl(state);

  res.json({
    success: true,
    data: {
      authUrl
    }
  });
}));

// Handle Google OAuth callback
router.get('/google/callback', catchAsync(async (req, res) => {
  const { code, state } = req.query;

  if (!code) {
    return res.status(400).json({
      success: false,
      message: 'Authorization code is required'
    });
  }

  const tokens = await googleMeetService.getTokens(code);

  // In a real application, you would store these tokens securely
  // associated with the user account
  res.json({
    success: true,
    message: 'Google authorization successful',
    data: {
      tokens,
      state
    }
  });
}));

// Exchange Google OAuth code for tokens
router.post('/google/exchange-code', catchAsync(async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({
      success: false,
      message: 'Authorization code is required'
    });
  }

  const tokens = await googleMeetService.getTokens(code);

  res.json({
    success: true,
    message: 'Tokens exchanged successfully',
    data: {
      tokens
    }
  });
}));

// Refresh Google tokens
router.post('/google/refresh-token', catchAsync(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({
      success: false,
      message: 'Refresh token is required'
    });
  }

  const tokens = await googleMeetService.refreshToken(refreshToken);

  res.json({
    success: true,
    message: 'Tokens refreshed successfully',
    data: {
      tokens
    }
  });
}));

// Create Google Meet meeting
router.post('/google/create', catchAsync(async (req, res) => {
  const { userTokens, meetingData } = req.body;

  if (!userTokens || !meetingData) {
    return res.status(400).json({
      success: false,
      message: 'User tokens and meeting data are required'
    });
  }

  const meeting = await googleMeetService.createMeeting(userTokens, meetingData);

  res.status(201).json({
    success: true,
    message: 'Google Meet created successfully',
    data: {
      meeting
    }
  });
}));

// Get Google Meet details
router.get('/google/:eventId', catchAsync(async (req, res) => {
  const { eventId } = req.params;
  const { userTokens } = req.query;

  if (!userTokens) {
    return res.status(400).json({
      success: false,
      message: 'User tokens are required'
    });
  }

  const parsedTokens = typeof userTokens === 'string' ? JSON.parse(userTokens) : userTokens;
  const meeting = await googleMeetService.getMeeting(parsedTokens, eventId);

  res.json({
    success: true,
    data: {
      meeting
    }
  });
}));

// List Google Meet meetings
router.get('/google/user/list', catchAsync(async (req, res) => {
  const { userTokens, maxResults = 10, timeMin } = req.query;

  if (!userTokens) {
    return res.status(400).json({
      success: false,
      message: 'User tokens are required'
    });
  }

  const parsedTokens = typeof userTokens === 'string' ? JSON.parse(userTokens) : userTokens;
  const meetings = await googleMeetService.listMeetings(
    parsedTokens, 
    parseInt(maxResults),
    timeMin
  );

  res.json({
    success: true,
    data: meetings
  });
}));

// Update Google Meet
router.patch('/google/:eventId', catchAsync(async (req, res) => {
  const { eventId } = req.params;
  const { userTokens, updateData } = req.body;

  if (!userTokens || !updateData) {
    return res.status(400).json({
      success: false,
      message: 'User tokens and update data are required'
    });
  }

  const meeting = await googleMeetService.updateMeeting(userTokens, eventId, updateData);

  res.json({
    success: true,
    message: 'Google Meet updated successfully',
    data: {
      meeting
    }
  });
}));

// Delete Google Meet
router.delete('/google/:eventId', catchAsync(async (req, res) => {
  const { eventId } = req.params;
  const { userTokens } = req.body;

  if (!userTokens) {
    return res.status(400).json({
      success: false,
      message: 'User tokens are required'
    });
  }

  await googleMeetService.deleteMeeting(userTokens, eventId);

  res.json({
    success: true,
    message: 'Google Meet deleted successfully'
  });
}));

// Get Google Meet recordings
router.get('/google/:eventId/recordings', catchAsync(async (req, res) => {
  const { eventId } = req.params;
  const { userTokens } = req.query;

  if (!userTokens) {
    return res.status(400).json({
      success: false,
      message: 'User tokens are required'
    });
  }

  const parsedTokens = typeof userTokens === 'string' ? JSON.parse(userTokens) : userTokens;
  const recordings = await googleMeetService.getMeetingRecordings(parsedTokens, eventId);

  res.json({
    success: true,
    data: recordings
  });
}));

// Get user's Google calendars
router.get('/google/calendars', catchAsync(async (req, res) => {
  const { userTokens } = req.query;

  if (!userTokens) {
    return res.status(400).json({
      success: false,
      message: 'User tokens are required'
    });
  }

  const parsedTokens = typeof userTokens === 'string' ? JSON.parse(userTokens) : userTokens;
  const calendars = await googleMeetService.getCalendars(parsedTokens);

  res.json({
    success: true,
    data: calendars
  });
}));

// Validate Google tokens
router.post('/google/validate-tokens', catchAsync(async (req, res) => {
  const { userTokens } = req.body;

  if (!userTokens) {
    return res.status(400).json({
      success: false,
      message: 'User tokens are required'
    });
  }

  const isValid = await googleMeetService.validateTokens(userTokens);

  res.json({
    success: true,
    data: {
      valid: isValid
    }
  });
}));

export default router;