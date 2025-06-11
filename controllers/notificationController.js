const firebaseService = require('../services/firebaseService');
const { GoogleGenAI } = require('@google/genai');

// Initialize Gemini AI
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Generate notifications
exports.generateNotifications = async (req, res) => {
  try {
    const userId = req.user.uid;

    // 1. Fetch transactions
    const transactions = await firebaseService.getUserTransactions(userId);

    if (!transactions || transactions.length === 0) {
      return res.json({
        notifications: [
          {
            type: 'welcome',
            title: 'Welcome to Cashlyzer!',
            message: 'Start tracking your expenses to get personalized notifications.',
            priority: 'high',
            timestamp: new Date().toISOString()
          }
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
    const prompt = `Generate personalized financial notifications based on these transactions in JSON format (Don't include any time or date range inside the response):

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
  "notifications": [
    {
      "type": "budget_alert",
      "title": "Budget Alert Title",
      "message": "Detailed notification message",
      "priority": "high|medium|low"
    },
    {
      "type": "spending_alert",
      "title": "Spending Alert Title",
      "message": "Detailed notification message",
      "priority": "high|medium|low"
    },
    {
      "type": "savings_opportunity",
      "title": "Savings Opportunity Title",
      "message": "Detailed notification message",
      "priority": "high|medium|low"
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

      // 7. Add timestamps and save
      const notificationsWithTimestamp = analysis.notifications.map(n => ({
        ...n,
        timestamp: new Date().toISOString()
      }));

      await firebaseService.saveUserNotifications(userId, notificationsWithTimestamp);

      res.json({
        notifications: notificationsWithTimestamp,
        metadata: {
          totalTransactions: transactions.length,
          lastUpdated: new Date().toISOString(),
          analysisPeriod: 'Last 100 transactions'
        }
      });

    } catch (error) {
      console.error('Error generating notifications with Gemini:', error);
      
      // Return fallback notifications
      const fallbackNotifications = [{
        type: 'error',
        title: 'Basic Summary',
        message: 'Could not generate AI notifications. Showing basic summary.',
        priority: 'medium',
        timestamp: new Date().toISOString()
      }];

      await firebaseService.saveUserNotifications(userId, fallbackNotifications);

      res.json({
        notifications: fallbackNotifications,
        metadata: {
          totalTransactions: transactions.length,
          lastUpdated: new Date().toISOString(),
          analysisPeriod: 'Last 100 transactions'
        }
      });
    }

  } catch (error) {
    console.error('Error in generateNotifications:', error);
    res.status(500).json({
      error: 'Error generating notifications',
      details: error.message
    });
  }
}; 