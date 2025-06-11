const firebaseService = require('../services/firebaseService');

// Helper function to calculate current balance
const calculateCurrentBalance = async (uid) => {
  try {
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

    // Calculate net balance
    const netBalance = totalIncome - totalExpenses;

    return {
      totalExpenses,
      totalIncome,
      netBalance,
      isNegative: netBalance < 0
    };
  } catch (error) {
    console.error('Calculate balance error:', error);
    throw error;
  }
};

// Create a new savings plan
exports.createSavingsPlan = async (req, res) => {
  try {
    const { monthlyContribution, targetAmount, targetDate } = req.body;
    const uid = req.user.uid;

    // Validate required fields
    if (!monthlyContribution || !targetAmount) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Monthly contribution and target amount are required'
      });
    }

    // Validate numeric values
    if (isNaN(monthlyContribution) || isNaN(targetAmount)) {
      return res.status(400).json({
        error: 'Invalid values',
        message: 'Monthly contribution and target amount must be numbers'
      });
    }

    // Check current balance
    const balance = await calculateCurrentBalance(uid);
    if (balance.isNegative) {
      return res.status(400).json({
        error: 'Insufficient balance',
        message: 'Cannot create savings plan while having negative balance. Please clear your negative balance first.'
      });
    }

    // Validate monthly contribution against income
    if (monthlyContribution > balance.totalIncome) {
      return res.status(400).json({
        error: 'Invalid contribution',
        message: 'Monthly contribution cannot exceed your monthly income'
      });
    }

    // Create savings plan
    const savingsData = {
      monthlyContribution: parseFloat(monthlyContribution),
      targetAmount: parseFloat(targetAmount),
      targetDate: targetDate ? new Date(targetDate) : null,
      currentAmount: 0,
      startDate: new Date(),
      lastContributionDate: null,
      totalContributions: 0,
      monthlyBalance: balance.netBalance
    };

    const savingsId = await firebaseService.createSavingsPlan(uid, savingsData);

    res.status(201).json({
      message: 'Savings plan created successfully',
      savingsId,
      currentBalance: balance.netBalance
    });
  } catch (error) {
    console.error('Create savings plan error:', error);
    res.status(500).json({
      error: 'Failed to create savings plan',
      message: error.message
    });
  }
};

// Get savings plan
exports.getSavingsPlan = async (req, res) => {
  try {
    const uid = req.user.uid;
    const savingsPlan = await firebaseService.getSavingsPlan(uid);

    if (!savingsPlan) {
      return res.status(404).json({
        error: 'Savings plan not found',
        message: 'No savings plan exists for this user'
      });
    }

    // Get current balance
    const balance = await calculateCurrentBalance(uid);

    // Update savings plan with current balance
    const updatedPlan = {
      ...savingsPlan,
      currentBalance: balance.netBalance,
      canContribute: !balance.isNegative && balance.netBalance >= savingsPlan.monthlyContribution
    };

    res.json({
      message: 'Savings plan retrieved successfully',
      savingsPlan: updatedPlan
    });
  } catch (error) {
    console.error('Get savings plan error:', error);
    res.status(500).json({
      error: 'Failed to fetch savings plan',
      message: error.message
    });
  }
};

