const express = require('express');
const router = express.Router();
const WeightCategory = require('../models/WeightCategory');

// Get all weight categories (optionally filtered by year and status)
router.get('/', async (req, res) => {
  try {
    const { year, status } = req.query;
    const filter = {};
    if (year) filter.year = year;
    if (status) filter.status = status;
    
    const categories = await WeightCategory.find(filter).sort({ year: -1, category_name: 1 });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Add a new weight category
router.post('/add', async (req, res) => {
  try {
    const { category_name, year, status } = req.body;
    const newCategory = new WeightCategory({ category_name, year, status });
    await newCategory.save();
    res.json({ success: true, message: 'Weight category added successfully!', data: newCategory });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add weight category' });
  }
});

// Update an existing category
router.put('/update/:id', async (req, res) => {
  try {
    const { category_name, year, status } = req.body;
    const updated = await WeightCategory.findByIdAndUpdate(
      req.params.id, 
      { category_name, year, status },
      { new: true }
    );
    res.json({ success: true, message: 'Weight category updated!', data: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update weight category' });
  }
});

// Delete a category (optional, usually setting status to inactive is preferred)
router.delete('/delete/:id', async (req, res) => {
  try {
    await WeightCategory.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Weight category deleted!' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

module.exports = router;
