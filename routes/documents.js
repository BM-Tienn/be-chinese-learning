const express = require('express');
const fs = require('fs').promises;
const router = express.Router();

const Document = require('../models/Document');
const DocumentProcessor = require('../services/documentProcessor');
const upload = require('../middleware/upload');

// Upload document
router.post('/upload', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const content = await DocumentProcessor.extractText(filePath, req.file.mimetype);
    
    // Save document first to get ID for pre-analysis
    const document = new Document({
      filename: req.file.filename,
      originalName: req.file.originalname,
      content,
      segments: [] // Temporarily empty
    });

    await document.save();

    // Process with AI and pre-analysis (background word analysis)
    const segments = await DocumentProcessor.processWithPreAnalysis(content, document._id);
    
    // Update document with processed segments
    document.segments = segments;
    await document.save();

    // Clean up uploaded file
    await fs.unlink(filePath);

    res.json({
      success: true,
      document: {
        id: document._id,
        originalName: document.originalName,
        segmentCount: segments.length,
        processedAt: document.processedAt
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to process document' });
  }
});

// Get all documents
router.get('/', async (req, res) => {
  try {
    const documents = await Document.find({}, {
      content: 0,
      segments: 0
    }).sort({ processedAt: -1 });

    const documentsWithStats = await Promise.all(
      documents.map(async (doc) => {
        const segmentCount = await Document.findById(doc._id, { segments: 1 });
        return {
          ...doc.toObject(),
          segmentCount: segmentCount.segments.length
        };
      })
    );

    res.json(documentsWithStats);
  } catch (error) {
    console.error('Fetch documents error:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// Get specific document
router.get('/:id', async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.json(document);
  } catch (error) {
    console.error('Fetch document error:', error);
    res.status(500).json({ error: 'Failed to fetch document' });
  }
});

module.exports = router; 