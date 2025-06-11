const firebaseService = require('../services/firebaseService');

// Set monthly budget
exports.setMonthlyBudget = async (req, res) => {
  try {
    const { monthlyBudget } = req.body;
    const uid = req.user.uid;

    // Validate monthly budget
    if (!monthlyBudget || isNaN(monthlyBudget) || monthlyBudget < 0) {
      return res.status(400).json({
        error: 'Invalid budget amount',
        message: 'Please provide a valid positive number for monthly budget'
      });
    }

    await firebaseService.updateUserBudget(uid, Number(monthlyBudget));

    res.json({
      message: 'Monthly budget updated successfully',
      monthlyBudget: Number(monthlyBudget)
    });
  } catch (error) {
    console.error('Set budget error:', error);
    res.status(500).json({
      error: 'Failed to update budget',
      message: error.message
    });
  }
};

// Get budget summary
exports.getBudgetSummary = async (req, res) => {
  try {
    const uid = req.user.uid;

    // Get user's monthly budget
    const userData = await firebaseService.getUserByUid(uid);
    if (!userData) {
      return res.status(404).json({
        error: 'User not found',
        message: 'Unable to find user data'
      });
    }

    // Calculate start and end dates for current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Get current month's transactions
    const [expenses, incomes] = await Promise.all([
      firebaseService.getExpensesByDateRange(uid, startOfMonth, endOfMonth),
      firebaseService.getIncomesByDateRange(uid, startOfMonth, endOfMonth)
    ]);

    // Calculate totals
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const totalIncome = incomes.reduce((sum, inc) => sum + inc.amount, 0);
    const balance = totalIncome - totalExpenses;

    // Calculate budget utilization
    const budgetUtilization = userData.monthlyBudget > 0 
      ? (totalExpenses / userData.monthlyBudget) * 100 
      : 0;

    res.json({
      monthlyBudget: userData.monthlyBudget || 0,
      totalIncome,
      totalExpenses,
      balance,
      budgetUtilization: Math.round(budgetUtilization * 100) / 100, // Round to 2 decimal places
      month: now.toLocaleString('default', { month: 'long', year: 'numeric' }),
      transactionCount: {
        expenses: expenses.length,
        incomes: incomes.length
      }
    });
  } catch (error) {
    console.error('Get budget summary error:', error);
    res.status(500).json({
      error: 'Failed to fetch budget summary',
      message: error.message
    });
  }
};

// Get budget history
exports.getBudgetHistory = async (req, res) => {
  try {
    const uid = req.user.uid;
    const { months = 6 } = req.query; // Default to 6 months of history

    const history = [];
    const now = new Date();

    // Get budget history for the specified number of months
    for (let i = 0; i < months; i++) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

      const [expenses, incomes] = await Promise.all([
        firebaseService.getExpensesByDateRange(uid, monthStart, monthEnd),
        firebaseService.getIncomesByDateRange(uid, monthStart, monthEnd)
      ]);

      const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
      const totalIncome = incomes.reduce((sum, inc) => sum + inc.amount, 0);
      const balance = totalIncome - totalExpenses;

      history.push({
        month: monthStart.toLocaleString('default', { month: 'long', year: 'numeric' }),
        totalIncome,
        totalExpenses,
        balance,
        transactionCount: {
          expenses: expenses.length,
          incomes: incomes.length
        }
      });
    }

    res.json({
      message: 'Budget history retrieved successfully',
      history
    });
  } catch (error) {
    console.error('Get budget history error:', error);
    res.status(500).json({
      error: 'Failed to fetch budget history',
      message: error.message
    });
  }
}; 