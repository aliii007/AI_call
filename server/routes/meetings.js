import express from 'express';
const router = express.Router();
import zoomService from '../services/zoomService.js';
import meetService from '../services/meetService.js';
import authenticate from '../middleware/authenticate.js';

// Create Zoom meeting
router.post('/zoom/create', authenticate, async (req, res) => {
  try {
    const { userId, meetingData } = req.body;

    if (!userId || !meetingData) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const meeting = await zoomService.createMeeting(userId, meetingData);
    res.json(meeting);
  } catch (error) {
    console.error('Zoom meeting creation error:', error);
    res.status(500).json({ error: 'Failed to create Zoom meeting' });
  }
});

// Get Zoom meeting details
router.get('/zoom/:meetingId', authenticate, async (req, res) => {
  try {
    const { meetingId } = req.params;
    const meeting = await zoomService.getMeeting(meetingId);
    res.json(meeting);
  } catch (error) {
    console.error('Zoom meeting fetch error:', error);
    res.status(500).json({ error: 'Failed to get meeting details' });
  }
});

// List Zoom meetings
router.get('/zoom/user/:userId', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    const { type } = req.query;
    const meetings = await zoomService.listMeetings(userId, type);
    res.json(meetings);
  } catch (error) {
    console.error('Zoom meetings list error:', error);
    res.status(500).json({ error: 'Failed to list meetings' });
  }
});

// Get Zoom meeting recordings
router.get('/zoom/:meetingId/recordings', authenticate, async (req, res) => {
  try {
    const { meetingId } = req.params;
    const recordings = await zoomService.getMeetingRecordings(meetingId);
    res.json(recordings);
  } catch (error) {
    console.error('Zoom recordings fetch error:', error);
    res.status(500).json({ error: 'Failed to get meeting recordings' });
  }
});

// Generate Zoom SDK signature
router.post('/zoom/sdk-signature', authenticate, async (req, res) => {
  try {
    const { meetingNumber, role } = req.body;

    if (!meetingNumber || role === undefined) {
      return res.status(400).json({ error: 'Missing meetingNumber or role' });
    }

    const signature = zoomService.generateSDKSignature(meetingNumber, role);
    res.json({ signature });
  } catch (error) {
    console.error('Zoom SDK signature error:', error);
    res.status(500).json({ error: 'Failed to generate SDK signature' });
  }
});

// Create Google Meet meeting
router.post('/meet/create', authenticate, async (req, res) => {
  try {
    const { userTokens, meetingData } = req.body;

    if (!userTokens || !meetingData) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const meeting = await meetService.createMeeting(userTokens, meetingData);
    res.json(meeting);
  } catch (error) {
    console.error('Google Meet creation error:', error);
    res.status(500).json({ error: 'Failed to create Google Meet' });
  }
});

// Get Google Meet details
router.get('/meet/:eventId', authenticate, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { userTokens } = req.query;

    if (!userTokens) {
      return res.status(400).json({ error: 'Missing user tokens' });
    }

    const meeting = await meetService.getMeeting(JSON.parse(userTokens), eventId);
    res.json(meeting);
  } catch (error) {
    console.error('Google Meet fetch error:', error);
    res.status(500).json({ error: 'Failed to get meeting details' });
  }
});

// List Google Meet meetings
router.get('/meet/user/list', authenticate, async (req, res) => {
  try {
    const { userTokens, maxResults } = req.query;

    if (!userTokens) {
      return res.status(400).json({ error: 'Missing user tokens' });
    }

    const meetings = await meetService.listMeetings(
      JSON.parse(userTokens), 
      parseInt(maxResults) || 10
    );
    res.json(meetings);
  } catch (error) {
    console.error('Google Meet list error:', error);
    res.status(500).json({ error: 'Failed to list meetings' });
  }
});

// Get Google OAuth URL
router.get('/meet/auth-url', (req, res) => {
  try {
    const authUrl = meetService.generateAuthUrl();
    res.json({ authUrl });
  } catch (error) {
    console.error('Google auth URL error:', error);
    res.status(500).json({ error: 'Failed to generate auth URL' });
  }
});

// Exchange Google OAuth code for tokens
router.post('/meet/exchange-code', async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Missing authorization code' });
    }

    const tokens = await meetService.getTokens(code);
    res.json(tokens);
  } catch (error) {
    console.error('Google token exchange error:', error);
    res.status(500).json({ error: 'Failed to exchange code for tokens' });
  }
});

// Zoom webhook endpoint
router.post('/zoom/webhook', (req, res) => {
  try {
    const signature = req.headers['authorization'];
    const timestamp = req.headers['x-zm-request-timestamp'];
    const body = JSON.stringify(req.body);

    // Verify webhook signature
    if (!zoomService.verifyWebhookSignature(body, signature, timestamp)) {
      return res.status(401).json({ error: 'Invalid webhook signature' });
    }

    const { event, payload } = req.body;
    zoomService.handleWebhook(event, payload);

    res.status(200).json({ message: 'Webhook processed' });
  } catch (error) {
    console.error('Zoom webhook error:', error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
});

export default router;