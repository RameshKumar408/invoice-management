const express = require('express');
const {
  getUsers,
  createUser,
  updateUser,
  deleteUser
} = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Protected routes - Admin only
router.use(authenticate);
router.use(authorize('admin')); // Only admin can manage users

router.get('/', getUsers);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

module.exports = router;
