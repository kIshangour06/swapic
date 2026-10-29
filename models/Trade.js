const mongoose = require('mongoose');

const tradeSchema = new mongoose.Schema({
  proposer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  offeredItems: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true
  }],
  requestedItems: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true
  }],
  message: {
    type: String,
    maxlength: 500,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'in_escrow', 'rejected', 'cancelled', 'completed'],
    default: 'pending'
  },
  escrowStatus: {
    type: String,
    enum: ['not_started', 'in_escrow', 'proposer_confirmed', 'receiver_confirmed', 'both_confirmed', 'released'],
    default: 'not_started'
  },
  escrowNotes: {
    type: String,
    maxlength: 500,
    default: ''
  },
  proposerConfirmedAt: Date,
  receiverConfirmedAt: Date,
  counterOffer: {
    message: String,
    offeredItems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Item' }],
    requestedItems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Item' }]
  },
  completedAt: Date,
  rating: {
    proposerRating: { type: Number, min: 1, max: 5 },
    receiverRating: { type: Number, min: 1, max: 5 },
    proposerReview: String,
    receiverReview: String
  }
}, { timestamps: true });

module.exports = mongoose.model('Trade', tradeSchema);
