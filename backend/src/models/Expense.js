const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true,
        maxLength: [100, 'Title cannot exceed 100 characters']
    },
    amount: {
        type: Number,
        required: [true, 'Amount is required'],
        min: [0, 'Amount cannot be negative']
    },
    date: {
        type: Date,
        required: [true, 'Date is required'],
        default: Date.now
    },
    denominations: {
        '2000': { type: Number, default: 0 },
        '500': { type: Number, default: 0 },
        '200': { type: Number, default: 0 },
        '100': { type: Number, default: 0 },
        '50': { type: Number, default: 0 },
        '20': { type: Number, default: 0 },
        '10': { type: Number, default: 0 },
        '5': { type: Number, default: 0 },
        '2': { type: Number, default: 0 },
        '1': { type: Number, default: 0 }
    },
    businessId: {
        type: String,
        required: [true, 'Business ID is required'],
        trim: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    notes: {
        type: String,
        trim: true,
        maxLength: [500, 'Notes cannot exceed 500 characters']
    }
}, {
    timestamps: true
});

// Index for better query performance
expenseSchema.index({ businessId: 1, date: -1 });

module.exports = mongoose.model('Expense', expenseSchema);
