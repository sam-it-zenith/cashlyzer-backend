const firebaseService = require('../services/firebaseService');
const { EXPENSE_CATEGORIES } = require('../constants/categories');
const { GoogleGenAI } = require('@google/genai');
const nodemailer = require('nodemailer');
const { createObjectCsvWriter } = require('csv-writer');
const path = require('path');
const fs = require('fs');

// Initialize Gemini AI
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Initialize nodemailer transporter
const transporter = nodemailer.createTransport({
  host: 'mail.cashlyzer.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Verify transporter configuration
transporter.verify(function(error, success) {
  if (error) {
    console.error('SMTP configuration error:', error);
  }
});

// Helper function to send email with retries
const sendEmailWithRetry = async (mailOptions, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error(`Attempt ${i + 1} failed:`, error);
      if (i === maxRetries - 1) throw error;
      // Wait for 2 seconds before retrying
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
};

// Get dashboard summary
exports.getDashboardSummary = async (req, res) => {
  try {
    const uid = req.user.uid;

    // Get user's monthly budget
    const userData = await firebaseService.getUserByUid(uid);
    if (!userData) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User data could not be found'
      });
    }

    // Calculate start and end dates for current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Get current month's transactions
    const [currentMonthExpenses, currentMonthIncomes] = await Promise.all([
      firebaseService.getExpensesByDateRange(uid, startOfMonth, endOfMonth),
      firebaseService.getIncomesByDateRange(uid, startOfMonth, endOfMonth)
    ]);

    // Calculate current month totals
    const monthlyExpenses = currentMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const monthlyIncome = currentMonthIncomes.reduce((sum, inc) => sum + inc.amount, 0);
    const monthlyBalance = monthlyIncome - monthlyExpenses;

    // Get all transactions up to current month for running balance
    const [allExpenses, allIncomes] = await Promise.all([
      firebaseService.getExpensesByDateRange(uid, new Date(0), endOfMonth),
      firebaseService.getIncomesByDateRange(uid, new Date(0), endOfMonth)
    ]);

    // Calculate running totals
    const totalExpenses = allExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const totalIncome = allIncomes.reduce((sum, inc) => sum + inc.amount, 0);
    const runningBalance = totalIncome - totalExpenses;

    // Calculate budget status
    const budgetUtilization = userData.monthlyBudget > 0 
      ? (monthlyExpenses / userData.monthlyBudget) * 100 
      : 0;

    // Determine balance status and messages
    const balanceStatus = {
      isNegative: monthlyBalance < 0,
      isOverBudget: budgetUtilization > 100,
      availableToSpend: Math.max(0, userData.monthlyBudget - monthlyExpenses),
      remainingDays: Math.ceil((endOfMonth - now) / (1000 * 60 * 60 * 24)),
      dailyBudget: Math.max(0, (userData.monthlyBudget - monthlyExpenses) / Math.ceil((endOfMonth - now) / (1000 * 60 * 60 * 24)))
    };

    // Generate appropriate messages based on status
    const messages = [];
    if (balanceStatus.isNegative) {
      messages.push({
        type: 'warning',
        message: 'You have exceeded your monthly income. Consider reducing expenses.'
      });
    }
    if (balanceStatus.isOverBudget) {
      messages.push({
        type: 'warning',
        message: 'You have exceeded your monthly budget.'
      });
    }
    if (balanceStatus.availableToSpend > 0) {
      messages.push({
        type: 'info',
        message: `You have $${balanceStatus.availableToSpend.toFixed(2)} remaining in your budget.`
      });
    }
    if (balanceStatus.dailyBudget > 0) {
      messages.push({
        type: 'info',
        message: `Your daily budget is $${balanceStatus.dailyBudget.toFixed(2)} for the remaining ${balanceStatus.remainingDays} days.`
      });
    }

    // Group expenses by category
    const categoryBreakdown = currentMonthExpenses.reduce((acc, expense) => {
      const category = expense.category;
      if (acc[category]) {
        acc[category].amount += expense.amount;
        acc[category].count++;
      } else {
        acc[category] = {
          amount: expense.amount,
          count: 1,
          name: EXPENSE_CATEGORIES[category.toUpperCase()]?.name || category
        };
      }
      return acc;
    }, {});

    // Get top 3 categories by amount
    const topCategories = Object.entries(categoryBreakdown)
      .map(([category, data]) => ({
        category,
        name: data.name,
        amount: data.amount,
        count: data.count
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3);

    // Prepare response
    const summary = {
      monthlyIncome,
      monthlyExpenses,
      monthlyBalance: Math.max(0, monthlyBalance), // Only show positive balance
      runningBalance,
      monthlyBudget: userData.monthlyBudget,
      budgetUtilization: Math.min(100, budgetUtilization), // Cap at 100%
      balanceStatus,
      messages,
      topCategories,
      categoryBreakdown: Object.entries(categoryBreakdown).map(([category, data]) => ({
        category,
        name: data.name,
        amount: data.amount,
        count: data.count,
        percentage: monthlyExpenses > 0 
          ? (data.amount / monthlyExpenses) * 100 
          : 0
      }))
    };

    res.json({
      message: 'Dashboard summary retrieved successfully',
      summary
    });
  } catch (error) {
    console.error('Get dashboard summary error:', error);
    res.status(500).json({
      error: 'Failed to fetch dashboard summary',
      message: error.message
    });
  }
};

// Generate monthly summary
exports.generateMonthlySummary = async (req, res) => {
  try {
    const uid = req.user.uid;
    const userData = await firebaseService.getUserByUid(uid);

    if (!userData) {
      return res.status(404).json({
        error: 'User not found',
        message: 'Unable to find user data'
      });
    }

    // Get current month's data
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Get transactions
    const [expenses, incomes] = await Promise.all([
      firebaseService.getExpensesByDateRange(uid, startOfMonth, endOfMonth),
      firebaseService.getIncomesByDateRange(uid, startOfMonth, endOfMonth)
    ]);

    // Calculate totals
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const totalIncome = incomes.reduce((sum, inc) => sum + inc.amount, 0);
    const netSavings = totalIncome - totalExpenses;

    // Group expenses by category
    const expensesByCategory = expenses.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
      return acc;
    }, {});

    // Create prompt for Gemini
    const prompt = `Generate a detailed monthly financial summary report for ${userData.name} for ${now.toLocaleString('default', { month: 'long', year: 'numeric' })} in html format (use aesthetic and beautiful designs for good-looking).

Financial Overview:
- Total Income: $${totalIncome.toFixed(2)}
- Total Expenses: $${totalExpenses.toFixed(2)}
- Net Savings: $${netSavings.toFixed(2)}
- Monthly Budget: $${userData.monthlyBudget || 0}

Expense Breakdown by Category:
${Object.entries(expensesByCategory).map(([category, amount]) => `- ${category}: $${amount.toFixed(2)}`).join('\n')}

Top Expenses:
${expenses.sort((a, b) => b.amount - a.amount).slice(0, 5).map(exp => `- ${exp.note || exp.category}: $${exp.amount.toFixed(2)}`).join('\n')}

Income Sources:
${incomes.map(inc => `- ${inc.source}: $${inc.amount.toFixed(2)}`).join('\n')}

Please provide:
1. A detailed analysis of spending patterns
2. Areas where expenses can be reduced
3. Progress towards financial goals
4. Key insights and trends

Format the response in a professional, easy-to-read manner.
Provide only the HTML response, no additional text.
This HTML will be used for  for email sending, from the company Cashlyzer (an ai finance tracker application) to the users.
Don't include the $ sign for currency (as different users uses different currency from differnt countries), only write the amount.
Use table format wherever possible.
Cashlyzer image url: https://i.ibb.co/dwHBvr9h/cashlyzer-logo.png
Fontsizes should be a little bit larger (the smallest one will be 18px;)
`;

    // Generate summary using Gemini
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });

    // Clean up the summary text by removing markdown code block markers
    let summary = response.text;
    summary = summary.replace(/^```html\n?/, '').replace(/```$/, '').trim();

    // Create CSV file
    const csvPath = path.join(__dirname, '../temp', `${uid}_${now.getTime()}.csv`);
    const csvWriter = createObjectCsvWriter({
      path: csvPath,
      header: [
        { id: 'date', title: 'Date' },
        { id: 'type', title: 'Type' },
        { id: 'category', title: 'Category' },
        { id: 'amount', title: 'Amount' },
        { id: 'note', title: 'Note' }
      ]
    });

    // Prepare CSV data
    const csvData = [
      ...expenses.map(exp => ({
        date: exp.date.toDate().toISOString().split('T')[0],
        type: 'Expense',
        category: exp.category,
        amount: -exp.amount,
        note: exp.note || ''
      })),
      ...incomes.map(inc => ({
        date: inc.date.toDate().toISOString().split('T')[0],
        type: 'Income',
        category: inc.source,
        amount: inc.amount,
        note: ''
      }))
    ].sort((a, b) => new Date(a.date) - new Date(b.date));

    // Write CSV file
    await csvWriter.writeRecords(csvData);

    // Send email
    const mailOptions = {
      from: 'support@cashlyzer.com',
      to: userData.email,
      subject: `Monthly Financial Summary - ${now.toLocaleString('default', { month: 'long', year: 'numeric' })}`,
      html: `
        <h1>Monthly Financial Summary</h1>
        <p style="font-size: 18px;">Dear <span style="color: darkblue;">${userData.name}</span>,</p>
        <p style="font-size:18px;">Please find attached your monthly financial summary for <span style="color: brown;">${now.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>.</p>
        <div style="white-space: pre-wrap;">${summary}</div>
        <p style="font-size:18px;">Best regards,<br>Cashlyzer Team</p>
      `,
      attachments: [
        {
          filename: 'monthly_transactions.csv',
          path: csvPath
        }
      ]
    };

    try {
      await sendEmailWithRetry(mailOptions);
      // Clean up CSV file
      fs.unlinkSync(csvPath);

      res.json({
        message: 'Monthly summary generated and sent successfully',
        summary: summary
      });
    } catch (error) {
      console.error('Failed to send email after retries:', error);
      // Clean up CSV file even if email fails
      if (fs.existsSync(csvPath)) {
        fs.unlinkSync(csvPath);
      }
      throw error;
    }
  } catch (error) {
    console.error('Generate monthly summary error:', error);
    res.status(500).json({
      error: 'Failed to generate monthly summary',
      message: error.message
    });
  }
}; 