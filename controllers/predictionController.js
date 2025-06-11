const firebaseService = require('../services/firebaseService');
const savingsPredictor = require('../ml/savingsPredictor');

// Get savings prediction
exports.getSavingsPrediction = async (req, res) => {
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

    // Get last 6 months of data
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Get historical data
    const [expenses, incomes] = await Promise.all([
      firebaseService.getExpensesByDateRange(uid, sixMonthsAgo, endOfMonth),
      firebaseService.getIncomesByDateRange(uid, sixMonthsAgo, endOfMonth)
    ]);

    // Group transactions by month
    const monthlyData = [];
    for (let i = 0; i < 6; i++) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

      const monthExpenses = expenses.filter(exp => {
        const expDate = exp.date.toDate();
        return expDate >= monthStart && expDate <= monthEnd;
      });

      const monthIncomes = incomes.filter(inc => {
        const incDate = inc.date.toDate();
        return incDate >= monthStart && incDate <= monthEnd;
      });

      const totalExpenses = monthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      const totalIncome = monthIncomes.reduce((sum, inc) => sum + inc.amount, 0);

      monthlyData.push({
        month: monthStart.toLocaleString('default', { month: 'long', year: 'numeric' }),
        totalIncome,
        totalExpenses,
        transactionCount: {
          expenses: monthExpenses.length,
          incomes: monthIncomes.length
        }
      });
    }

    // Reverse the array to get chronological order
    monthlyData.reverse();

    // Get prediction
    const prediction = savingsPredictor.predictSavings(monthlyData, userData.monthlyBudget);

    res.json({
      message: 'Savings prediction generated successfully',
      prediction,
      historicalData: monthlyData
    });
  } catch (error) {
    console.error('Get savings prediction error:', error);
    res.status(500).json({
      error: 'Failed to generate savings prediction',
      message: error.message
    });
  }
}; 