// Update savings plan
exports.updateSavingsPlan = async (req, res) => {
  try {
    const { monthlyContribution, targetAmount, targetDate } = req.body;
    const uid = req.user.uid;
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        error: 'Missing savings plan ID',
        message: 'Please provide a savings plan ID to update'
      });
    }

    // Get existing savings plan
    const existingPlan = await firebaseService.getSavingsPlan(uid);
    if (!existingPlan) {
      return res.status(404).json({
        error: 'Savings plan not found',
        message: 'The specified savings plan does not exist'
      });
    }

    // Check current balance
    const balance = await calculateCurrentBalance(uid);
    if (balance.isNegative) {
      return res.status(400).json({
        error: 'Insufficient balance',
        message: 'Cannot update savings plan while having negative balance. Please clear your negative balance first.'
      });
    }

    // Validate monthly contribution against income
    if (monthlyContribution && monthlyContribution > balance.totalIncome) {
      return res.status(400).json({
        error: 'Invalid contribution',
        message: 'Monthly contribution cannot exceed your monthly income'
      });
    }

    // Prepare updates
    const updates = {};
    if (monthlyContribution !== undefined) {
      updates.monthlyContribution = parseFloat(monthlyContribution);
    }
    if (targetAmount !== undefined) {
      updates.targetAmount = parseFloat(targetAmount);
    }
    if (targetDate !== undefined) {
      updates.targetDate = new Date(targetDate);
    }
    updates.monthlyBalance = balance.netBalance;

    // Update savings plan
    await firebaseService.updateSavingsPlan(uid, id, updates);

    res.json({
      message: 'Savings plan updated successfully',
      savingsId: id,
      currentBalance: balance.netBalance
    });
  } catch (error) {
    console.error('Update savings plan error:', error);
    res.status(500).json({
      error: 'Failed to update savings plan',
      message: error.message
    });
  }
};

// Delete savings plan
exports.deleteSavingsPlan = async (req, res) => {
  try {
    const uid = req.user.uid;
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        error: 'Missing savings plan ID',
        message: 'Please provide a savings plan ID to delete'
      });
    }

    const result = await firebaseService.deleteSavingsPlan(uid, id);

    if (!result) {
      return res.status(404).json({
        error: 'Savings plan not found',
        message: 'The specified savings plan does not exist'
      });
    }

    res.json({
      message: 'Savings plan deleted successfully',
      savingsId: id
    });
  } catch (error) {
    console.error('Delete savings plan error:', error);
    res.status(500).json({
      error: 'Failed to delete savings plan',
      message: error.message
    });
  }
};

// Contribute to savings
exports.contributeToSavings = async (req, res) => {
  try {
    const uid = req.user.uid;
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        error: 'Missing savings plan ID',
        message: 'Please provide a savings plan ID to contribute'
      });
    }

    // Get existing savings plan
    const existingPlan = await firebaseService.getSavingsPlan(uid);
    if (!existingPlan) {
      return res.status(404).json({
        error: 'Savings plan not found',
        message: 'The specified savings plan does not exist'
      });
    }

    // Check current balance
    const balance = await calculateCurrentBalance(uid);
    if (balance.isNegative) {
      return res.status(400).json({
        error: 'Insufficient balance',
        message: 'Cannot contribute while having negative balance'
      });
    }

    // Check if user can contribute
    if (balance.netBalance < existingPlan.monthlyContribution) {
      return res.status(400).json({
        error: 'Insufficient funds',
        message: 'Your current balance is insufficient for the monthly contribution'
      });
    }

    // Record the contribution as an expense
    const expenseData = {
      amount: existingPlan.monthlyContribution,
      category: 'Savings',
      note: `Monthly contribution to savings plan: ${existingPlan.targetAmount}`,
      date: new Date()
    };

    await firebaseService.addExpense(uid, expenseData);

    // Prepare updates for savings plan
    const updates = {
      currentAmount: existingPlan.currentAmount + existingPlan.monthlyContribution,
      lastContributionDate: new Date(),
      totalContributions: existingPlan.totalContributions + 1,
      monthlyBalance: balance.netBalance - existingPlan.monthlyContribution // Update balance after contribution
    };

    // Update savings plan
    await firebaseService.updateSavingsPlan(uid, id, updates);

    // Get updated balance after contribution
    const updatedBalance = await calculateCurrentBalance(uid);

    res.json({
      message: 'Contribution successful',
      savingsId: id,
      contribution: existingPlan.monthlyContribution,
      newBalance: updatedBalance.netBalance,
      updatedPlan: {
        ...existingPlan,
        ...updates
      },
      expense: {
        id: expenseData.id,
        amount: expenseData.amount,
        category: expenseData.category,
        date: expenseData.date
      }
    });
  } catch (error) {
    console.error('Contribute to savings error:', error);
    res.status(500).json({
      error: 'Failed to contribute to savings',
      message: error.message
    });
  }
}; 