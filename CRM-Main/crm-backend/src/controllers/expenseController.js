const prisma = require('../lib/prisma');
const { createLog } = require('./logController');

// 1. Create Expense (shop-wise)
const createExpense = async (req, res) => {
    try {
        const shopId = parseInt(req.user.shopId);
        const userId = req.user.id;
        const {
            title,
            description,
            category,
            amount,
            expenseDate,
            paymentMode,
            notes
        } = req.body;

        if (!title || amount === undefined) {
            return res.status(400).json({
                success: false,
                error: 'Title and amount are required'
            });
        }

        const expense = await prisma.expense.create({
            data: {
                shopId,
                userId,
                title,
                description: description || null,
                category: category || null,
                amount: parseFloat(amount),
                expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
                paymentMode: paymentMode || null,
                notes: notes || null
            }
        });

        if (req.user) {
            await createLog(
                req,
                req.user.id,
                req.user.shopId,
                'EXPENSE_CREATE',
                `Created expense ${title} for amount ${amount}`,
                'Expense',
                'Success'
            );
        }

        res.status(201).json({
            success: true,
            message: 'Expense created successfully',
            data: expense
        });
    } catch (error) {
        console.error('Error creating expense:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create expense'
        });
    }
};

// 2. Get Expense History (shop-wise)
const getExpenses = async (req, res) => {
    try {
        const shopId = parseInt(req.user.shopId);
        const {
            page = 1,
            limit = 20,
            search = '',
            category,
            dateFrom,
            dateTo,
            paymentMode
        } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const whereCondition = {
            shopId
        };

        if (search) {
            whereCondition.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { category: { contains: search, mode: 'insensitive' } }
            ];
        }

        if (category) {
            whereCondition.category = category;
        }

        if (paymentMode) {
            whereCondition.paymentMode = paymentMode;
        }

        if (dateFrom || dateTo) {
            whereCondition.expenseDate = {};
            if (dateFrom) {
                whereCondition.expenseDate.gte = new Date(dateFrom);
            }
            if (dateTo) {
                const end = new Date(dateTo);
                end.setHours(23, 59, 59, 999);
                whereCondition.expenseDate.lte = end;
            }
        }

        const [expenses, totalCount, totalAmount] = await Promise.all([
            prisma.expense.findMany({
                where: whereCondition,
                orderBy: { expenseDate: 'desc' },
                skip: parseInt(limit) === -1 ? undefined : skip,
                take: parseInt(limit) === -1 ? undefined : parseInt(limit)
            }),
            prisma.expense.count({ where: whereCondition }),
            prisma.expense.aggregate({
                where: whereCondition,
                _sum: { amount: true }
            })
        ]);

        res.json({
            success: true,
            data: expenses,
            summary: {
                totalAmount: totalAmount._sum.amount || 0
            },
            pagination: {
                total: totalCount,
                pages: parseInt(limit) === -1 ? 1 : Math.ceil(totalCount / parseInt(limit)),
                currentPage: parseInt(page)
            }
        });
    } catch (error) {
        console.error('Error fetching expenses:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch expenses'
        });
    }
};

