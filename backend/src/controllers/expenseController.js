const { Expense } = require('../models');
const { asyncHandler } = require('../middleware/validation');

/**
 * @desc    Get all expenses with filters
 * @route   GET /api/expenses
 * @access  Private
 */
const getExpenses = asyncHandler(async (req, res) => {
    const {
        startDate,
        endDate,
        title,
        page = 1,
        limit = 10
    } = req.query;
    const businessId = req.businessId;

    const filter = { businessId };

    if (startDate || endDate) {
        filter.date = {};
        if (startDate) filter.date.$gte = new Date(startDate);
        if (endDate) filter.date.$lte = new Date(endDate);
    }

    if (title) {
        filter.title = { $regex: title, $options: 'i' };
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const expenses = await Expense.find(filter)
        .sort({ date: -1 })
        .limit(limitNum)
        .skip(skip);

    const total = await Expense.countDocuments(filter);

    res.json({
        success: true,
        data: {
            expenses,
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
 * @desc    Create new expense
 * @route   POST /api/expenses
 * @access  Private
 */
const createExpense = asyncHandler(async (req, res) => {
    const { title, amount, date, denominations, notes } = req.body;
    const businessId = req.businessId;
    const createdBy = req.user._id;

    const expense = await Expense.create({
        title,
        amount,
        date: date || new Date(),
        denominations,
        notes,
        businessId,
        createdBy
    });

    res.status(201).json({
        success: true,
        message: 'Expense recorded successfully',
        data: { expense }
    });
});

/**
 * @desc    Delete expense
 * @route   DELETE /api/expenses/:id
 * @access  Private
 */
const deleteExpense = asyncHandler(async (req, res) => {
    const expense = await Expense.findOneAndDelete({
        _id: req.params.id,
        businessId: req.businessId
    });

    if (!expense) {
        return res.status(404).json({
            success: false,
            message: 'Expense not found'
        });
    }

    res.json({
        success: true,
        message: 'Expense deleted successfully'
    });
});

/**
 * @desc    Get expense summary (total amount + count)
 * @route   GET /api/expenses/summary
 * @access  Private
 */
const getExpenseSummary = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    const businessId = req.businessId;

    const filter = { businessId };

    if (startDate || endDate) {
        filter.date = {};
        if (startDate) filter.date.$gte = new Date(startDate);
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            filter.date.$lte = end;
        }
    }

    const result = await Expense.aggregate([
        { $match: filter },
        {
            $group: {
                _id: null,
                totalAmount: { $sum: '$amount' },
                count: { $sum: 1 }
            }
        }
    ]);

    const summary = result[0] || { totalAmount: 0, count: 0 };

    res.json({
        success: true,
        data: { summary }
    });
});

module.exports = {
    getExpenses,
    createExpense,
    deleteExpense,
    getExpenseSummary
};
