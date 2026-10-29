const express = require('express');
const router = express.Router();
const { Conversation, Message } = require('../models/Chat');
const Notification = require('../models/Notification');
const { authenticate } = require('../middleware/auth');

// Get user's conversations
router.get('/conversations', authenticate, async (req, res) => {
  try {
    const conversations = await Conversation.find({ participants: req.user._id })
      .populate('participants', 'username avatar isOnline lastSeen')
      .populate({ path: 'lastMessage', populate: { path: 'sender', select: 'username' } })
      .sort({ lastActivity: -1 });

    res.json({ success: true, conversations });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get or create conversation with a user
router.post('/conversations', authenticate, async (req, res) => {
  try {
    const { userId } = req.body;
    if (userId === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot chat with yourself' });
    }

    let conversation = await Conversation.findOne({
      participants: { $all: [req.user._id, userId], $size: 2 }
    }).populate('participants', 'username avatar isOnline lastSeen');

    if (!conversation) {
      conversation = new Conversation({ participants: [req.user._id, userId] });
      await conversation.save();
      await conversation.populate('participants', 'username avatar isOnline lastSeen');
    }

    res.json({ success: true, conversation });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get messages in a conversation
router.get('/conversations/:conversationId/messages', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 30 } = req.query;
    const conversation = await Conversation.findById(req.params.conversationId);
    if (!conversation) return res.status(404).json({ success: false, message: 'Conversation not found' });

    if (!conversation.participants.includes(req.user._id.toString())) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const messages = await Message.find({ conversation: req.params.conversationId })
      .populate('sender', 'username avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    // Mark messages as read
    await Message.updateMany(
      { conversation: req.params.conversationId, sender: { $ne: req.user._id }, read: false },
      { read: true }
    );

    res.json({ success: true, messages: messages.reverse() });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Send a message
router.post('/conversations/:conversationId/messages', authenticate, async (req, res) => {
  try {
    const { content, messageType = 'text', tradeRef } = req.body;
    if (!content?.trim()) return res.status(400).json({ success: false, message: 'Message cannot be empty' });

    const conversation = await Conversation.findById(req.params.conversationId);
    if (!conversation) return res.status(404).json({ success: false, message: 'Conversation not found' });

    if (!conversation.participants.map(p => p.toString()).includes(req.user._id.toString())) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const message = new Message({
      conversation: req.params.conversationId,
      sender: req.user._id,
      content: content.trim(),
      messageType,
      tradeRef
    });

    await message.save();
    await message.populate('sender', 'username avatar');

    // Update conversation last activity
    conversation.lastMessage = message._id;
    conversation.lastActivity = new Date();
    await conversation.save();

    // Notify other participant
    const otherUserId = conversation.participants.find(p => p.toString() !== req.user._id.toString());
    const notif = new Notification({
      recipient: otherUserId,
      sender: req.user._id,
      type: 'new_message',
      title: 'New Message 💬',
      message: `${req.user.username}: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
      reference: { model: 'Conversation', id: conversation._id }
    });
    await notif.save();

    if (req.io) {
      req.io.to(otherUserId.toString()).emit('new_message', { message, conversationId: req.params.conversationId });
      req.io.to(otherUserId.toString()).emit('notification', notif);
    }

    res.status(201).json({ success: true, message });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get unread message count
router.get('/unread', authenticate, async (req, res) => {
  try {
    const conversations = await Conversation.find({ participants: req.user._id });
    const convIds = conversations.map(c => c._id);

    const count = await Message.countDocuments({
      conversation: { $in: convIds },
      sender: { $ne: req.user._id },
      read: false
    });

    res.json({ success: true, count });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
