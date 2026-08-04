const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Coach = require('../models/coach');
const Referee = require('../models/referee');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 📝 REGISTER ROUTE
router.post('/register', async (req, res) => {
  try {
    const { username, email, nic, password, role } = req.body;

 
    let userExists = await User.findOne({ $or: [{ username }, { email }, { nic }] });
    if (userExists) {
      return res.status(400).json({ message: 'Username, Email or NIC already exists!' });
    }

 // hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    
    const approvalStatus = role === 'Admin' ? true : false;

    const newUser = new User({
      ...req.body,
      password: hashedPassword,
      isApproved: approvalStatus
    });

    await newUser.save();

    if (role === 'Coach') {
      await new Coach({ userId: newUser._id }).save().catch(() => {});
    } else if (role === 'Referee') {
      await new Referee({ userId: newUser._id }).save().catch(() => {});
    }

    res.status(201).json({
      message: approvalStatus
        ? 'Registration successful! You can log in now.'
        : 'Registration successful! Waiting for Admin approval.'
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 🔑 LOGIN ROUTE (UPDATED)
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: 'Invalid Username or Password!' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid Username or Password!' });
    }


    const checkApproval = user.role === 'Admin' ? true : user.isApproved;

    if (!checkApproval) {
      return res.status(403).json({ message: 'Your account is pending admin approval.' });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });

    res.json({
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        role: user.role,
        isApproved: checkApproval
      }
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
