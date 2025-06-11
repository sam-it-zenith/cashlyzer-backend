const { EXPENSE_CATEGORIES } = require('../constants/categories');

class BudgetRecommender {
  constructor() {
    this.categories = Object.keys(EXPENSE_CATEGORIES).reduce((acc, key) => {
      acc[EXPENSE_CATEGORIES[key].id] = 0;
      return acc;
    }, {});
  }

  // Calculate average spending by category
  calculateCategoryAverages(expenses) {
    const categoryTotals = { ...this.categories };
    const categoryCounts = { ...this.categories };

    expenses.forEach(expense => {
      if (categoryTotals.hasOwnProperty(expense.category)) {
        categoryTotals[expense.category] += expense.amount;
        categoryCounts[expense.category]++;
      }
    });

    return Object.keys(categoryTotals).reduce((acc, category) => {
      acc[category] = categoryCounts[category] > 0 
        ? categoryTotals[category] / categoryCounts[category]
        : 0;
      return acc;
    }, {});
  }

  // Analyze spending patterns
  analyzeSpendingPatterns(expenses) {
    const categoryTotals = { ...this.categories };
    const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    expenses.forEach(expense => {
      if (categoryTotals.hasOwnProperty(expense.category)) {
        categoryTotals[expense.category] += expense.amount;
      }
    });

    return Object.keys(categoryTotals).reduce((acc, category) => {
      acc[category] = totalSpent > 0 
        ? (categoryTotals[category] / totalSpent) * 100
        : 0;
      return acc;
    }, {});
  }

  // Determine spending trends
  determineSpendingTrends(expenses) {
    const monthlyTotals = {};
    const trends = { ...this.categories };

    // Group expenses by month
    expenses.forEach(expense => {
      try {
        // Handle Firestore timestamp format
        let date;
        if (expense.date && expense.date._seconds) {
          date = new Date(expense.date._seconds * 1000);
        } else {
          date = expense.date instanceof Date ? expense.date : new Date(expense.date);
        }
        
        // Check if date is valid
        if (isNaN(date.getTime())) {
          console.warn(`Invalid date for expense: ${JSON.stringify(expense)}`);
          return; // Skip this expense
        }

        const month = date.toISOString().slice(0, 7);
      if (!monthlyTotals[month]) {
        monthlyTotals[month] = { ...this.categories };
      }
      if (monthlyTotals[month].hasOwnProperty(expense.category)) {
        monthlyTotals[month][expense.category] += expense.amount;
        }
      } catch (error) {
        console.warn(`Error processing expense date: ${error.message}`);
        return; // Skip this expense
      }
    });

    // Calculate trends
    Object.keys(trends).forEach(category => {
      const monthlyValues = Object.values(monthlyTotals).map(month => month[category]);
      if (monthlyValues.length >= 2) {
        const firstMonth = monthlyValues[0];
        const lastMonth = monthlyValues[monthlyValues.length - 1];
        trends[category] = firstMonth > 0 
          ? ((lastMonth - firstMonth) / firstMonth) * 100
          : 0;
      }
    });

    return trends;
  }

  // Generate budget recommendations
  generateRecommendations(expenses, incomes, monthlyBudget) {
    // Check if expenses is an array and has items
    if (!Array.isArray(expenses) || expenses.length === 0) {
      return {
        recommendations: {},
        insights: [{
          type: 'welcome',
          message: 'Welcome to Cashlyzer! Let\'s get started with managing your finances.'
        }, {
          type: 'getting_started',
          message: 'Add your first expense to begin tracking your spending habits.'
        }, {
          type: 'tips',
          message: 'Pro tip: Set up your monthly budget to get personalized recommendations.'
        }],
        summary: {
          totalMonthlyBudget: monthlyBudget || 0,
          averageMonthlyIncome: 0,
          totalExpenses: 0
        }
      };
    }

    const categoryAverages = this.calculateCategoryAverages(expenses);
    const spendingPatterns = this.analyzeSpendingPatterns(expenses);
    const spendingTrends = this.determineSpendingTrends(expenses);

    // Calculate total income
    const incomeArray = Array.isArray(incomes) ? incomes : [];
    const totalIncome = incomeArray.reduce((sum, inc) => sum + (inc.amount || 0), 0);
    const averageMonthlyIncome = totalIncome / (incomeArray.length || 1);

    // Generate recommendations based on patterns and trends
    const recommendations = Object.keys(this.categories).reduce((acc, category) => {
      const currentSpending = spendingPatterns[category];
      const trend = spendingTrends[category];
      const average = categoryAverages[category];

      // Calculate recommended budget
      let recommendedBudget = averageMonthlyIncome * (currentSpending / 100);

      // Adjust based on trends
      if (trend > 20) {
        // If spending is increasing rapidly, suggest a reduction
        recommendedBudget *= 0.9;
      } else if (trend < -20) {
        // If spending is decreasing rapidly, allow for some increase
        recommendedBudget *= 1.1;
      }

      // Ensure recommendation doesn't exceed monthly budget
      recommendedBudget = Math.min(recommendedBudget, monthlyBudget * (currentSpending / 100));

      acc[category] = {
        recommended: Math.round(recommendedBudget),
        current: Math.round(average),
        trend: Math.round(trend),
        percentage: Math.round(currentSpending)
      };

      return acc;
    }, {});

    // Generate insights
    const insights = this.generateInsights(recommendations, spendingPatterns, spendingTrends, monthlyBudget);

    return {
      recommendations,
      insights,
      summary: {
        totalMonthlyBudget: monthlyBudget,
        averageMonthlyIncome: Math.round(averageMonthlyIncome),
        totalExpenses: Math.round(expenses.reduce((sum, exp) => sum + exp.amount, 0))
      }
    };
  }

