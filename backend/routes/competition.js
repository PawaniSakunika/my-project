const express = require('express');
const router = express.Router();
const Competition = require('../models/Competition');

// Get all competitions
router.get('/', async (req, res) => {
  try {
    const competitions = await Competition.find().sort({ createdAt: -1 });
    res.json(competitions);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create a new competition
router.post('/', async (req, res) => {
  try {
    const newCompetition = new Competition(req.body);
    const savedCompetition = await newCompetition.save();
    res.status(201).json(savedCompetition);
  } catch (error) {
    res.status(500).json({ message: 'Error creating competition', error: error.message });
  }
});

// Update a competition
router.put('/:id', async (req, res) => {
  try {
    const updatedCompetition = await Competition.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedCompetition) {
      return res.status(404).json({ message: 'Competition not found' });
    }
    res.json(updatedCompetition);
  } catch (error) {
    res.status(500).json({ message: 'Error updating competition', error: error.message });
  }
});

module.exports = router;
