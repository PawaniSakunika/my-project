const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Coach = require('../models/coach');
const Referee = require('../models/referee');
const Athlete = require('../models/Athlete');

// GET profile data for logged in user
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Fetch any profile records for this user
    const coachProfile = await Coach.findOne({ userId });
    const refereeProfile = await Referee.findOne({ userId });
    const athleteProfile = await Athlete.findOne({ userId });

    res.json({ user, coachProfile, refereeProfile, athleteProfile });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// UPDATE basic user info
router.put('/:userId/user-info', async (req, res) => {
  try {
    const { userId } = req.params;
    const { firstName, lastName, phone, address, email } = req.body;
    const updated = await User.findByIdAndUpdate(
      userId,
      { firstName, lastName, phone, address, email },
      { new: true }
    ).select('-password');
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Error updating user info', error: error.message });
  }
});

// ADD a secondary profile (Coach or Referee)
router.post('/add-secondary', async (req, res) => {
  try {
    const { userId, profileType } = req.body;

    if (profileType === 'Coach') {
      const existing = await Coach.findOne({ userId });
      if (existing) return res.status(400).json({ message: 'Coach profile already exists' });
      const newProfile = await new Coach({ userId }).save();
      return res.status(201).json({ message: 'Coach profile created', profile: newProfile });
    } else if (profileType === 'Referee') {
      const existing = await Referee.findOne({ userId });
      if (existing) return res.status(400).json({ message: 'Referee profile already exists' });
      const newProfile = await new Referee({ userId }).save();
      return res.status(201).json({ message: 'Referee profile created', profile: newProfile });
    }

    res.status(400).json({ message: 'Invalid profile type' });
  } catch (error) {
    res.status(500).json({ message: 'Error creating secondary profile', error: error.message });
  }
});

// SWITCH ACTIVE ROLE (between Coach and Referee)
router.put('/:userId/switch-role', async (req, res) => {
  try {
    const { userId } = req.params;
    const { newRole } = req.body;

    if (!['Coach', 'Referee'].includes(newRole)) {
      return res.status(400).json({ message: 'Role switching is only available between Coach and Referee.' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Ensure profile exists for the role being switched to
    if (newRole === 'Coach') {
      const coach = await Coach.findOne({ userId });
      if (!coach) {
        await new Coach({ userId }).save();
      }
    } else if (newRole === 'Referee') {
      const referee = await Referee.findOne({ userId });
      if (!referee) {
        await new Referee({ userId }).save();
      }
    }

    user.role = newRole;
    await user.save();

    const updatedUser = {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      email: user.email,
      role: user.role,
      isApproved: user.isApproved
    };

    res.json({ message: `Switched active role to ${newRole}`, user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: 'Error switching active role', error: error.message });
  }
});

// CHANGE PASSWORD
router.put('/:userId/change-password', async (req, res) => {
  try {
    const { userId } = req.params;
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await User.findByIdAndUpdate(userId, { password: hashedPassword });
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error changing password', error: error.message });
  }
});

// CHANGE USERNAME
router.put('/:userId/change-username', async (req, res) => {
  try {
    const { userId } = req.params;
    const { newUsername } = req.body;

    const existing = await User.findOne({ username: newUsername });
    if (existing && existing._id.toString() !== userId) {
      return res.status(400).json({ message: 'Username already taken' });
    }

    const updated = await User.findByIdAndUpdate(userId, { username: newUsername }, { new: true }).select('-password');
    res.json({ message: 'Username changed successfully', user: updated });
  } catch (error) {
    res.status(500).json({ message: 'Error changing username', error: error.message });
  }
});

module.exports = router;