// 2b. Expense Dashboard Summary (shop-wise)
// Returns: today's total, this month's total, this year's total, average per entry (this month)
const getExpenseDashboard = async (req, res) => {
  try {
    const shopId = parseInt(req.user.shopId);

    const now = new Date();

    // Today range
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    // Month range
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Year range
    const yearStart = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
    const yearEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);

    const [
      todayAgg,
      monthAgg,
      yearAgg,
      monthCount
    ] = await Promise.all([
      prisma.expense.aggregate({
        where: {
          shopId,
          expenseDate: { gte: todayStart, lte: todayEnd }
        },
        _sum: { amount: true }
      }),
      prisma.expense.aggregate({
        where: {
          shopId,
          expenseDate: { gte: monthStart, lte: monthEnd }
        },
        _sum: { amount: true }
      }),
      prisma.expense.aggregate({
        where: {
          shopId,
          expenseDate: { gte: yearStart, lte: yearEnd }
        },
        _sum: { amount: true }
      }),
      prisma.expense.count({
        where: {
          shopId,
          expenseDate: { gte: monthStart, lte: monthEnd }
        }
      })
    ]);

    const todayTotal = todayAgg._sum.amount || 0;
    const monthTotal = monthAgg._sum.amount || 0;
    const yearTotal = yearAgg._sum.amount || 0;
    const averagePerEntryMonth = monthCount > 0 ? monthTotal / monthCount : 0;

    res.json({
      success: true,
      data: {
        todayTotal,
        monthTotal,
        yearTotal,
        averagePerEntryMonth,
        monthEntryCount: monthCount
      }
    });
  } catch (error) {
    console.error('Error fetching expense dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch expense dashboard'
    });
  }
};

// 3. Get Expense by ID (shop-wise)
const getExpenseById = async (req, res) => {
    try {
        const shopId = parseInt(req.user.shopId);
        const expenseId = parseInt(req.params.id);

        if (isNaN(expenseId)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid expense ID'
            });
        }

        const expense = await prisma.expense.findFirst({
            where: { id: expenseId, shopId }
        });

        if (!expense) {
            return res.status(404).json({
                success: false,
                error: 'Expense not found'
            });
        }

        res.json({
            success: true,
            data: expense
        });
    } catch (error) {
        console.error('Error fetching expense by id:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch expense'
        });
    }
};

// 4. Update Expense by ID (shop-wise)
const updateExpense = async (req, res) => {
    try {
        const shopId = parseInt(req.user.shopId);
        const expenseId = parseInt(req.params.id);
        const {
            title,
            description,
            category,
            amount,
            expenseDate,
            paymentMode,
            notes
        } = req.body;

        const existing = await prisma.expense.findFirst({
            where: { id: expenseId, shopId }
        });

        if (!existing) {
            return res.status(404).json({
                success: false,
                error: 'Expense not found'
            });
        }

        const updated = await prisma.expense.update({
            where: { id: expenseId },
            data: {
                title: title || existing.title,
                description: description !== undefined ? description : existing.description,
                category: category !== undefined ? category : existing.category,
                amount: amount !== undefined ? parseFloat(amount) : existing.amount,
                expenseDate: expenseDate ? new Date(expenseDate) : existing.expenseDate,
                paymentMode: paymentMode !== undefined ? paymentMode : existing.paymentMode,
                notes: notes !== undefined ? notes : existing.notes
            }
        });

        if (req.user) {
            await createLog(
                req,
                req.user.id,
                req.user.shopId,
                'EXPENSE_UPDATE',
                `Updated expense ${updated.title} (ID: ${updated.id})`,
                'Expense',
                'Success'
            );
        }

        res.json({
            success: true,
            message: 'Expense updated successfully',
            data: updated
        });
    } catch (error) {
        console.error('Error updating expense:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update expense'
        });
    }
};

// 5. Delete Expense (shop-wise)
const deleteExpense = async (req, res) => {
    try {
        const shopId = parseInt(req.user.shopId);
        const expenseId = parseInt(req.params.id);

        const existing = await prisma.expense.findFirst({
            where: { id: expenseId, shopId }
        });

        if (!existing) {
            return res.status(404).json({
                success: false,
                error: 'Expense not found'
            });
        }

        await prisma.expense.delete({
            where: { id: expenseId }
        });

        if (req.user) {
            await createLog(
                req,
                req.user.id,
                req.user.shopId,
                'EXPENSE_DELETE',
                `Deleted expense ${existing.title} (ID: ${existing.id})`,
                'Expense',
                'Success'
            );
        }

        res.json({
            success: true,
            message: 'Expense deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting expense:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete expense'
        });
    }
};

module.exports = {
    createExpense,
    getExpenses,
    getExpenseDashboard,
    getExpenseById,
    updateExpense,
    deleteExpense
};
