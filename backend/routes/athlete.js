const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Athlete = require('../models/Athlete');
const Coach = require('../models/coach');
const Referee = require('../models/referee');
const User = require('../models/User'); 
const upload = require('../middleware/upload');

const buildAthletePayload = (body) => {
  const bestSnatch = Number(body.bestSnatch) || 0;
  const bestCleanAndJerk = Number(body.bestCleanAndJerk) || 0;

  return {
    userId: body.userId,
    weightClass: body.weightClass,
    bestSnatch,
    bestCleanAndJerk,
    bestTotal: bestSnatch + bestCleanAndJerk,
    selectedCoach: body.selectedCoach,
    awards: body.awards,
    province: body.province,
    district: body.district,
    postalCode: body.postalCode,
    addressLine1: body.addressLine1,
    addressLine2: body.addressLine2,
    city: body.city
  };
};

const getUniqueAthletes = async () => {
  const athletes = await Athlete.aggregate([
    { $sort: { updatedAt: -1, createdAt: -1, _id: -1 } },
    { $group: { _id: '$userId', athlete: { $first: '$$ROOT' } } },
    { $replaceRoot: { newRoot: '$athlete' } },
    { $sort: { updatedAt: -1, createdAt: -1, _id: -1 } }
  ]);

  const populatedAthletes = await Athlete.populate(athletes, {
    path: 'userId',
    select: 'firstName lastName gender birthday nic passport phone email'
  });

  return populatedAthletes.filter(athlete => athlete.userId);
};

const removeDuplicateAthletesForUser = async (userId, keepAthleteId) => {
  if (!userId || !keepAthleteId) return;

  await Athlete.deleteMany({
    userId,
    _id: { $ne: keepAthleteId }
  });
};

const buildCoachPayload = (body) => ({
  userId: body.userId,
  localLicenceNumber: body.localLicenceNumber,
  internationalLicenceNumber: body.internationalLicenceNumber,
  province: body.province,
  district: body.district,
  postalCode: body.postalCode,
  addressLine1: body.addressLine1,
  addressLine2: body.addressLine2,
  city: body.city,
  status: body.status || 'Active'
});

const getUniqueCoaches = async () => {
  const coaches = await Coach.aggregate([
    { $sort: { updatedAt: -1, createdAt: -1, _id: -1 } },
    { $group: { _id: '$userId', coach: { $first: '$$ROOT' } } },
    { $replaceRoot: { newRoot: '$coach' } },
    { $sort: { updatedAt: -1, createdAt: -1, _id: -1 } }
  ]);

  const populatedCoaches = await Coach.populate(coaches, {
    path: 'userId',
    select: 'firstName lastName gender birthday nic phone email username isApproved'
  });

  return populatedCoaches.filter(coach => coach.userId);
};

const removeDuplicateCoachesForUser = async (userId, keepCoachId) => {
  if (!userId || !keepCoachId) return;

  await Coach.deleteMany({
    userId,
    _id: { $ne: keepCoachId }
  });
};

const buildRefereePayload = (body) => ({
  userId: body.userId,
  localLicenceNumber: body.localLicenceNumber,
  internationalLicenceNumber: body.internationalLicenceNumber,
  gradeCategory: body.gradeCategory || 'Grade III',
  province: body.province,
  district: body.district,
  postalCode: body.postalCode,
  addressLine1: body.addressLine1,
  addressLine2: body.addressLine2,
  city: body.city,
  status: body.status || 'Active'
});

const getUniqueReferees = async () => {
  const referees = await Referee.aggregate([
    { $sort: { updatedAt: -1, createdAt: -1, _id: -1 } },
    { $group: { _id: '$userId', referee: { $first: '$$ROOT' } } },
    { $replaceRoot: { newRoot: '$referee' } },
    { $sort: { updatedAt: -1, createdAt: -1, _id: -1 } }
  ]);

  const populatedReferees = await Referee.populate(referees, {
    path: 'userId',
    select: 'firstName lastName gender birthday nic phone email username isApproved'
  });

  return populatedReferees.filter(referee => referee.userId);
};

const removeDuplicateRefereesForUser = async (userId, keepRefereeId) => {
  if (!userId || !keepRefereeId) return;

  await Referee.deleteMany({
    userId,
    _id: { $ne: keepRefereeId }
  });
};

const updateWeightHistory = (existingHistory, currentWeightClass) => {
  const currentYear = new Date().getFullYear();
  let history = existingHistory || [];
  
  if (history.length > 0) {
    const lastEntry = history[history.length - 1];
    if (lastEntry.year === currentYear) {
      lastEntry.weightClass = currentWeightClass;
    } else {
      history.push({ year: currentYear, weightClass: currentWeightClass });
    }
  } else {
    history.push({ year: currentYear, weightClass: currentWeightClass });
  }
  return history;
};

