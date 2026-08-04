const express = require('express');
const router  = express.Router();
const News    = require('../models/News');

// GET all published news (newest first)
router.get('/', async (req, res) => {
  try {
    const news = await News.find({ isPublished: true }).sort({ createdAt: -1 });
    res.json(news);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET all news (admin — includes unpublished)
router.get('/all', async (req, res) => {
  try {
    const news = await News.find().sort({ createdAt: -1 });
    res.json(news);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET single news by id
router.get('/:id', async (req, res) => {
  try {
    const news = await News.findById(req.params.id);
    if (!news) return res.status(404).json({ message: 'News not found' });
    res.json(news);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create news (admin only)
router.post('/', async (req, res) => {
  try {
    const { title, content, category, imageUrl, author, postedBy } = req.body;
    if (!title || !content) return res.status(400).json({ message: 'Title and content are required' });

    const news = new News({ title, content, category, imageUrl, author, postedBy });
    await news.save();
    res.status(201).json({ message: 'News created successfully', news });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT update news
router.put('/:id', async (req, res) => {
  try {
    const { title, content, category, imageUrl, author, isPublished } = req.body;
    const updated = await News.findByIdAndUpdate(
      req.params.id,
      { title, content, category, imageUrl, author, isPublished },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: 'News not found' });
    res.json({ message: 'News updated', news: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE news
router.delete('/:id', async (req, res) => {
  try {
    await News.findByIdAndDelete(req.params.id);
    res.json({ message: 'News deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
