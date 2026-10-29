const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000
  },
  category: {
    type: String,
    required: true,
    enum: [
      'Electronics', 'Clothing', 'Books', 'Furniture', 'Sports',
      'Toys', 'Music', 'Art', 'Vehicles', 'Tools', 'Kitchen',
      'Jewelry', 'Garden', 'Health', 'Other'
    ]
  },
  condition: {
    type: String,
    required: true,
    enum: ['New', 'Like New', 'Good', 'Fair', 'Poor']
  },
  estimatedValue: {
    type: Number,
    default: 0
  },
  listingType: {
    type: String,
    enum: ['barter', 'sell', 'rent'],
    default: 'barter'
  },
  price: {
    type: Number,
    default: 0
  },
  rentPrice: {
    type: Number,
    default: 0
  },
  rentPeriod: {
    type: String,
    enum: ['hour', 'day', 'week', 'month'],
    default: 'day'
  },
  deposit: {
    type: Number,
    default: 0
  },
  images: [{
    type: String
  }],
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['available', 'pending', 'traded'],
    default: 'available'
  },
  lookingFor: {
    type: String,
    default: '',
    maxlength: 300
  },
  tags: [{
    type: String,
    lowercase: true
  }],
  views: {
    type: Number,
    default: 0
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  location: {
    type: String,
    default: ''
  }
}, { timestamps: true });

// Text index for search
itemSchema.index({ title: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Item', itemSchema);
