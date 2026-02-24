const express = require('express');
const router = express.Router();
const {
    getExpenses,
    createExpense,
    deleteExpense,
    getExpenseSummary
} = require('../controllers/expenseController');
const { authenticate, checkBusinessAccess } = require('../middleware/auth');

// All routes are protected
router.use(authenticate);
router.use(checkBusinessAccess);

router.get('/summary', getExpenseSummary);

router.route('/')
    .get(getExpenses)
    .post(createExpense);

router.route('/:id')
    .delete(deleteExpense);

module.exports = router;
