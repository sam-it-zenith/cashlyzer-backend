const regression = require('ml-regression-simple-linear');

class SavingsPredictor {
  constructor() {
    this.minDataPoints = 3; // Minimum months of data needed for prediction
  }

  // Calculate moving average of savings
  calculateMovingAverage(data, windowSize = 3) {
    if (data.length < windowSize) return null;
    
    const movingAverages = [];
    for (let i = windowSize - 1; i < data.length; i++) {
      const window = data.slice(i - windowSize + 1, i + 1);
      const average = window.reduce((sum, val) => sum + val, 0) / windowSize;
      movingAverages.push(average);
    }
    return movingAverages;
  }

  // Generate savings trend using linear regression
  predictSavingsTrend(historicalData) {
    if (historicalData.length < this.minDataPoints) {
      return null;
    }

    // Prepare data for regression
    const x = Array.from({ length: historicalData.length }, (_, i) => i);
    const y = historicalData.map(data => data.savings);

    // Create and train the regression model
    const model = new regression(x, y);

    // Predict next month's savings
    const nextMonthIndex = historicalData.length;
    const predictedSavings = Math.round(model.predict(nextMonthIndex));

    return {
      predictedSavings,
      trend: model.slope > 0 ? 'increasing' : 'decreasing',
      confidence: Math.abs(model.r2) // R-squared value as confidence measure
    };
  }

  // Generate savings suggestion based on prediction and budget
  generateSuggestion(prediction, monthlyBudget) {
    if (!prediction) {
      return "Not enough data to make a prediction. Please enter at least 3 months of income and expenses.";
    }

    const { predictedSavings, trend, confidence } = prediction;
    const budgetUtilization = (predictedSavings / monthlyBudget) * 100;

    let suggestion = "";
    
    if (confidence < 0.5) {
      suggestion = "Your savings pattern is quite variable. Consider tracking expenses more consistently.";
    } else if (trend === 'increasing') {
      if (budgetUtilization >= 90) {
        suggestion = "Great job! You're exceeding your savings goals. Consider increasing your budget.";
      } else if (budgetUtilization >= 70) {
        suggestion = "You're on track! Keep up the good work with your current spending habits.";
      } else {
        suggestion = "Your savings are improving. Try to maintain this positive trend.";
      }
    } else {
      if (budgetUtilization < 50) {
        suggestion = "Warning: Your savings are decreasing. Review your recent expenses and adjust your budget.";
      } else {
        suggestion = "Your savings are slightly decreasing. Consider reviewing your spending patterns.";
      }
    }

    return {
      predictedSavings,
      suggestion,
      trend,
      confidence: Math.round(confidence * 100),
      budgetUtilization: Math.round(budgetUtilization)
    };
  }

  // Main prediction method
  predictSavings(historicalData, monthlyBudget) {
    // Calculate savings for each month
    const savingsData = historicalData.map(month => ({
      ...month,
      savings: month.totalIncome - month.totalExpenses
    }));

    // Get prediction using regression
    const prediction = this.predictSavingsTrend(savingsData);

    // Generate suggestion
    return this.generateSuggestion(prediction, monthlyBudget);
  }
}

module.exports = new SavingsPredictor(); 