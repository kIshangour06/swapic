const express = require('express');
const router = express.Router();
const Trade = require('../models/Trade');
const Item = require('../models/Item');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { authenticate } = require('../middleware/auth');

// Helper: create notification
const createNotification = async (io, recipient, sender, type, title, message, reference) => {
  const notif = new Notification({ recipient, sender, type, title, message, reference });
  await notif.save();
  if (io) {
    io.to(recipient.toString()).emit('notification', {
      ...notif.toObject(),
      sender: { _id: sender }
    });
  }
};

// Get all trades for current user
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, role } = req.query;
    const query = {};

    if (role === 'proposer') query.proposer = req.user._id;
    else if (role === 'receiver') query.receiver = req.user._id;
    else query.$or = [{ proposer: req.user._id }, { receiver: req.user._id }];

    if (status) query.status = status;

    const trades = await Trade.find(query)
      .populate('proposer', 'username avatar rating')
      .populate('receiver', 'username avatar rating')
      .populate('offeredItems', 'title images estimatedValue category')
      .populate('requestedItems', 'title images estimatedValue category')
      .sort({ updatedAt: -1 });

    res.json({ success: true, trades });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get single trade
router.get('/:id', authenticate, async (req, res) => {
  try {
    const trade = await Trade.findById(req.params.id)
      .populate('proposer', 'username avatar rating location')
      .populate('receiver', 'username avatar rating location')
      .populate('offeredItems')
      .populate('requestedItems');

    if (!trade) return res.status(404).json({ success: false, message: 'Trade not found' });

    const isParticipant =
      trade.proposer._id.toString() === req.user._id.toString() ||
      trade.receiver._id.toString() === req.user._id.toString();
    if (!isParticipant) return res.status(403).json({ success: false, message: 'Not authorized' });

    res.json({ success: true, trade });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create trade proposal
router.post('/', authenticate, async (req, res) => {
  try {
    const { receiverId, offeredItemIds, requestedItemIds, message } = req.body;

    if (!receiverId || !offeredItemIds?.length || !requestedItemIds?.length) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    if (receiverId === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot trade with yourself' });
    }

    const receiver = await User.findById(receiverId);
    if (!receiver) return res.status(404).json({ success: false, message: 'User not found' });

    // Verify offered items belong to proposer
    const offeredItems = await Item.find({ _id: { $in: offeredItemIds }, owner: req.user._id, status: 'available' });
    if (offeredItems.length !== offeredItemIds.length) {
      return res.status(400).json({ success: false, message: 'Some offered items are invalid or unavailable' });
    }

    // Verify requested items belong to receiver
    const requestedItems = await Item.find({ _id: { $in: requestedItemIds }, owner: receiverId, status: 'available' });
    if (requestedItems.length !== requestedItemIds.length) {
      return res.status(400).json({ success: false, message: 'Some requested items are invalid or unavailable' });
    }

    const trade = new Trade({
      proposer: req.user._id,
      receiver: receiverId,
      offeredItems: offeredItemIds,
      requestedItems: requestedItemIds,
      message: message || ''
    });

    // Update item statuses to pending
    await Item.updateMany({ _id: { $in: [...offeredItemIds, ...requestedItemIds] } }, { status: 'pending' });

    await trade.save();

    // Notify receiver
    await createNotification(req.io, receiverId, req.user._id, 'trade_proposal',
      'New Trade Proposal! 🤝',
      `${req.user.username} wants to trade with you!`,
      { model: 'Trade', id: trade._id }
    );

    await trade.populate([
      { path: 'proposer', select: 'username avatar rating' },
      { path: 'receiver', select: 'username avatar rating' },
      { path: 'offeredItems', select: 'title images estimatedValue' },
      { path: 'requestedItems', select: 'title images estimatedValue' }
    ]);

    res.status(201).json({ success: true, message: 'Trade proposal sent!', trade });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Accept trade
router.put('/:id/accept', authenticate, async (req, res) => {
  try {
    const trade = await Trade.findById(req.params.id)
      .populate('proposer', 'username')
      .populate('receiver', 'username');

    if (!trade) return res.status(404).json({ success: false, message: 'Trade not found' });
    if (trade.receiver._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the receiver can accept' });
    }
    if (trade.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Trade is not pending' });
    }

    trade.status = 'accepted';
    await trade.save();

    await createNotification(req.io, trade.proposer._id, req.user._id, 'trade_accepted',
      'Trade Accepted! 🎉',
      `${req.user.username} accepted your trade proposal!`,
      { model: 'Trade', id: trade._id }
    );

    res.json({ success: true, message: 'Trade accepted!', trade });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update escrow status / handover confirmation
router.put('/:id/escrow', authenticate, async (req, res) => {
  try {
    const { action, notes } = req.body; // action: 'start' | 'confirm' | 'release'
    const trade = await Trade.findById(req.params.id)
      .populate('proposer', 'username')
      .populate('receiver', 'username');

    if (!trade) return res.status(404).json({ success: false, message: 'Trade not found' });

    const isProposer = trade.proposer._id.toString() === req.user._id.toString();
    const isReceiver = trade.receiver._id.toString() === req.user._id.toString();
    if (!isProposer && !isReceiver) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (action === 'start') {
      if (!['accepted', 'pending'].includes(trade.status)) {
        return res.status(400).json({ success: false, message: 'Cannot move to escrow in current status' });
      }
      trade.status = 'in_escrow';
      trade.escrowStatus = 'in_escrow';
      if (notes) trade.escrowNotes = notes;
    } else if (action === 'confirm') {
      if (trade.status !== 'in_escrow') {
        trade.status = 'in_escrow';
      }
      if (isProposer) {
        trade.proposerConfirmedAt = new Date();
      } else {
        trade.receiverConfirmedAt = new Date();
      }

      if (trade.proposerConfirmedAt && trade.receiverConfirmedAt) {
        trade.escrowStatus = 'both_confirmed';
      } else if (isProposer) {
        trade.escrowStatus = 'proposer_confirmed';
      } else {
        trade.escrowStatus = 'receiver_confirmed';
      }
      if (notes) trade.escrowNotes = notes;
    }

    await trade.save();

    const otherUser = isProposer ? trade.receiver._id : trade.proposer._id;
    await createNotification(req.io, otherUser, req.user._id, 'trade_proposal',
      'Escrow Update 🛡️',
      `${req.user.username} updated the escrow/handover status for your trade.`,
      { model: 'Trade', id: trade._id }
    );

    res.json({ success: true, message: 'Escrow status updated', trade });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Propose counter-offer
router.post('/:id/counter', authenticate, async (req, res) => {
  try {
    const { message, offeredItemIds, requestedItemIds } = req.body;
    const trade = await Trade.findById(req.params.id)
      .populate('proposer', 'username')
      .populate('receiver', 'username');

    if (!trade) return res.status(404).json({ success: false, message: 'Trade not found' });

    const isProposer = trade.proposer._id.toString() === req.user._id.toString();
    const isReceiver = trade.receiver._id.toString() === req.user._id.toString();
    if (!isProposer && !isReceiver) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (trade.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Can only counter pending trades' });
    }

    trade.counterOffer = {
      message: message || '',
      offeredItems: offeredItemIds || trade.offeredItems,
      requestedItems: requestedItemIds || trade.requestedItems
    };
    await trade.save();

    const otherUser = isProposer ? trade.receiver._id : trade.proposer._id;
    await createNotification(req.io, otherUser, req.user._id, 'trade_proposal',
      'Counter-Offer Received 🔄',
      `${req.user.username} submitted a counter-offer for your trade!`,
      { model: 'Trade', id: trade._id }
    );

    res.json({ success: true, message: 'Counter-offer submitted', trade });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Reject trade
router.put('/:id/reject', authenticate, async (req, res) => {
  try {
    const trade = await Trade.findById(req.params.id).populate('proposer', 'username');
    if (!trade) return res.status(404).json({ success: false, message: 'Trade not found' });
    if (trade.receiver.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (trade.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Trade is not pending' });
    }

    trade.status = 'rejected';
    await trade.save();

    // Restore item statuses
    const allItems = [...trade.offeredItems, ...trade.requestedItems];
    await Item.updateMany({ _id: { $in: allItems } }, { status: 'available' });

    await createNotification(req.io, trade.proposer._id, req.user._id, 'trade_rejected',
      'Trade Rejected',
      `${req.user.username} declined your trade proposal.`,
      { model: 'Trade', id: trade._id }
    );

    res.json({ success: true, message: 'Trade rejected', trade });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Complete trade
router.put('/:id/complete', authenticate, async (req, res) => {
  try {
    const trade = await Trade.findById(req.params.id)
      .populate('proposer', 'username')
      .populate('receiver', 'username');

    if (!trade) return res.status(404).json({ success: false, message: 'Trade not found' });

    const isParticipant =
      trade.proposer._id.toString() === req.user._id.toString() ||
      trade.receiver._id.toString() === req.user._id.toString();
    if (!isParticipant) return res.status(403).json({ success: false, message: 'Not authorized' });
    if (!['accepted', 'in_escrow'].includes(trade.status)) {
      return res.status(400).json({ success: false, message: 'Trade must be accepted or in escrow before completing' });
    }

    trade.status = 'completed';
    trade.escrowStatus = 'released';
    trade.completedAt = new Date();
    await trade.save();

    // Mark items as traded and transfer ownership
    await Item.updateMany({ _id: { $in: trade.offeredItems } }, { status: 'traded', owner: trade.receiver._id });
    await Item.updateMany({ _id: { $in: trade.requestedItems } }, { status: 'traded', owner: trade.proposer._id });

    // Increment completed trades
    await User.findByIdAndUpdate(trade.proposer._id, { $inc: { completedTrades: 1 } });
    await User.findByIdAndUpdate(trade.receiver._id, { $inc: { completedTrades: 1 } });

    const otherUser = trade.proposer._id.toString() === req.user._id.toString()
      ? trade.receiver._id : trade.proposer._id;

    await createNotification(req.io, otherUser, req.user._id, 'trade_completed',
      'Trade Completed! ✅',
      `Your trade with ${req.user.username} has been completed!`,
      { model: 'Trade', id: trade._id }
    );

    res.json({ success: true, message: 'Trade completed!', trade });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Cancel trade
router.put('/:id/cancel', authenticate, async (req, res) => {
  try {
    const trade = await Trade.findById(req.params.id);
    if (!trade) return res.status(404).json({ success: false, message: 'Trade not found' });

    const isParticipant =
      trade.proposer.toString() === req.user._id.toString() ||
      trade.receiver.toString() === req.user._id.toString();
    if (!isParticipant) return res.status(403).json({ success: false, message: 'Not authorized' });
    if (!['pending', 'accepted'].includes(trade.status)) {
      return res.status(400).json({ success: false, message: 'Cannot cancel this trade' });
    }

    trade.status = 'cancelled';
    await trade.save();

    // Restore items to available
    const allItems = [...trade.offeredItems, ...trade.requestedItems];
    await Item.updateMany({ _id: { $in: allItems } }, { status: 'available' });

    const otherUser = trade.proposer.toString() === req.user._id.toString()
      ? trade.receiver : trade.proposer;

    await createNotification(req.io, otherUser, req.user._id, 'trade_cancelled',
      'Trade Cancelled',
      `${req.user.username} cancelled a trade.`,
      { model: 'Trade', id: trade._id }
    );

    res.json({ success: true, message: 'Trade cancelled', trade });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Rate a completed trade
router.post('/:id/rate', authenticate, async (req, res) => {
  try {
    const { rating, review } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1-5' });
    }

    const trade = await Trade.findById(req.params.id);
    if (!trade) return res.status(404).json({ success: false, message: 'Trade not found' });
    if (trade.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'Can only rate completed trades' });
    }

    const isProposer = trade.proposer.toString() === req.user._id.toString();
    const isReceiver = trade.receiver.toString() === req.user._id.toString();

    if (!isProposer && !isReceiver) return res.status(403).json({ success: false, message: 'Not authorized' });

    let ratedUser;
    if (isProposer && !trade.rating.proposerRating) {
      trade.rating.proposerRating = rating;
      trade.rating.proposerReview = review || '';
      ratedUser = trade.receiver;
    } else if (isReceiver && !trade.rating.receiverRating) {
      trade.rating.receiverRating = rating;
      trade.rating.receiverReview = review || '';
      ratedUser = trade.proposer;
    } else {
      return res.status(400).json({ success: false, message: 'Already rated' });
    }

    await trade.save();

    // Update user's rating
    const user = await User.findById(ratedUser);
    user.rating.total += rating;
    user.rating.count += 1;
    user.rating.average = Math.round((user.rating.total / user.rating.count) * 10) / 10;
    await user.save();

    await createNotification(req.io, ratedUser, req.user._id, 'rating_received',
      'New Rating Received! ⭐',
      `${req.user.username} rated you ${rating}/5 stars.`,
      { model: 'Trade', id: trade._id }
    );

    res.json({ success: true, message: 'Rating submitted!', trade });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
