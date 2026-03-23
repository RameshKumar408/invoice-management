const mongoose = require('mongoose');
const { SalesRequest, Transaction, Product, Contact } = require('../models');
const { asyncHandler } = require('../middleware/validation');

/**
 * @desc    Get all sales requests for business
 * @route   GET /api/sales-requests
 * @access  Private
 */
const getSalesRequests = asyncHandler(async (req, res) => {
  const { status, salesmanId, page = 1, limit = 10 } = req.query;
  const businessId = req.businessId;

  const filter = { businessId };

  if (status && ['pending', 'approved', 'rejected'].includes(status)) {
    filter.status = status;
  }

  if (salesmanId) {
    filter.salesmanId = salesmanId;
  }

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const requests = await SalesRequest.find(filter)
    .populate('customerId', 'name phone email')
    .sort({ date: -1 })
    .limit(limitNum)
    .skip(skip);

  const total = await SalesRequest.countDocuments(filter);

  res.json({
    success: true,
    data: {
      requests,
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
 * @desc    Create new sales request (from salesman)
 * @route   POST /api/sales-requests
 * @access  Private
 */
const createSalesRequest = asyncHandler(async (req, res) => {
  const {
    customerId,
    products,
    paymentMethod,
    notes,
    subtotal,
    sgst,
    cgst,
    discount,
    totalAmount,
    date,
    salesmanId,
    salesmanName
  } = req.body;
  const businessId = req.businessId;

  try {
    // Validate customer
    const contact = await Contact.findOne({
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

    // Process products to include productName and total
    const processedProducts = [];
    for (const item of products) {
      const product = await Product.findOne({ _id: item.productId, businessId, isActive: true });
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product with ID ${item.productId} not found`
        });
      }

      processedProducts.push({
        productId: product._id,
        productName: product.name,
        quantity: item.quantity,
        price: item.price,
        unitType: item.unitType || 'single',
        total: item.quantity * item.price
      });
    }

    const request = await SalesRequest.create({
      customerId,
      customerName: contact.name,
      products: processedProducts,
      subtotal,
      sgst,
      cgst,
      discount,
      totalAmount,
      businessId,
      paymentMethod: paymentMethod || 'cash',
      status: 'pending',
      notes,
      date: date || new Date(),
      salesmanId,
      salesmanName
    });

    res.status(201).json({
      success: true,
      message: 'Sales request sent for approval',
      data: { request }
    });

  } catch (error) {
    throw error;
  }
});

/**
 * @desc    Update sales request (edit)
 * @route   PUT /api/sales-requests/:id
 * @access  Private
 */
const updateSalesRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  const businessId = req.businessId;

  // If products are included, we must process them like in create
  if (updateData.products && Array.isArray(updateData.products)) {
    const processedProducts = [];
    for (const item of updateData.products) {
      const product = await Product.findOne({ _id: item.productId, businessId, isActive: true });
      if (product) {
        processedProducts.push({
          productId: product._id,
          productName: product.name,
          quantity: item.quantity,
          price: item.price,
          unitType: item.unitType || 'single',
          total: item.quantity * item.price
        });
      }
    }
    updateData.products = processedProducts;
  }
  
  const request = await SalesRequest.findOneAndUpdate(
    { _id: id, businessId, status: 'pending' },
    updateData,
    { new: true, runValidators: true }
  );

  if (!request) {
    return res.status(404).json({
      success: false,
      message: 'Request not found or already processed'
    });
  }

  res.json({
    success: true,
    message: 'Sales request updated',
    data: { request }
  });
});

/**
 * @desc    Approve sales request (convert to transaction)
 * @route   POST /api/sales-requests/:id/approve
 * @access  Private (Admin/Staff)
 */
const approveSalesRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { paidAmount, paymentMethod } = req.body || {};
  const businessId = req.businessId;

  const request = await SalesRequest.findOne({ _id: id, businessId, status: 'pending' });

  if (!request) {
    return res.status(404).json({
      success: false,
      message: 'Request not found or already processed'
    });
  }

  // Double check stock availability
  for (const item of request.products) {
    const product = await Product.findOne({ _id: item.productId, businessId, isActive: true });
    if (!product || product.stock < item.quantity) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock for product ${item.productName}. Available: ${product?.stock || 0}`
      });
    }
  }

  try {
    // 1. Create original transaction logic from transactionController... (better if shared, but I'll write it inline for clarity here or import it)
    // Actually, I'll just reuse the logic to create a transaction.
    
    // Process products and update stock
    const processedProducts = [];
    for (const item of request.products) {
      const product = await Product.findOne({ _id: item.productId, businessId, isActive: true });
      product.stock -= item.quantity;
      await product.save();
      
      processedProducts.push({
        productId: product._id,
        productName: product.name,
        quantity: item.quantity,
        price: item.price,
        unitType: item.unitType || 'single',
        HSN: product.HSN,
        total: item.total
      });
    }

    // Generate Invoice Number
    const transactionDate = request.date || new Date();
    const month = String(transactionDate.getMonth() + 1).padStart(2, '0');
    const year = transactionDate.getFullYear();
    const prefix = `${month}${year}`;
    const startOfMonth = new Date(transactionDate.getFullYear(), transactionDate.getMonth(), 1, 0, 0, 0, 0);
    const endOfMonth = new Date(transactionDate.getFullYear(), transactionDate.getMonth() + 1, 0, 23, 59, 59, 999);
    const count = await Transaction.countDocuments({
      businessId,
      date: { $gte: startOfMonth, $lte: endOfMonth }
    });
    const sequence = String(count + 1).padStart(5, '0');
    const invoiceNumber = `${prefix}-${sequence}`;

    const finalPaidAmount = paidAmount !== undefined ? Number(paidAmount) : request.totalAmount;
    const finalPaymentMethod = paymentMethod || request.paymentMethod || 'cash';
    const status = finalPaidAmount >= request.totalAmount ? 'completed' : 'pending';

    const transaction = await Transaction.create({
      type: 'sale',
      customerId: request.customerId,
      customerName: request.customerName,
      products: processedProducts,
      subtotal: request.subtotal,
      sgst: request.sgst,
      cgst: request.cgst,
      discount: request.discount,
      totalAmount: request.totalAmount,
      businessId,
      paymentMethod: finalPaymentMethod,
      status: status,
      notes: request.notes,
      invoiceNumber,
      date: transactionDate,
      paidAmount: finalPaidAmount,
      payments: finalPaidAmount > 0 ? [{
        amount: finalPaidAmount,
        method: finalPaymentMethod,
        date: new Date(),
        note: 'Sales request approved'
      }] : [],
      salesmanId: request.salesmanId,
      salesmanName: request.salesmanName
    });

    // Update request status
    request.status = 'approved';
    await request.save();

    res.json({
      success: true,
      message: 'Sales request approved and converted to invoice',
      data: { transaction }
    });

  } catch (error) {
    throw error;
  }
});

/**
 * @desc    Reject sales request
 * @route   POST /api/sales-requests/:id/reject
 * @access  Private (Admin/Staff)
 */
const rejectSalesRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const request = await SalesRequest.findOneAndUpdate(
    { _id: id, businessId: req.businessId, status: 'pending' },
    { status: 'rejected' },
    { new: true }
  );

  if (!request) {
    return res.status(404).json({
      success: false,
      message: 'Request not found'
    });
  }

  res.json({
    success: true,
    message: 'Sales request rejected',
    data: { request }
  });
});

module.exports = {
  getSalesRequests,
  createSalesRequest,
  updateSalesRequest,
  approveSalesRequest,
  rejectSalesRequest
};
