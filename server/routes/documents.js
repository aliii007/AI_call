import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { supabase } from '../lib/supabase.js';
import authenticate from '../middleware/authenticate.js';
import aiService from '../services/aiService.js';

const router = express.Router();

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

// Get user's documents
router.get('/', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// Upload a document
router.post('/upload', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const documentData = {
      user_id: req.user.id,
      name: req.body.name || req.file.originalname,
      type: path.extname(req.file.originalname).toLowerCase().replace('.', ''),
      url: `/uploads/${req.file.filename}`,
      file_size: req.file.size,
      mime_type: req.file.mimetype,
      tags: req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()) : [],
      processed: false
    };

    const { data, error } = await supabase
      .from('documents')
      .insert(documentData)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Process document with AI for context extraction in the background
    processDocumentAsync(data.id, req.file.path, data.type);

    res.status(201).json(data);
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({ error: 'Failed to upload document' });
  }
});

// Create a URL document
router.post('/url', authenticate, async (req, res) => {
  try {
    const { name, url, tags } = req.body;

    if (!name || !url) {
      return res.status(400).json({ error: 'Name and URL are required' });
    }

    const documentData = {
      user_id: req.user.id,
      name,
      type: 'url',
      url,
      tags: tags || [],
      processed: false
    };

    const { data, error } = await supabase
      .from('documents')
      .insert(documentData)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Process URL content with AI in the background
    processUrlDocumentAsync(data.id, url);

    res.status(201).json(data);
  } catch (error) {
    console.error('Error creating URL document:', error);
    res.status(500).json({ error: 'Failed to create URL document' });
  }
});

// Get a specific document
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({ error: 'Failed to fetch document' });
  }
});

// Update a document
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('documents')
      .update(req.body)
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json(data);
  } catch (error) {
    console.error('Error updating document:', error);
    res.status(500).json({ error: 'Failed to update document' });
  }
});

// Delete a document
router.delete('/:id', authenticate, async (req, res) => {
  try {
    // Get document to delete file
    const { data: document, error: fetchError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Delete file if it exists
    if (document.url && document.url.startsWith('/uploads/')) {
      const filePath = path.join(process.cwd(), document.url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Delete from database
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    if (error) {
      throw error;
    }

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

// Background processing functions
async function processDocumentAsync(documentId, filePath, type) {
  try {
    let content = '';
    
    if (type === 'txt') {
      content = fs.readFileSync(filePath, 'utf8');
    } else {
      // For other file types, you might want to use libraries like pdf-parse, mammoth, etc.
      content = `Document content for ${type} files - processing not implemented yet`;
    }

    const context = await aiService.processDocumentForContext(content, type);
    
    await supabase
      .from('documents')
      .update({ 
        content,
        processed: true 
      })
      .eq('id', documentId);

    console.log(`Document ${documentId} processed successfully`);
  } catch (error) {
    console.error(`Error processing document ${documentId}:`, error);
    
    // Mark as processed even if AI processing fails
    await supabase
      .from('documents')
      .update({ processed: true })
      .eq('id', documentId);
  }
}

async function processUrlDocumentAsync(documentId, url) {
  try {
    // Fetch URL content (you might want to use a library like puppeteer for dynamic content)
    const response = await fetch(url);
    const content = await response.text();
    
    const context = await aiService.processDocumentForContext(content, 'url');
    
    await supabase
      .from('documents')
      .update({ 
        content,
        processed: true 
      })
      .eq('id', documentId);

    console.log(`URL document ${documentId} processed successfully`);
  } catch (error) {
    console.error(`Error processing URL document ${documentId}:`, error);
    
    // Mark as processed even if AI processing fails
    await supabase
      .from('documents')
      .update({ processed: true })
      .eq('id', documentId);
  }
}

export default router;