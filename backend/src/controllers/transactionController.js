const mongoose = require('mongoose');
const { Transaction, Product, Contact } = require('../models');
const { asyncHandler } = require('../middleware/validation');

/**
 * @desc    Get all transactions with filters
 * @route   GET /api/transactions
 * @access  Private
 */
const getTransactions = asyncHandler(async (req, res) => {
  const {
    type,
    startDate,
    endDate,
    contactId,
    status,
    isPrinted,
    page = 1,
    limit = 10
  } = req.query;
  const businessId = req.businessId;

  // Build filter object
  const filter = { businessId };

  if (type && ['sale', 'purchase'].includes(type.toLowerCase())) {
    filter.type = type.toLowerCase();
  }

  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);
    if (endDate) filter.date.$lte = new Date(endDate);
  }

  if (contactId) {
    filter.$or = [
      { customerId: contactId },
      { vendorId: contactId }
    ];
  }

  if (status && ['pending', 'completed', 'cancelled'].includes(status)) {
    filter.status = status;
  }

  if (isPrinted !== undefined && isPrinted !== '') {
    filter.isPrinted = isPrinted === 'true';
  }

  // Calculate pagination
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  // Get transactions with pagination and populate references
  const transactions = await Transaction.find(filter)
    .populate('customerId', 'name phone email')
    .populate('vendorId', 'name phone email')
    .populate('products.productId', 'name category sku')
    .sort({ date: -1 })
    .limit(limitNum)
    .skip(skip);

  // Get total count for pagination
  const total = await Transaction.countDocuments(filter);

  res.json({
    success: true,
    data: {
      transactions,
      pagination: {
        current: pageNum,
        pages: Math.ceil(total / limitNum),
        total,
        limit: limitNum
      }
    }
  });
});

/**
 * @desc    Get single transaction
 * @route   GET /api/transactions/:id
 * @access  Private
 */
const getTransaction = asyncHandler(async (req, res) => {
  const transaction = await Transaction.findOne({
    _id: req.params.id,
    businessId: req.businessId
  })
    .populate('customerId', 'name phone email address')
    .populate('vendorId', 'name phone email address')
    .populate('products.productId', 'name description category sku');

  if (!transaction) {
    return res.status(404).json({
      success: false,
      message: 'Transaction not found'
    });
  }

  res.json({
    success: true,
    data: { transaction }
  });
});

/**
 * @desc    Create new transaction (sale or purchase)
 * @route   POST /api/transactions
 * @access  Private
 */
