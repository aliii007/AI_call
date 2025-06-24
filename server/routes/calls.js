import express from 'express';
import { supabase } from '../lib/supabase.js';
import authenticate from '../middleware/authenticate.js';

const router = express.Router();

// Get user's calls
router.get('/', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('calls')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching calls:', error);
    res.status(500).json({ error: 'Failed to fetch calls' });
  }
});

// Create a new call
router.post('/', authenticate, async (req, res) => {
  try {
    const callData = {
      user_id: req.user.id,
      title: req.body.title || 'Untitled Call',
      start_time: req.body.start_time || new Date().toISOString(),
      status: req.body.status || 'scheduled',
      meeting_id: req.body.meeting_id,
      platform: req.body.platform,
      participants: req.body.participants || [],
      performance_data: req.body.performance_data || {}
    };

    const { data, error } = await supabase
      .from('calls')
      .insert(callData)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.status(201).json(data);
  } catch (error) {
    console.error('Error creating call:', error);
    res.status(500).json({ error: 'Failed to create call' });
  }
});

// Get a specific call
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('calls')
      .select(`
        *,
        transcripts(*),
        ai_suggestions(*)
      `)
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      return res.status(404).json({ error: 'Call not found' });
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching call:', error);
    res.status(500).json({ error: 'Failed to fetch call' });
  }
});

// Update a call
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('calls')
      .update(req.body)
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      return res.status(404).json({ error: 'Call not found' });
    }

    res.json(data);
  } catch (error) {
    console.error('Error updating call:', error);
    res.status(500).json({ error: 'Failed to update call' });
  }
});

// Delete a call
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { error } = await supabase
      .from('calls')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    if (error) {
      throw error;
    }

    res.json({ message: 'Call deleted successfully' });
  } catch (error) {
    console.error('Error deleting call:', error);
    res.status(500).json({ error: 'Failed to delete call' });
  }
});

export default router;