const firebaseService = require('../services/firebaseService');
const budgetRecommender = require('../ml/budgetRecommender');
const admin = require('../config/firebase');
const { GoogleGenAI  } = require('@google/genai');

// Initialize Gemini AI
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Get budget recommendations
exports.getBudgetRecommendations = async (req, res) => {
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

    // Get last 3 months of data
    const now = new Date();
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Get historical data
    const expenses = await firebaseService.getExpensesByDateRange(uid, threeMonthsAgo, endOfMonth);

    // Group expenses by month
    const monthlyData = [];
    for (let i = 0; i < 3; i++) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

      const monthExpenses = expenses.filter(exp => {
        const expDate = exp.date.toDate();
        return expDate >= monthStart && expDate <= monthEnd;
      });

      monthlyData.push({
        month: monthStart.toLocaleString('default', { month: 'long', year: 'numeric' }),
        expenses: monthExpenses
      });
    }

    // Reverse the array to get chronological order
    monthlyData.reverse();

    // Get recommendations
    const recommendations = budgetRecommender.generateRecommendations(
      monthlyData,
      userData.monthlyBudget || 0
    );

    // If there's an error in recommendations (e.g., insufficient data)
    if (recommendations.error) {
      return res.status(400).json({
        error: recommendations.error,
        message: recommendations.message
      });
    }

    res.json({
      message: 'Budget recommendations generated successfully',
      monthlyBudget: userData.monthlyBudget || 0,
      recommendations,
      historicalData: monthlyData.map(month => ({
        month: month.month,
        totalExpenses: month.expenses.reduce((sum, exp) => sum + exp.amount, 0),
        transactionCount: month.expenses.length
      }))
    });
  } catch (error) {
    console.error('Get budget recommendations error:', error);
    res.status(500).json({
      error: 'Failed to generate budget recommendations',
      message: error.message
    });
  }
};

// Get AI insights
exports.getInsights = async (req, res) => {
  try {
    const userId = req.user.uid;

    // 1. Fetch transactions
    const transactions = await firebaseService.getUserTransactions(userId);

    if (!transactions || transactions.length === 0) {
      return res.json({
        insights: [
          { type: 'welcome', message: 'Welcome to Cashlyzer! Let\'s get started with managing your finances.' },
          { type: 'getting_started', message: 'Add your first transaction to begin receiving personalized insights.' },
          { type: 'tips', message: 'Pro tip: Set up your monthly budget to get more detailed insights.' }
        ]
      });
    }

    // 2. Fetch user budget
    const userData = await firebaseService.getUserByUid(userId);
    const monthlyBudget = userData?.monthlyBudget || 0;

    // 3. Preprocess data
    const transactionData = transactions.map(t => ({
      amount: t.amount,
      category: t.category,
      date: t.date.toDate().toISOString(),
      description: t.note || t.source || '',
      type: t.type
    }));

    const totalSpent = transactions.reduce((sum, t) => sum + (t.type === 'expense' ? t.amount : 0), 0);
    const totalIncome = transactions.reduce((sum, t) => sum + (t.type === 'income' ? t.amount : 0), 0);
    const avgTransaction = totalIncome + totalSpent > 0 ? 
      (transactions.reduce((sum, t) => sum + t.amount, 0) / transactions.length) : 0;

    const categoryTotals = transactions.reduce((acc, t) => {
      if (t.type === 'expense') {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
      }
      return acc;
    }, {});

    const topCategories = Object.entries(categoryTotals)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6);

    // 4. Create prompt for Gemini
    const prompt = `Analyze these financial transactions and provide insights in JSON format (Don't include any time or date range inside the response):

Financial Summary:
- Monthly Budget: ${monthlyBudget}
- Total Spent: ${totalSpent}
- Total Income: ${totalIncome}
- Average Transaction: ${avgTransaction}
- Top Spending Categories: ${topCategories.map(c => `${c.category}: ${c.amount}`).join(', ')}

Transaction Data:
${JSON.stringify(transactionData, null, 2)}

Generate a JSON response with the following structure:
{
  "insights": [
    {
      "type": "spending_pattern",
      "message": "Detailed insight about spending patterns"
    },
    {
      "type": "savings_opportunity",
      "message": "Specific savings opportunity"
    },
    {
      "type": "budget_recommendation",
      "message": "Budget-related recommendation"
    },
    {
      "type": "financial_tip",
      "message": "Financial Tip based on the given data"
    }
  ],
  "summary": {
    "total_spent": ${totalSpent},
    "total_income": ${totalIncome},
    "average_transaction": ${avgTransaction},
    "top_categories": ${JSON.stringify(topCategories)},
    "budget_status": "${totalSpent > monthlyBudget ? 'Over budget' : 'Within budget'}"
  },
  "predictions": [
    {
      "type": "spending_trend",
      "message": "Prediction about future spending"
    },
    {
      "type": "savings_forecast",
      "message": "Prediction about potential savings"
    }
  ]
}

Provide only the JSON response, no additional text.`;

    // 5. Call Gemini API
    let response;
    try {

      response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
      });

      const responseText = response.text;

      // Extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : null;

      if (!jsonStr) {
        throw new Error('No valid JSON found in response');
      }

      // 6. Parse response
      let analysis = JSON.parse(jsonStr);

      // 7. Save and return
      const insightsWithTimestamp = analysis.insights.map(i => ({
        ...i,
        timestamp: new Date().toISOString()
      }));

      await firebaseService.saveUserInsights(userId, insightsWithTimestamp);

      res.json({
        insights: insightsWithTimestamp,
        summary: analysis.summary,
        predictions: analysis.predictions,
        metadata: {
          totalTransactions: transactions.length,
          lastUpdated: new Date().toISOString(),
          analysisPeriod: 'Last 100 transactions'
        }
      });

    } catch (error) {
      console.error('Error generating insights with Gemini:', error);
      
      // Return fallback analysis
      const fallbackAnalysis = {
        insights: [{ 
          type: 'error', 
          message: 'Could not generate AI insights. Showing basic summary.' 
        }],
        summary: {
          total_spent: totalSpent,
          total_income: totalIncome,
          average_transaction: avgTransaction,
          top_categories: topCategories,
          budget_status: totalSpent > monthlyBudget ? "Over budget" : "Within budget"
        },
        predictions: []
      };

      const insightsWithTimestamp = fallbackAnalysis.insights.map(i => ({
        ...i,
        timestamp: new Date().toISOString()
      }));

      await firebaseService.saveUserInsights(userId, insightsWithTimestamp);

      res.json({
        insights: insightsWithTimestamp,
        summary: fallbackAnalysis.summary,
        predictions: fallbackAnalysis.predictions,
        metadata: {
          totalTransactions: transactions.length,
          lastUpdated: new Date().toISOString(),
          analysisPeriod: 'Last 100 transactions'
        }
      });
    }

  } catch (error) {
    console.error('Error in getInsights:', error);
    res.status(500).json({
      error: 'Error generating insights',
      details: error.message
    });
  }
};

