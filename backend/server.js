const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

const authRoutes = require('./routes/auth');
const athleteRoutes = require('./routes/athlete');
const adminRoutes = require('./routes/admin');
const weightCategoryRoutes = require('./routes/weightCategory');
const competitionRoutes = require('./routes/competition');
const registrationRoutes = require('./routes/registration');
const resultRoutes = require('./routes/result');
const clubRoutes = require('./routes/club');
const profileRoutes = require('./routes/profile');
const newsRoutes    = require('./routes/news');
const Athlete = require('./models/Athlete');
const User = require('./models/User');

dotenv.config();

const app = express();

const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:3000', 'http://localhost:3001'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true
}));
app.use(express.json());

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes connect
app.use('/api/auth', authRoutes);
app.use('/api/athletes', athleteRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/weight-categories', weightCategoryRoutes);
app.use('/api/competitions', competitionRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/clubs', clubRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/news',    newsRoutes);

app.get('/', (req, res) => {
  res.send('SLWF Backend Server is Running Successfully!');
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/SLWF_Project';

const cleanupDuplicateAthletes = async () => {
  const orphanedAthletes = await Athlete.aggregate([
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'user'
      }
    },
    { $match: { user: { $size: 0 } } },
    { $project: { _id: 1 } }
  ]);

  const orphanedIds = orphanedAthletes.map(athlete => athlete._id);
  if (orphanedIds.length > 0) {
    await Athlete.deleteMany({ _id: { $in: orphanedIds } });
    console.log(`Removed ${orphanedIds.length} athlete record(s) without a valid user.`);
  }

  const duplicateGroups = await Athlete.aggregate([
    { $sort: { updatedAt: -1, createdAt: -1, _id: -1 } },
    { $group: { _id: '$userId', athleteIds: { $push: '$_id' }, count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } }
  ]);

  const duplicateIds = duplicateGroups.flatMap(group => group.athleteIds.slice(1));

  if (duplicateIds.length > 0) {
    await Athlete.deleteMany({ _id: { $in: duplicateIds } });
    console.log(`Removed ${duplicateIds.length} duplicate athlete record(s).`);
  }
};

mongoose.connect(MONGO_URI, {
  dbName: process.env.MONGO_DB || 'SLWF_Project',
  autoIndex: false
})
  .then(async () => {
    console.log('MongoDB connection established successfully to SLWF_Project!');
    await cleanupDuplicateAthletes();
    await Athlete.syncIndexes();
    await User.syncIndexes();
    app.listen(PORT, () => {
      console.log(`Server is running on port: ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Database connection error: ', err);
  });