// 1. ADD NEW ATHLETE 
router.post('/add', upload.fields([{ name: 'photo' }, { name: 'passport' }]), async (req, res) => {
  try {
    const athletePayload = buildAthletePayload(req.body);

    if (req.files && req.files['photo']) {
      athletePayload.photoUrl = '/uploads/' + req.files['photo'][0].filename;
    }
    if (req.files && req.files['passport']) {
      athletePayload.passportUrl = '/uploads/' + req.files['passport'][0].filename;
    }

    if (!athletePayload.userId) {
      return res.status(400).json({ success: false, message: 'Athlete user is required' });
    }

    if (!mongoose.Types.ObjectId.isValid(athletePayload.userId)) {
      return res.status(400).json({ success: false, message: 'Invalid athlete user ID' });
    }

    const athleteUser = await User.findOne({ _id: athletePayload.userId, role: 'Athlete' });
    if (!athleteUser) {
      return res.status(400).json({ success: false, message: 'Please select a valid registered athlete user' });
    }

    let existingAthlete = await Athlete.findOne({ userId: athletePayload.userId });
    
    if (existingAthlete) {
      athletePayload.weightHistory = updateWeightHistory(existingAthlete.weightHistory, athletePayload.weightClass);
      // Keep existing files if not overwritten
      if (!athletePayload.photoUrl && existingAthlete.photoUrl) athletePayload.photoUrl = existingAthlete.photoUrl;
      if (!athletePayload.passportUrl && existingAthlete.passportUrl) athletePayload.passportUrl = existingAthlete.passportUrl;
    } else {
      athletePayload.weightHistory = [{ year: new Date().getFullYear(), weightClass: athletePayload.weightClass }];
    }

    const savedAthlete = await Athlete.findOneAndUpdate(
      { userId: athletePayload.userId },
      athletePayload,
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    await removeDuplicateAthletesForUser(savedAthlete.userId, savedAthlete._id);

    res.status(existingAthlete ? 200 : 201).json({
      success: true,
      message: existingAthlete ? 'Athlete updated successfully!' : 'Athlete added successfully!',
      data: savedAthlete
    });
  } catch (error) {
    console.error("Error in adding athlete:", error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
});

// 2. UPDATE ATHLETE DETAILS 
router.put('/update/:id', upload.fields([{ name: 'photo' }, { name: 'passport' }]), async (req, res) => {
  try {
    const athletePayload = buildAthletePayload(req.body);
    delete athletePayload.userId;

    if (req.files && req.files['photo']) {
      athletePayload.photoUrl = '/uploads/' + req.files['photo'][0].filename;
    }
    if (req.files && req.files['passport']) {
      athletePayload.passportUrl = '/uploads/' + req.files['passport'][0].filename;
    }

    const existingAthlete = await Athlete.findById(req.params.id);
    if (!existingAthlete) {
      return res.status(404).json({ success: false, message: 'Athlete not found' });
    }

    athletePayload.weightHistory = updateWeightHistory(existingAthlete.weightHistory, athletePayload.weightClass);

    // Keep existing files if not overwritten
    if (!athletePayload.photoUrl && existingAthlete.photoUrl) athletePayload.photoUrl = existingAthlete.photoUrl;
    if (!athletePayload.passportUrl && existingAthlete.passportUrl) athletePayload.passportUrl = existingAthlete.passportUrl;

    const updatedAthlete = await Athlete.findByIdAndUpdate(
      req.params.id,
      athletePayload,
      { new: true, runValidators: true } 
    );

    await removeDuplicateAthletesForUser(updatedAthlete.userId, updatedAthlete._id);

    res.status(200).json({ success: true, message: 'Athlete updated successfully!', data: updatedAthlete });
  } catch (error) {
    console.error("Error in updating athlete:", error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
});

// 3. GET ALL ATHLETES 
router.get('/all', async (req, res) => {
  try {
    const athletes = await getUniqueAthletes();
    res.status(200).json(athletes);
  } catch (error) {
    console.error("Error fetching athletes:", error);
    res.status(500).json({ message: 'Server Error' });
  }
});

router.get('/coaches/all', async (req, res) => {
  try {
    const coaches = await getUniqueCoaches();
    res.status(200).json(coaches);
  } catch (error) {
    console.error("Error fetching coach profiles:", error);
    res.status(500).json({ message: 'Server Error' });
  }
});

router.post(
  '/coaches/add',
  upload.fields([{ name: 'photo' }, { name: 'localLicence' }, { name: 'internationalLicence' }]),
  async (req, res) => {
    try {
      const coachPayload = buildCoachPayload(req.body);

      if (req.files && req.files['photo']) {
        coachPayload.photoUrl = '/uploads/' + req.files['photo'][0].filename;
      }
      if (req.files && req.files['localLicence']) {
        coachPayload.localLicenceUrl = '/uploads/' + req.files['localLicence'][0].filename;
      }
      if (req.files && req.files['internationalLicence']) {
        coachPayload.internationalLicenceUrl = '/uploads/' + req.files['internationalLicence'][0].filename;
      }

      if (!coachPayload.userId) {
        return res.status(400).json({ success: false, message: 'Coach user is required' });
      }

      if (!mongoose.Types.ObjectId.isValid(coachPayload.userId)) {
        return res.status(400).json({ success: false, message: 'Invalid coach user ID' });
      }

      const coachUser = await User.findOne({ _id: coachPayload.userId, role: 'Coach' });
      if (!coachUser) {
        return res.status(400).json({ success: false, message: 'Please select a valid registered coach user' });
      }

      const existingCoach = await Coach.findOne({ userId: coachPayload.userId });
      if (existingCoach) {
        if (!coachPayload.photoUrl && existingCoach.photoUrl) coachPayload.photoUrl = existingCoach.photoUrl;
        if (!coachPayload.localLicenceUrl && existingCoach.localLicenceUrl) coachPayload.localLicenceUrl = existingCoach.localLicenceUrl;
        if (!coachPayload.internationalLicenceUrl && existingCoach.internationalLicenceUrl) coachPayload.internationalLicenceUrl = existingCoach.internationalLicenceUrl;
      }

      const savedCoach = await Coach.findOneAndUpdate(
        { userId: coachPayload.userId },
        coachPayload,
        { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
      );
      await removeDuplicateCoachesForUser(savedCoach.userId, savedCoach._id);

      res.status(existingCoach ? 200 : 201).json({
        success: true,
        message: existingCoach ? 'Coach updated successfully!' : 'Coach added successfully!',
        data: savedCoach
      });
    } catch (error) {
      console.error("Error in adding coach:", error);
      res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
  }
);

router.put(
  '/coaches/update/:id',
  upload.fields([{ name: 'photo' }, { name: 'localLicence' }, { name: 'internationalLicence' }]),
  async (req, res) => {
    try {
      const coachPayload = buildCoachPayload(req.body);
      delete coachPayload.userId;

      if (req.files && req.files['photo']) {
        coachPayload.photoUrl = '/uploads/' + req.files['photo'][0].filename;
      }
      if (req.files && req.files['localLicence']) {
        coachPayload.localLicenceUrl = '/uploads/' + req.files['localLicence'][0].filename;
      }
      if (req.files && req.files['internationalLicence']) {
        coachPayload.internationalLicenceUrl = '/uploads/' + req.files['internationalLicence'][0].filename;
      }

      const existingCoach = await Coach.findById(req.params.id);
      if (!existingCoach) {
        return res.status(404).json({ success: false, message: 'Coach not found' });
      }

      if (!coachPayload.photoUrl && existingCoach.photoUrl) coachPayload.photoUrl = existingCoach.photoUrl;
      if (!coachPayload.localLicenceUrl && existingCoach.localLicenceUrl) coachPayload.localLicenceUrl = existingCoach.localLicenceUrl;
      if (!coachPayload.internationalLicenceUrl && existingCoach.internationalLicenceUrl) coachPayload.internationalLicenceUrl = existingCoach.internationalLicenceUrl;

      const updatedCoach = await Coach.findByIdAndUpdate(
        req.params.id,
        coachPayload,
        { new: true, runValidators: true }
      );

      await removeDuplicateCoachesForUser(updatedCoach.userId, updatedCoach._id);

      res.status(200).json({ success: true, message: 'Coach updated successfully!', data: updatedCoach });
    } catch (error) {
      console.error("Error in updating coach:", error);
      res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
  }
);

router.get('/referees/all', async (req, res) => {
  try {
    const referees = await getUniqueReferees();
    res.status(200).json(referees);
  } catch (error) {
    console.error("Error fetching referee profiles:", error);
    res.status(500).json({ message: 'Server Error' });
  }
});

router.post(
  '/referees/add',
  upload.fields([{ name: 'photo' }, { name: 'localLicence' }, { name: 'internationalLicence' }]),
  async (req, res) => {
    try {
      const refereePayload = buildRefereePayload(req.body);

      if (req.files && req.files['photo']) {
        refereePayload.photoUrl = '/uploads/' + req.files['photo'][0].filename;
      }
      if (req.files && req.files['localLicence']) {
        refereePayload.localLicenceUrl = '/uploads/' + req.files['localLicence'][0].filename;
      }
      if (req.files && req.files['internationalLicence']) {
        refereePayload.internationalLicenceUrl = '/uploads/' + req.files['internationalLicence'][0].filename;
      }

      if (!refereePayload.userId) {
        return res.status(400).json({ success: false, message: 'Referee user is required' });
      }

      if (!mongoose.Types.ObjectId.isValid(refereePayload.userId)) {
        return res.status(400).json({ success: false, message: 'Invalid referee user ID' });
      }

      const refereeUser = await User.findOne({ _id: refereePayload.userId, role: 'Referee' });
      if (!refereeUser) {
        return res.status(400).json({ success: false, message: 'Please select a valid registered referee user' });
      }

      const existingReferee = await Referee.findOne({ userId: refereePayload.userId });
      if (existingReferee) {
        if (!refereePayload.photoUrl && existingReferee.photoUrl) refereePayload.photoUrl = existingReferee.photoUrl;
        if (!refereePayload.localLicenceUrl && existingReferee.localLicenceUrl) refereePayload.localLicenceUrl = existingReferee.localLicenceUrl;
        if (!refereePayload.internationalLicenceUrl && existingReferee.internationalLicenceUrl) refereePayload.internationalLicenceUrl = existingReferee.internationalLicenceUrl;
      }

      const savedReferee = await Referee.findOneAndUpdate(
        { userId: refereePayload.userId },
        refereePayload,
        { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
      );
      await removeDuplicateRefereesForUser(savedReferee.userId, savedReferee._id);

      res.status(existingReferee ? 200 : 201).json({
        success: true,
        message: existingReferee ? 'Referee updated successfully!' : 'Referee added successfully!',
        data: savedReferee
      });
    } catch (error) {
      console.error("Error in adding referee:", error);
      res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
  }
);

router.put(
  '/referees/update/:id',
  upload.fields([{ name: 'photo' }, { name: 'localLicence' }, { name: 'internationalLicence' }]),
  async (req, res) => {
    try {
      const refereePayload = buildRefereePayload(req.body);
      delete refereePayload.userId;

      if (req.files && req.files['photo']) {
        refereePayload.photoUrl = '/uploads/' + req.files['photo'][0].filename;
      }
      if (req.files && req.files['localLicence']) {
        refereePayload.localLicenceUrl = '/uploads/' + req.files['localLicence'][0].filename;
      }
      if (req.files && req.files['internationalLicence']) {
        refereePayload.internationalLicenceUrl = '/uploads/' + req.files['internationalLicence'][0].filename;
      }

      const existingReferee = await Referee.findById(req.params.id);
      if (!existingReferee) {
        return res.status(404).json({ success: false, message: 'Referee not found' });
      }

      if (!refereePayload.photoUrl && existingReferee.photoUrl) refereePayload.photoUrl = existingReferee.photoUrl;
      if (!refereePayload.localLicenceUrl && existingReferee.localLicenceUrl) refereePayload.localLicenceUrl = existingReferee.localLicenceUrl;
      if (!refereePayload.internationalLicenceUrl && existingReferee.internationalLicenceUrl) refereePayload.internationalLicenceUrl = existingReferee.internationalLicenceUrl;

      const updatedReferee = await Referee.findByIdAndUpdate(
        req.params.id,
        refereePayload,
        { new: true, runValidators: true }
      );

      await removeDuplicateRefereesForUser(updatedReferee.userId, updatedReferee._id);

      res.status(200).json({ success: true, message: 'Referee updated successfully!', data: updatedReferee });
    } catch (error) {
      console.error("Error in updating referee:", error);
      res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
  }
);


router.get('/users/athletes', async (req, res) => {
  try {
    const athletes = await User.find({ role: 'Athlete' }).select('_id firstName lastName gender birthday nic passport phone email province district postalCode');
    res.status(200).json(athletes);
  } catch (error) {
    console.error("Error fetching athletes:", error);
    res.status(500).json({ message: 'Error fetching athletes' });
  }
});

router.get('/users/coaches', async (req, res) => {
  try {
    const coaches = await User.find({ role: 'Coach' })
      .select('_id firstName lastName gender birthday nic phone email address username isApproved createdAt');
    res.status(200).json(coaches);
  } catch (error) {
    console.error("Error fetching coaches:", error);
    res.status(500).json({ message: 'Error fetching coaches' });
  }
});

router.get('/users/referees', async (req, res) => {
  try {
    const referees = await User.find({ role: 'Referee' })
      .select('_id firstName lastName gender birthday nic phone email address username isApproved createdAt');
    res.status(200).json(referees);
  } catch (error) {
    console.error("Error fetching referees:", error);
    res.status(500).json({ message: 'Error fetching referees' });
  }
});

module.exports = router;
