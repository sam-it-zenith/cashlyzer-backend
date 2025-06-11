const firebaseService = require('../services/firebaseService');
const notificationsService = require('../services/notificationsService');
const { EXPENSE_CATEGORIES } = require('../constants/categories');

class BudgetAlerts {
  constructor() {
    this.budgetThreshold = 0.8; // 80% of budget
    this.spikeThreshold = 0.5; // 50% increase
  }

  // Check budget utilization after new expense
  async checkBudgetUtilization(uid, newExpense) {
    try {
      // Get user's monthly budget
      const userData = await firebaseService.getUserByUid(uid);
      if (!userData || !userData.monthlyBudget) return;

      // Calculate start and end dates for current month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

      // Get current month's expenses
      const expenses = await firebaseService.getExpensesByDateRange(uid, startOfMonth, endOfMonth);
      const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
      const budgetUtilization = totalExpenses / userData.monthlyBudget;

      // Check if budget threshold is exceeded
      if (budgetUtilization >= this.budgetThreshold) {
        const percentage = Math.round(budgetUtilization * 100);
        await notificationsService.createNotification(uid, {
          type: 'budget_alert',
          message: `You're ${percentage}% through your budget for the month!`,
          severity: budgetUtilization >= 1 ? 'high' : 'medium'
        });
      }
    } catch (error) {
      console.error('Check budget utilization error:', error);
    }
  }

  // Check for spending spikes in categories
  async checkCategorySpikes(uid, newExpense) {
    try {
      if (!newExpense.category) return;

      // Get last month's data
      const now = new Date();
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

      // Get expenses for both months
      const [lastMonthExpenses, currentMonthExpenses] = await Promise.all([
        firebaseService.getExpensesByDateRange(uid, lastMonthStart, lastMonthEnd),
        firebaseService.getExpensesByDateRange(uid, currentMonthStart, currentMonthEnd)
      ]);

      // Calculate category totals
      const lastMonthTotal = lastMonthExpenses
        .filter(exp => exp.category === newExpense.category)
        .reduce((sum, exp) => sum + exp.amount, 0);

      const currentMonthTotal = currentMonthExpenses
        .filter(exp => exp.category === newExpense.category)
        .reduce((sum, exp) => sum + exp.amount, 0);

      // Check for spending spike
      if (lastMonthTotal > 0) {
        const increase = (currentMonthTotal - lastMonthTotal) / lastMonthTotal;
        if (increase >= this.spikeThreshold) {
          const categoryName = EXPENSE_CATEGORIES[newExpense.category.toUpperCase()]?.name || newExpense.category;
          await notificationsService.createNotification(uid, {
            type: 'spending_spike',
            message: `Spending on '${categoryName}' increased by ${Math.round(increase * 100)}% this month.`,
            severity: 'medium'
          });
        }
      }
    } catch (error) {
      console.error('Check category spikes error:', error);
    }
  }

  // Check for savings opportunities
  async checkSavingsOpportunities(uid) {
    try {
      // Get user's monthly budget and income
      const userData = await firebaseService.getUserByUid(uid);
      if (!userData || !userData.monthlyBudget) return;

      // Calculate start and end dates for current month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

      // Get current month's transactions
      const [expenses, incomes] = await Promise.all([
        firebaseService.getExpensesByDateRange(uid, startOfMonth, endOfMonth),
        firebaseService.getIncomesByDateRange(uid, startOfMonth, endOfMonth)
      ]);

      const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
      const totalIncome = incomes.reduce((sum, inc) => sum + inc.amount, 0);
      const savings = totalIncome - totalExpenses;

      // Check if savings are below 20% of income
      if (totalIncome > 0) {
        const savingsRate = savings / totalIncome;
        if (savingsRate < 0.2) {
          await notificationsService.createNotification(uid, {
            type: 'savings_alert',
            message: 'Your savings rate is below 20%. Consider reducing expenses to increase savings.',
            severity: 'medium'
          });
        }
      }
    } catch (error) {
      console.error('Check savings opportunities error:', error);
    }
  }

  // Main method to check all alerts
  async checkAllAlerts(uid, newExpense) {
    try {
      await Promise.all([
        this.checkBudgetUtilization(uid, newExpense),
        this.checkCategorySpikes(uid, newExpense),
        this.checkSavingsOpportunities(uid)
      ]);
    } catch (error) {
      console.error('Check all alerts error:', error);
    }
  }
}

module.exports = new BudgetAlerts(); 