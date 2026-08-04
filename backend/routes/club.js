const express = require('express');
const router = express.Router();
const Club = require('../models/Club');

// Get all clubs
router.get('/', async (req, res) => {
  try {
    const { role } = req.query; // pass role from frontend
    let query = {};
    
    // Only Admin can see unapproved clubs
    if (role !== 'Admin') {
      query.isApproved = true;
    }

    const clubs = await Club.find(query).sort({ createdAt: -1 });
    res.json(clubs);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create a new club (registration)
router.post('/', async (req, res) => {
  try {
    const newClub = new Club({
      ...req.body,
      isApproved: false, // Force false initially
      isActive: true
    });
    const savedClub = await newClub.save();
    res.status(201).json(savedClub);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'A club with this name already exists.' });
    }
    res.status(500).json({ message: 'Error registering club', error: error.message });
  }
});

// Update a club
router.put('/:id', async (req, res) => {
  try {
    // Prevent overriding approval status via basic update
    const updateData = { ...req.body };
    delete updateData.isApproved;
    delete updateData.isActive;

    const updatedClub = await Club.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    if (!updatedClub) {
      return res.status(404).json({ message: 'Club not found' });
    }
    res.json(updatedClub);
  } catch (error) {
    res.status(500).json({ message: 'Error updating club', error: error.message });
  }
});

// Approve a club (Admin only)
router.put('/:id/approve', async (req, res) => {
  try {
    const updatedClub = await Club.findByIdAndUpdate(
      req.params.id,
      { isApproved: true },
      { new: true }
    );
    if (!updatedClub) {
      return res.status(404).json({ message: 'Club not found' });
    }
    res.json(updatedClub);
  } catch (error) {
    res.status(500).json({ message: 'Error approving club', error: error.message });
  }
});

// Toggle Active status (Admin only)
router.put('/:id/toggle-active', async (req, res) => {
  try {
    const { isActive } = req.body;
    const updatedClub = await Club.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    );
    if (!updatedClub) {
      return res.status(404).json({ message: 'Club not found' });
    }
    res.json(updatedClub);
  } catch (error) {
    res.status(500).json({ message: 'Error toggling club status', error: error.message });
  }
});

module.exports = router;
