const firebaseService = require('../services/firebaseService');
const { isValidCategory, isValidSubcategory, EXPENSE_CATEGORIES } = require('../constants/categories');
const checkBudgetAlerts = require('../utils/checkBudgetAlerts');

// Add new expense
exports.addExpense = async (req, res) => {
  try {
    const { amount, category, subcategory, note, date } = req.body;
    const uid = req.user.uid;

    // Validate required fields
    if (!amount || !category) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Amount and category are required'
      });
    }

    // Validate category
    if (!isValidCategory(category)) {
      return res.status(400).json({
        error: 'Invalid category',
        message: 'Please provide a valid category'
      });
    }

    // Validate subcategory if provided
    if (subcategory && !isValidSubcategory(category, subcategory)) {
      return res.status(400).json({
        error: 'Invalid subcategory',
        message: 'Please provide a valid subcategory for the selected category'
      });
    }
    
    // Get category name from ID
    const categoryName = EXPENSE_CATEGORIES[category.toUpperCase()]?.name || category;
    const subcategoryName = subcategory ? EXPENSE_CATEGORIES[category.toUpperCase()]?.subcategories[subcategory.toUpperCase()]?.name || subcategory : null;

    const expenseData = {
      amount: parseFloat(amount),
      category: categoryName,
      categoryId: category.toUpperCase(), // Store the ID for reference
      subcategory: subcategoryName,
      subcategoryId: subcategory ? subcategory.toUpperCase() : null, // Store the ID for reference
      note,
      date: date ? new Date(date) : new Date(),
      userId: uid
    };

    const expenseId = await firebaseService.addExpense(uid, expenseData);

    // Check for budget alerts
    await checkBudgetAlerts.checkAllAlerts(uid, expenseData);

    res.status(201).json({
      message: 'Expense added successfully',
      expenseId
    });
  } catch (error) {
    console.error('Add expense error:', error);
    res.status(500).json({
      error: 'Failed to add expense',
      message: error.message
    });
  }
};

// Get all expenses
exports.getExpenses = async (req, res) => {
  try {
    const uid = req.user.uid;
    const { startDate, endDate } = req.query;

    let expenses;
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

      expenses = await firebaseService.getExpensesByDateRange(uid, start, end);
    } else {
      // Get all expenses if no date range is provided
      expenses = await firebaseService.getExpensesByDateRange(
        uid,
        new Date(0), // Beginning of time
        new Date()   // Current date
      );
    }

    // Format dates to ISO string for better readability
    const formattedExpenses = expenses.map(expense => ({
      ...expense,
      date: expense.date.toDate().toISOString().split('T')[0],
      createdAt: expense.createdAt.toDate().toISOString()
    }));

    res.json({
      message: 'Expenses retrieved successfully',
      count: formattedExpenses.length,
      expenses: formattedExpenses
    });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({
      error: 'Failed to fetch expenses',
      message: error.message
    });
  }
};

// Delete expense
exports.deleteExpense = async (req, res) => {
  try {
    const uid = req.user.uid;
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        error: 'Missing expense ID',
        message: 'Please provide an expense ID to delete'
      });
    }

    const result = await firebaseService.deleteExpense(uid, id);

    if (!result) {
      return res.status(404).json({
        error: 'Expense not found',
        message: 'The specified expense does not exist or you do not have permission to delete it'
      });
    }

    res.json({
      message: 'Expense deleted successfully',
      expenseId: id
    });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({
      error: 'Failed to delete expense',
      message: error.message
    });
  }
}; 