const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Item = require('../models/Item');
const Trade = require('../models/Trade');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticate } = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/avatars');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `avatar-${req.user._id}-${Date.now()}${path.extname(file.originalname)}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 2 * 1024 * 1024 } });

// Get user profile
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const items = await Item.find({ owner: req.params.id, status: 'available' })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({ success: true, user, items });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update profile
router.put('/profile/update', authenticate, upload.single('avatar'), async (req, res) => {
  try {
    const { bio, location, username } = req.body;
    const updates = {};

    if (bio !== undefined) updates.bio = bio;
    if (location !== undefined) updates.location = location;
    if (username) {
      const existing = await User.findOne({ username, _id: { $ne: req.user._id } });
      if (existing) return res.status(400).json({ success: false, message: 'Username taken' });
      updates.username = username;
    }
    if (req.file) {
      updates.avatar = `/uploads/avatars/${req.file.filename}`;
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-password');
    res.json({ success: true, message: 'Profile updated!', user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get reviews for a user
router.get('/:id/reviews', async (req, res) => {
  try {
    const userId = req.params.id;
    const trades = await Trade.find({
      status: 'completed',
      $or: [{ proposer: userId }, { receiver: userId }]
    })
      .populate('proposer', 'username avatar location')
      .populate('receiver', 'username avatar location')
      .sort({ completedAt: -1 })
      .limit(30);

    const reviews = [];
    for (const t of trades) {
      if (t.proposer && t.proposer._id.toString() === userId) {
        if (t.rating && t.rating.receiverRating) {
          reviews.push({
            tradeId: t._id,
            reviewer: t.receiver,
            rating: t.rating.receiverRating,
            review: t.rating.receiverReview || '',
            createdAt: t.completedAt || t.updatedAt
          });
        }
      } else if (t.receiver && t.receiver._id.toString() === userId) {
        if (t.rating && t.rating.proposerRating) {
          reviews.push({
            tradeId: t._id,
            reviewer: t.proposer,
            rating: t.rating.proposerRating,
            review: t.rating.proposerReview || '',
            createdAt: t.completedAt || t.updatedAt
          });
        }
      }
    }

    res.json({ success: true, count: reviews.length, reviews });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Search users
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    const query = search ? { username: { $regex: search, $options: 'i' } } : {};
    const users = await User.find(query).select('username avatar rating completedTrades location').limit(20);
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
