const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Item = require('../models/Item');
const { authenticate } = require('../middleware/auth');

// Multer config for images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/items');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}${path.extname(file.originalname)}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|gif/;
    const isAllowed = allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype);
    isAllowed ? cb(null, true) : cb(new Error('Only image files are allowed'));
  }
});

// Get all items with search, filter, pagination
router.get('/', async (req, res) => {
  try {
    const { search, category, condition, listingType, minValue, maxValue, minPrice, maxPrice, location, sort, page = 1, limit = 12, owner } = req.query;
    const query = { status: 'available' };

    if (search) {
      query.$text = { $search: search };
    }
    if (category && category !== 'All') query.category = category;
    if (condition && condition !== 'All') query.condition = condition;
    if (listingType && listingType !== 'all') query.listingType = listingType;
    if (location && location !== 'all') {
      query.location = { $regex: location, $options: 'i' };
    }
    if (minValue) query.estimatedValue = { ...query.estimatedValue, $gte: Number(minValue) };
    if (maxValue) query.estimatedValue = { ...query.estimatedValue, $lte: Number(maxValue) };
    if (minPrice) query.price = { ...query.price, $gte: Number(minPrice) };
    if (maxPrice) query.price = { ...query.price, $lte: Number(maxPrice) };
    if (owner) query.owner = owner;

    const sortOptions = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      valueHigh: { estimatedValue: -1 },
      valueLow: { estimatedValue: 1 },
      mostViewed: { views: -1 }
    };

    const items = await Item.find(query)
      .populate('owner', 'username avatar rating location')
      .sort(sortOptions[sort] || sortOptions.newest)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Item.countDocuments(query);

    res.json({
      success: true,
      items,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / limit),
        limit: Number(limit)
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get favorites / liked items for current user
router.get('/user/favorites', authenticate, async (req, res) => {
  try {
    const items = await Item.find({
      likes: req.user._id,
      status: 'available'
    })
      .populate('owner', 'username avatar rating location')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: items.length, items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get single item
router.get('/:id', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id)
      .populate('owner', 'username avatar rating location bio completedTrades joinedAt');
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

    // Increment views
    item.views += 1;
    await item.save();

    res.json({ success: true, item });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create item
router.post('/', authenticate, upload.array('images', 5), async (req, res) => {
  try {
    const {
      title, description, category, condition, estimatedValue,
      listingType, price, rentPrice, rentPeriod, deposit,
      lookingFor, tags, location
    } = req.body;

    const images = req.files ? req.files.map(f => `/uploads/items/${f.filename}`) : [];

    const item = new Item({
      title, description, category, condition,
      estimatedValue: Number(estimatedValue) || 0,
      listingType: listingType || 'barter',
      price: Number(price) || 0,
      rentPrice: Number(rentPrice) || 0,
      rentPeriod: rentPeriod || 'day',
      deposit: Number(deposit) || 0,
      lookingFor: lookingFor || '',
      tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim())) : [],
      images,
      owner: req.user._id,
      location: location || req.user.location || ''
    });

    await item.save();
    await item.populate('owner', 'username avatar rating');

    res.status(201).json({ success: true, message: 'Item posted successfully!', item });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update item
router.put('/:id', authenticate, upload.array('images', 5), async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
    if (item.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const updates = { ...req.body };
    if (req.files && req.files.length > 0) {
      updates.images = req.files.map(f => `/uploads/items/${f.filename}`);
    }
    if (updates.tags && typeof updates.tags === 'string') {
      updates.tags = updates.tags.split(',').map(t => t.trim());
    }

    Object.assign(item, updates);
    await item.save();

    res.json({ success: true, message: 'Item updated!', item });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete item
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
    if (item.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    await item.deleteOne();
    res.json({ success: true, message: 'Item deleted!' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Toggle like
router.post('/:id/like', authenticate, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

    const userId = req.user._id;
    const likedIndex = item.likes.indexOf(userId);

    if (likedIndex > -1) {
      item.likes.splice(likedIndex, 1);
    } else {
      item.likes.push(userId);
    }
    await item.save();

    res.json({ success: true, liked: likedIndex === -1, likesCount: item.likes.length });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
