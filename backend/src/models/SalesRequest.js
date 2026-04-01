const mongoose = require('mongoose');

const salesRequestItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product ID is required']
  },
  productName: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  unitType: {
    type: String,
    enum: ['case', 'single'],
    default: 'single'
  },
  total: {
    type: Number,
    required: true
  }
}, { _id: false });

const salesRequestSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contact',
    required: [true, 'Customer ID is required']
  },
  customerName: {
    type: String,
    required: true
  },
  products: [salesRequestItemSchema],
  subtotal: {
    type: Number,
    default: 0
  },
  sgst: {
    type: Number,
    default: 0
  },
  cgst: {
    type: Number,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: [0, 'Total amount cannot be negative']
  },
  date: {
    type: Date,
    required: [true, 'Transaction date is required'],
    default: Date.now
  },
  businessId: {
    type: String,
    required: [true, 'Business ID is required'],
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'bank_transfer', 'credit', 'other'],
    default: 'cash'
  },
  notes: {
    type: String,
    trim: true,
    maxLength: [500, 'Notes cannot exceed 500 characters']
  },
  salesmanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  salesmanName: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
salesRequestSchema.index({ businessId: 1, date: -1 });
salesRequestSchema.index({ businessId: 1, status: 1 });
salesRequestSchema.index({ salesmanId: 1 });

module.exports = mongoose.model('SalesRequest', salesRequestSchema);
