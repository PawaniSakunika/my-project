const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Result = require('../models/Result');

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter to accept only PDF
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Get all results
router.get('/', async (req, res) => {
  try {
    const results = await Result.find().sort({ createdAt: -1 });
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create a new result
router.post('/', upload.single('resultPdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a PDF file' });
    }

    const { name, competitionDate, location } = req.body;
    
    // Construct the file path that will be accessible from the frontend
    // The server is already serving the 'uploads' folder statically
    const pdfFilePath = `/uploads/${req.file.filename}`;

    const newResult = new Result({
      name,
      competitionDate,
      location,
      pdfFilePath
    });

    const savedResult = await newResult.save();
    res.status(201).json(savedResult);
  } catch (error) {
    res.status(500).json({ message: 'Error creating result', error: error.message });
  }
});

// Update a result (excluding file for simplicity, or we can handle file update if needed)
router.put('/:id', upload.single('resultPdf'), async (req, res) => {
  try {
    const { name, competitionDate, location } = req.body;
    let updateData = { name, competitionDate, location };
    
    // If a new file is uploaded, update the file path
    if (req.file) {
      updateData.pdfFilePath = `/uploads/${req.file.filename}`;
    }

    const updatedResult = await Result.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!updatedResult) {
      return res.status(404).json({ message: 'Result not found' });
    }
    res.json(updatedResult);
  } catch (error) {
    res.status(500).json({ message: 'Error updating result', error: error.message });
  }
});

module.exports = router;