  // Generate insights based on recommendations and patterns
  generateInsights(recommendations, patterns, trends, monthlyBudget) {
    const insights = [];

    // Calculate total expenses
    const totalExpenses = Object.values(patterns).reduce((sum, percentage) => sum + percentage, 0);

    // For existing users, generate regular insights
    // Find top spending categories
    const topCategories = Object.entries(patterns)
      .filter(([, percentage]) => percentage > 0) // Only include categories with actual spending
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    if (topCategories.length > 0) {
    insights.push({
      type: 'top_categories',
      message: `Your top spending categories are: ${topCategories
        .map(([category, percentage]) => 
            `${EXPENSE_CATEGORIES[category.toUpperCase()]?.name || category} ${Math.round(percentage)}%`)
        .join(', ')}`
    });
    }

    // Identify significant trends
    Object.entries(trends).forEach(([category, trend]) => {
      if (Math.abs(trend) > 20) {
        insights.push({
          type: 'spending_trend',
          message: `Spending on ${EXPENSE_CATEGORIES[category.toUpperCase()]?.name || category} has ${trend > 0 ? 'increased' : 'decreased'} by ${Math.abs(Math.round(trend))}%`
        });
      }
    });

    // Add budget utilization insights
    const totalRecommended = Object.values(recommendations)
      .reduce((sum, rec) => sum + (rec.recommended || 0), 0);

    if (totalRecommended > 0 && monthlyBudget > 0) {
      const utilization = (totalRecommended / monthlyBudget) * 100;
      insights.push({
        type: 'budget_utilization',
        message: `Your recommended budget allocation represents ${Math.round(utilization)}% of your total monthly budget`
      });
    }

    // Add savings insights using actual amounts from recommendations
    const totalIncome = Object.values(recommendations)
      .reduce((sum, rec) => sum + (rec.recommended || 0), 0);
    const actualExpenses = Object.values(recommendations)
      .reduce((sum, rec) => sum + (rec.current || 0), 0);
    
    // Calculate savings rate: (Income - Expenses) / Income * 100
    const savingsRate = totalIncome > 0 ? ((totalIncome - actualExpenses) / totalIncome) * 100 : 0;

    if (savingsRate < 20) {
      insights.push({
        type: 'savings_alert',
        message: 'Your savings rate is below 20%. Consider reducing expenses to increase savings.'
      });
    } else if (savingsRate > 30) {
      insights.push({
        type: 'savings_success',
        message: `Great job! You're saving ${Math.round(savingsRate)}% of your income.`
      });
    } else {
      insights.push({
        type: 'savings_info',
        message: `Your current savings rate is ${Math.round(savingsRate)}%.`
      });
    }

    // Add category-specific insights
    Object.entries(patterns).forEach(([category, percentage]) => {
      if (percentage > 30) { // If any category exceeds 30% of spending
        insights.push({
          type: 'category_alert',
          message: `${EXPENSE_CATEGORIES[category.toUpperCase()]?.name || category} represents ${Math.round(percentage)}% of your spending. Consider if this aligns with your financial goals.`
        });
      }
    });

    // If no insights were generated, add a general insight
    if (insights.length === 0) {
      insights.push({
        type: 'general',
        message: 'Keep tracking your expenses to get more personalized insights.'
      });
    }

    return insights;
  }
}

module.exports = new BudgetRecommender(); 