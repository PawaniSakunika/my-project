const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Coach = require('../models/coach');
const Referee = require('../models/referee');
const Athlete = require('../models/Athlete');

// 1. Pending Users 
router.get('/pending-users', async (req, res) => {
    try {
        const pending = await User.find({ isApproved: false });
        res.status(200).json(pending);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// 2. Add new Admin 
router.post('/add-admin', async (req, res) => {
    try {
        const { firstName, lastName, username, password, nic, email, phone, address, birthday, gender } = req.body;

        // 1. check already exists Username 
        const userExists = await User.findOne({ username });
        if (userExists) {
            return res.status(400).json({ error: "Username already exists" });
        }

        // 2.  Password into Hash  
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        
        const newAdmin = new User({
            firstName: firstName || "Admin",
            lastName: lastName || "User",
            username: username,
            password: hashedPassword, //hash password
            nic: nic,
            email: email,
            phone: phone || "0000000000",
            address: address || "N/A",
            birthday: birthday || "2000-01-01",
            gender: gender || "Male",
            role: 'Admin',
            isApproved: true
        });

        await newAdmin.save();
        res.status(201).json({ message: "Admin added successfully!" });
    } catch (err) {
        console.error("Backend Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// 3. Approve User 
router.put('/approve/:id', async (req, res) => {
    try {
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            { isApproved: true },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Auto-create profile record based on role
        if (updatedUser.role === 'Coach') {
            const existingCoach = await Coach.findOne({ userId: updatedUser._id });
            if (!existingCoach) {
                await new Coach({ userId: updatedUser._id }).save();
            }
        } else if (updatedUser.role === 'Referee') {
            const existingReferee = await Referee.findOne({ userId: updatedUser._id });
            if (!existingReferee) {
                await new Referee({ userId: updatedUser._id }).save();
            }
        } else if (updatedUser.role === 'Athlete') {
            const existingAthlete = await Athlete.findOne({ userId: updatedUser._id });
            if (!existingAthlete) {
                await new Athlete({
                    userId: updatedUser._id,
                    weightClass: 'N/A',
                    bestSnatch: 0,
                    bestCleanAndJerk: 0,
                    bestTotal: 0,
                    selectedCoach: 'N/A'
                }).save();
            }
        }

        res.status(200).json({ message: "User approved successfully!", updatedUser });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// 4. User Reject (Delete) 
router.delete('/reject/:id', async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "User rejected and deleted successfully!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});


// 5. Dashboard count
router.get('/dashboard-counts', async (req, res) => {
    try {
        // Approve  count 
        const athletesCount = await User.countDocuments({ role: 'Athlete', isApproved: true });
        const coachesCount = await User.countDocuments({ role: 'Coach', isApproved: true });
        const refereesCount = await User.countDocuments({ role: 'Referee', isApproved: true });
        
        // Admin approve 
        const adminsCount = await User.countDocuments({ role: 'Admin' });

        res.status(200).json({
            athletes: athletesCount,
            coaches: coachesCount,
            referees: refereesCount,
            admins: adminsCount
        });
    } catch (err) {
        console.error("Dashboard count error:", err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;