const createTransaction = asyncHandler(async (req, res) => {
  const {
    type,
    customerId,
    vendorId,
    products,
    paymentMethod,
    notes,
    subtotal,
    sgst,
    cgst,
    discount,
    status,
    totalAmount: bodyTotalAmount,
    initialPayment // Destructure initialPayment
  } = req.body;
  const businessId = req.businessId;

  try {
    // Validate contact based on transaction type
    let contact;
    if (type === 'sale') {
      if (!customerId) {
        return res.status(400).json({
          success: false,
          message: 'Customer ID is required for sales'
        });
      }
      contact = await Contact.findOne({
        _id: customerId,
        businessId,
        type: 'customer',
        isActive: true
      });

      if (!contact) {
        return res.status(404).json({
          success: false,
          message: 'Customer not found'
        });
      }
    } else if (type === 'purchase') {
      if (!vendorId) {
        return res.status(400).json({
          success: false,
          message: 'Vendor ID is required for purchases'
        });
      }
      contact = await Contact.findOne({
        _id: vendorId,
        businessId,
        type: 'vendor',
        isActive: true
      });

      if (!contact) {
        return res.status(404).json({
          success: false,
          message: 'Vendor not found'
        });
      }
    }

    // Validate and process products
    const processedProducts = [];
    let calculatedSubtotal = 0;

    for (const item of products) {
      const product = await Product.findOne({
        _id: item.productId,
        businessId,
        isActive: true
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product with ID ${item.productId} not found`
        });
      }

      // For sales, check if enough stock is available
      if (type === 'sale' && product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for product ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`
        });
      }

      // Update product stock based on transaction type
      if (type === 'sale') {
        product.stock -= item.quantity;
      } else {
        product.stock += item.quantity;
      }

      await product.save();

      // Calculate item total
      const itemTotal = item.quantity * item.price;
      calculatedSubtotal += itemTotal;

      processedProducts.push({
        productId: product._id,
        productName: product.name,
        quantity: item.quantity,
        price: item.price,
        unitType: item.unitType || 'single',
        HSN: product.HSN,
        total: itemTotal
      });
    }

    // Generate Invoice Number
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const prefix = `${month}${year}`;

    // Find the number of transactions in this month to get the next sequence
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const count = await Transaction.countDocuments({
      businessId,
      date: { $gte: startOfMonth, $lte: endOfMonth }
    });

    const sequence = String(count + 1).padStart(5, '0');
    const invoiceNumber = `${prefix}-${sequence}`;

    const finalTotalAmount = bodyTotalAmount || (subtotal || calculatedSubtotal) + (sgst || 0) + (cgst || 0) - (discount || 0);
    const paidAmount = Number(initialPayment) || 0;

    // Create transaction data
    const transactionData = {
      type,
      products: processedProducts,
      subtotal: subtotal || calculatedSubtotal,
      sgst: sgst || 0,
      cgst: cgst || 0,
      discount: discount || 0,
      totalAmount: finalTotalAmount,
      businessId,
      paymentMethod: paymentMethod || 'cash',
      status: status || 'pending', // Default to pending unless fully paid
      notes,
      invoiceNumber,
      paidAmount: paidAmount,
      payments: paidAmount > 0 ? [{
        amount: paidAmount,
        method: paymentMethod || 'cash',
        date: new Date(),
        note: 'Initial Payment'
      }] : []
    };

    // If fully paid, mark as completed
    if (paidAmount >= finalTotalAmount - 0.01) {
      transactionData.status = 'completed';
    }

    // Add contact information based on transaction type
    if (type === 'sale') {
      transactionData.customerId = customerId;
      transactionData.customerName = contact.name;
    } else {
      transactionData.vendorId = vendorId;
      transactionData.vendorName = contact.name;
    }

    // Create transaction
    const transaction = await Transaction.create(transactionData);

    // Update contact balance if needed
    if (type === 'sale') {
      // Add the remaining unpaid amount to their balance
      const balanceToAdd = Math.max(0, finalTotalAmount - paidAmount);
      if (balanceToAdd > 0) {
        contact.currentBalance += balanceToAdd;
        await contact.save();
      }
    }



    // Populate the created transaction
    const populatedTransaction = await Transaction.findById(transaction._id)
      .populate('customerId', 'name phone email')
      .populate('vendorId', 'name phone email')
      .populate('products.productId', 'name category');

    res.status(201).json({
      success: true,
      message: `${type === 'sale' ? 'Sale' : 'Purchase'} recorded successfully`,
      data: { transaction: populatedTransaction }
    });

  } catch (error) {
    throw error;
  }
});

/**
 * @desc    Get sales transactions
 * @route   GET /api/transactions/sales
 * @access  Private
 */
const getSales = asyncHandler(async (req, res) => {
  const { startDate, endDate, customerId, page = 1, limit = 10 } = req.query;
  const businessId = req.businessId;

  const filter = { businessId, type: 'sale' };

  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);
    if (endDate) filter.date.$lte = new Date(endDate);
  }

  if (customerId) {
    filter.customerId = customerId;
  }

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const sales = await Transaction.find(filter)
    .populate('customerId', 'name phone email')
    .sort({ date: -1 })
    .limit(limitNum)
    .skip(skip);

  const total = await Transaction.countDocuments(filter);

  res.json({
    success: true,
    data: {
      sales,
      pagination: {
        current: pageNum,
        pages: Math.ceil(total / limitNum),
        total,
        limit: limitNum
      }
    }
  });
});

/**
 * @desc    Get purchase transactions
 * @route   GET /api/transactions/purchases
 * @access  Private
 */
const getPurchases = asyncHandler(async (req, res) => {
  const { startDate, endDate, vendorId, page = 1, limit = 10 } = req.query;
  const businessId = req.businessId;

  const filter = { businessId, type: 'purchase' };

  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);
    if (endDate) filter.date.$lte = new Date(endDate);
  }

  if (vendorId) {
    filter.vendorId = vendorId;
  }

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const purchases = await Transaction.find(filter)
    .populate('vendorId', 'name phone email')
    .sort({ date: -1 })
    .limit(limitNum)
    .skip(skip);

  const total = await Transaction.countDocuments(filter);

  res.json({
    success: true,
    data: {
      purchases,
      pagination: {
        current: pageNum,
        pages: Math.ceil(total / limitNum),
        total,
        limit: limitNum
      }
    }
  });
});

/**
 * @desc    Update transaction status
 * @route   PATCH /api/transactions/:id/status
 * @access  Private
 */
const updateTransactionStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const transaction = await Transaction.findOneAndUpdate(
    { _id: id, businessId: req.businessId },
    { status },
    { new: true, runValidators: true }
  );

  if (!transaction) {
    return res.status(404).json({
      success: false,
      message: 'Transaction not found'
    });
  }

  res.json({
    success: true,
    message: 'Transaction status updated successfully',
    data: { transaction }
  });
});

/**
 * @desc    Update transaction print status
 * @route   PATCH /api/transactions/:id/print
 * @access  Private
 */
const updatePrintStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isPrinted } = req.body;

  const transaction = await Transaction.findOneAndUpdate(
    { _id: id, businessId: req.businessId },
    { isPrinted: isPrinted !== undefined ? isPrinted : true },
    { new: true, runValidators: true }
  );

  if (!transaction) {
    return res.status(404).json({
      success: false,
      message: 'Transaction not found'
    });
  }

  res.json({
    success: true,
    message: 'Transaction print status updated successfully',
    data: { transaction }
  });
});

/**
 * @desc    Get transaction summary/statistics
 * @route   GET /api/transactions/summary
 * @access  Private
 */
const getTransactionSummary = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const businessId = req.businessId;

  const matchStage = { businessId };

  if (startDate || endDate) {
    matchStage.date = {};
    if (startDate) matchStage.date.$gte = new Date(startDate);
    if (endDate) matchStage.date.$lte = new Date(endDate);
  }

  const summary = await Transaction.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$type',
        totalAmount: { $sum: '$totalAmount' },
        transactionCount: { $sum: 1 },
        averageAmount: { $avg: '$totalAmount' }
      }
    }
  ]);

  // Format the summary
  const result = {
    sales: {
      totalAmount: 0,
      transactionCount: 0,
      averageAmount: 0
    },
    purchases: {
      totalAmount: 0,
      transactionCount: 0,
      averageAmount: 0
    }
  };

  summary.forEach(item => {
    if (item._id === 'sale') {
      result.sales = {
        totalAmount: item.totalAmount,
        transactionCount: item.transactionCount,
        averageAmount: item.averageAmount
      };
    } else if (item._id === 'purchase') {
      result.purchases = {
        totalAmount: item.totalAmount,
        transactionCount: item.transactionCount,
        averageAmount: item.averageAmount
      };
    }
  });

  // Calculate profit/loss
  result.profitLoss = result.sales.totalAmount - result.purchases.totalAmount;

  res.json({
    success: true,
    data: { summary: result }
  });
});

/**
 * @desc    Add a payment to a transaction (Partial/Split Payment)
 * @route   POST /api/transactions/:id/payments
 * @access  Private
 */
const addPayment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { amount, method, note, date } = req.body;

  const transaction = await Transaction.findOne({
    _id: id,
    businessId: req.businessId
  });

  if (!transaction) {
    return res.status(404).json({
      success: false,
      message: 'Transaction not found'
    });
  }

  const paymentAmount = Number(amount);
  if (isNaN(paymentAmount) || paymentAmount <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Invalid payment amount'
    });
  }

  const remainingBalance = transaction.totalAmount - (transaction.paidAmount || 0);
  if (paymentAmount > remainingBalance + 0.01) { // 0.01 for rounding errors
    return res.status(400).json({
      success: false,
      message: `Payment amount ₹${paymentAmount} exceeds remaining balance ₹${remainingBalance.toFixed(2)}`
    });
  }

  // Update transaction
  transaction.payments.push({
    amount: paymentAmount,
    method: method || 'cash',
    note,
    date: date || new Date()
  });

  transaction.paidAmount = (transaction.paidAmount || 0) + paymentAmount;

  // If fully paid, update status to completed
  if (transaction.paidAmount >= transaction.totalAmount - 0.01) {
    transaction.status = 'completed';
  }

  await transaction.save();

  // If it was a sale on credit, we should also update the contact balance
  if (transaction.type === 'sale') {
    const contact = await Contact.findById(transaction.customerId);
    if (contact) {
      contact.currentBalance = Math.max(0, contact.currentBalance - paymentAmount);
      await contact.save();
    }
  }

  res.json({
    success: true,
    message: 'Payment added successfully',
    data: { transaction }
  });
});

module.exports = {
  getTransactions,
  getTransaction,
  createTransaction,
  getSales,
  getPurchases,
  updateTransactionStatus,
  updatePrintStatus,
  getTransactionSummary,
  addPayment
};