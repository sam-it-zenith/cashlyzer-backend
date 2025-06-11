const firebaseService = require('../services/firebaseService');

// Add new income
exports.addIncome = async (req, res) => {
  try {
    const { amount, source, date } = req.body;
    const uid = req.user.uid;

    // Validate required fields
    if (!amount || !source) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Amount and source are required'
      });
    }

    // Validate amount is a positive number
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        error: 'Invalid amount',
        message: 'Amount must be a positive number'
      });
    }

    const incomeData = {
      amount: Number(amount),
      source,
      date: date ? new Date(date) : new Date()
    };

    const result = await firebaseService.addIncome(uid, incomeData);

    res.status(201).json({
      message: 'Income added successfully',
      incomeId: result.incomeId,
      income: incomeData
    });
  } catch (error) {
    console.error('Add income error:', error);
    res.status(500).json({
      error: 'Failed to add income',
      message: error.message
    });
  }
};

// Get all incomes
exports.getIncomes = async (req, res) => {
  try {
    const uid = req.user.uid;
    const { startDate, endDate } = req.query;

    let incomes;
    if (startDate && endDate) {
      // Convert string dates to Date objects
      const start = new Date(startDate);
      const end = new Date(endDate);

      // Validate dates
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({
          error: 'Invalid date format',
          message: 'Please provide valid dates in ISO format (YYYY-MM-DD)'
        });
      }

      incomes = await firebaseService.getIncomesByDateRange(uid, start, end);
    } else {
      // Get all incomes if no date range is provided
      incomes = await firebaseService.getIncomesByDateRange(
        uid,
        new Date(0), // Beginning of time
        new Date()   // Current date
      );
    }

    // Format dates to ISO string for better readability
    const formattedIncomes = incomes.map(income => ({
      ...income,
      date: income.date.toDate().toISOString().split('T')[0],
      createdAt: income.createdAt.toDate().toISOString()
    }));

    res.json({
      message: 'Incomes retrieved successfully',
      count: formattedIncomes.length,
      incomes: formattedIncomes
    });
  } catch (error) {
    console.error('Get incomes error:', error);
    res.status(500).json({
      error: 'Failed to fetch incomes',
      message: error.message
    });
  }
};

// Delete income
exports.deleteIncome = async (req, res) => {
  try {
    const uid = req.user.uid;
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        error: 'Missing income ID',
        message: 'Please provide an income ID to delete'
      });
    }

    const result = await firebaseService.deleteIncome(uid, id);

    if (!result) {
      return res.status(404).json({
        error: 'Income not found',
        message: 'The specified income does not exist or you do not have permission to delete it'
      });
    }

    res.json({
      message: 'Income deleted successfully',
      incomeId: id
    });
  } catch (error) {
    console.error('Delete income error:', error);
    res.status(500).json({
      error: 'Failed to delete income',
      message: error.message
    });
  }
}; 