const express = require('express');
const router = express.Router();
const { verifyToken } = require('../controllers/authController');
const {
    createExpense,
    getExpenses,
    getExpenseDashboard,
    updateExpense,
    deleteExpense,
    getExpenseById
} = require('../controllers/expenseController');

// Protect all expense routes
router.use(verifyToken);

// Create expense
router.post('/create-expense', createExpense);

// Get expense history (shop-wise)
router.get('/get-all-expense', getExpenses);

// Get expense by ID
router.get('/get-expense-by/:id', getExpenseById);

// Get expense dashboard summary (shop-wise)
router.get('/get-expense-dashboard', getExpenseDashboard);

// Update expense by ID
router.put('/update-expense/:id', updateExpense);

// Delete expense by ID
router.delete('/delete-expense/:id', deleteExpense);

module.exports = router;