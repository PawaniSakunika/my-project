const express = require('express');
const router = express.Router();
const CompetitionRegistration = require('../models/CompetitionRegistration');
const Athlete = require('../models/Athlete');

// Get all registrations for a specific competition
router.get('/:competitionId', async (req, res) => {
  try {
    const registrations = await CompetitionRegistration.find({ competitionId: req.params.competitionId })
      .populate({
        path: 'athleteId',
        populate: {
          path: 'userId',
          select: 'firstName lastName gender'
        }
      })
      .sort({ createdAt: -1 });
    res.json(registrations);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create a new registration
router.post('/', async (req, res) => {
  try {
    const { competitionId, athleteId, club, entryTotal, isReserve } = req.body;

    // Check club limits for the specific competition
    const existingClubRegistrationsCount = await CompetitionRegistration.countDocuments({
      competitionId,
      club
    });

    if (existingClubRegistrationsCount >= 10) {
      return res.status(400).json({ message: 'Club registration limit (10 athletes) exceeded for this competition.' });
    }

    const newRegistration = new CompetitionRegistration({
      competitionId,
      athleteId,
      club,
      entryTotal,
      isReserve
    });

    const savedRegistration = await newRegistration.save();
    res.status(201).json(savedRegistration);
  } catch (error) {
    if (error.code === 11000) {
       return res.status(400).json({ message: 'Athlete is already registered for this competition.' });
    }
    res.status(500).json({ message: 'Error registering athlete', error: error.message });
  }
});

// Update registration
router.put('/:id', async (req, res) => {
  try {
    const { entryTotal, isReserve } = req.body;
    const updatedRegistration = await CompetitionRegistration.findByIdAndUpdate(
      req.params.id,
      { entryTotal, isReserve },
      { new: true }
    );

    if (!updatedRegistration) {
      return res.status(404).json({ message: 'Registration not found' });
    }
    res.json(updatedRegistration);
  } catch (error) {
    res.status(500).json({ message: 'Error updating registration', error: error.message });
  }
});

module.exports = router;
