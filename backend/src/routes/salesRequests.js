const express = require('express');
const router = express.Router();
const { 
  getSalesRequests, 
  createSalesRequest, 
  updateSalesRequest, 
  approveSalesRequest, 
  rejectSalesRequest 
} = require('../controllers/salesRequestController');
const { authenticate, authorize } = require('../middleware/auth');

// All sales requests routes require authentication
router.use(authenticate);

// Get all requests for business or create new (salesmen create their requests)
router.route('/')
  .get(getSalesRequests)
  .post(createSalesRequest);

// Update/Edit a request (before approval)
router.route('/:id')
  .put(updateSalesRequest);

// Approve or Reject a request (Only for admin or staff)
router.post('/:id/approve', authorize('admin', 'staff'), approveSalesRequest);
router.post('/:id/reject', authorize('admin', 'staff'), rejectSalesRequest);

module.exports = router;
