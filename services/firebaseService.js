const admin = require('../config/firebase');

class FirebaseService {
  constructor() {
    this.db = admin.firestore();
  }

  // User Management
  async createUser(userData) {
    try {
      const { uid, email, name, profilePictureUrl } = userData;
      const userRef = this.db.collection('users').doc(uid);
      
      await userRef.set({
        uid,
        email,
        name,
        profilePictureUrl: profilePictureUrl || null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        monthlyBudget: 0
      });

      return { success: true, uid };
    } catch (error) {
      throw new Error(`Error creating user: ${error.message}`);
    }
  }

  async getUserByUid(uid) {
    try {
      const userDoc = await this.db.collection('users').doc(uid).get();
      return userDoc.exists ? userDoc.data() : null;
    } catch (error) {
      throw new Error(`Error fetching user: ${error.message}`);
    }
  }

  async updateUserBudget(uid, monthlyBudget) {
    try {
      await this.db.collection('users').doc(uid).update({
        monthlyBudget,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      return true;
    } catch (error) {
      throw new Error(`Error updating budget: ${error.message}`);
    }
  }

  // Expenses Management
  async addExpense(uid, expenseData) {
    try {
      const { amount, category, note, date } = expenseData;
      const expenseRef = this.db.collection('users').doc(uid).collection('expenses').doc();
      
      await expenseRef.set({
        amount,
        category,
        note: note || '',
        date: date || admin.firestore.FieldValue.serverTimestamp(),
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return { success: true, expenseId: expenseRef.id };
    } catch (error) {
      throw new Error(`Error adding expense: ${error.message}`);
    }
  }

  async getExpensesByDateRange(uid, startDate, endDate) {
    try {
      const expensesRef = this.db.collection('users').doc(uid).collection('expenses');
      const snapshot = await expensesRef
        .where('date', '>=', startDate)
        .where('date', '<=', endDate)
        .orderBy('date', 'desc')
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      throw new Error(`Error fetching expenses: ${error.message}`);
    }
  }

  async deleteExpense(uid, expenseId) {
    try {
      const expenseRef = this.db.collection('users').doc(uid).collection('expenses').doc(expenseId);
      const expenseDoc = await expenseRef.get();

      if (!expenseDoc.exists) {
        return false;
      }

      await expenseRef.delete();
      return true;
    } catch (error) {
      throw new Error(`Error deleting expense: ${error.message}`);
    }
  }

  // Income Management
  async addIncome(uid, incomeData) {
    try {
      const { amount, source, date } = incomeData;
      const incomeRef = this.db.collection('users').doc(uid).collection('incomes').doc();
      
      await incomeRef.set({
        amount,
        source,
        date: date || admin.firestore.FieldValue.serverTimestamp(),
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return { success: true, incomeId: incomeRef.id };
    } catch (error) {
      throw new Error(`Error adding income: ${error.message}`);
    }
  }

  async getIncomesByDateRange(uid, startDate, endDate) {
    try {
      const incomesRef = this.db.collection('users').doc(uid).collection('incomes');
      const snapshot = await incomesRef
        .where('date', '>=', startDate)
        .where('date', '<=', endDate)
        .orderBy('date', 'desc')
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      throw new Error(`Error fetching incomes: ${error.message}`);
    }
  }

  async deleteIncome(uid, incomeId) {
    try {
      const incomeRef = this.db.collection('users').doc(uid).collection('incomes').doc(incomeId);
      const incomeDoc = await incomeRef.get();

      if (!incomeDoc.exists) {
        return false;
      }

      await incomeRef.delete();
      return true;
    } catch (error) {
      throw new Error(`Error deleting income: ${error.message}`);
    }
  }

  // Predictions Management
  async addPrediction(uid, predictionData) {
    try {
      const { predictedSavings, predictionDate, basedOn } = predictionData;
      const predictionRef = this.db.collection('users').doc(uid).collection('predictions').doc();
      
      await predictionRef.set({
        predictedSavings,
        predictionDate,
        basedOn,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return { success: true, predictionId: predictionRef.id };
    } catch (error) {
      throw new Error(`Error adding prediction: ${error.message}`);
    }
  }

  async getLatestPrediction(uid) {
    try {
      const predictionsRef = this.db.collection('users').doc(uid).collection('predictions');
      const snapshot = await predictionsRef
        .orderBy('createdAt', 'desc')
        .limit(1)
        .get();

      return snapshot.docs[0]?.data() || null;
    } catch (error) {
      throw new Error(`Error fetching prediction: ${error.message}`);
    }
  }

  // Transaction Summary
  async getTransactionSummary(uid, startDate, endDate) {
    try {
      const [expenses, incomes] = await Promise.all([
        this.getExpensesByDateRange(uid, startDate, endDate),
        this.getIncomesByDateRange(uid, startDate, endDate)
      ]);

      const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
      const totalIncomes = incomes.reduce((sum, inc) => sum + inc.amount, 0);
      const netSavings = totalIncomes - totalExpenses;

      return {
        totalExpenses,
        totalIncomes,
        netSavings,
        transactionCount: expenses.length + incomes.length
      };
    } catch (error) {
      throw new Error(`Error generating summary: ${error.message}`);
    }
  }

  // Savings functions
  async createSavingsPlan(uid, savingsData) {
    try {
      const savingsRef = this.db.collection('users').doc(uid).collection('savings').doc();
      const savings = {
        ...savingsData,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        userId: uid
      };
      await savingsRef.set(savings);
      return savingsRef.id;
    } catch (error) {
      console.error('Create savings plan error:', error);
      throw error;
    }
  }

  async getSavingsPlan(uid) {
    try {
      const savingsRef = this.db.collection('users').doc(uid).collection('savings');
      const snapshot = await savingsRef.get();
      
      if (snapshot.empty) {
        return null;
      }

      // Get the most recent savings plan
      const savingsDoc = snapshot.docs[0];
      return {
        id: savingsDoc.id,
        ...savingsDoc.data()
      };
    } catch (error) {
      console.error('Get savings plan error:', error);
      throw error;
    }
  }

  async updateSavingsPlan(uid, savingsId, updates) {
    try {
      const savingsRef = this.db.collection('users').doc(uid).collection('savings').doc(savingsId);
      const updateData = {
        ...updates,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      await savingsRef.update(updateData);
      return savingsId;
    } catch (error) {
      console.error('Update savings plan error:', error);
      throw error;
    }
  }

  async deleteSavingsPlan(uid, savingsId) {
    try {
      const savingsRef = this.db.collection('users').doc(uid).collection('savings').doc(savingsId);
      await savingsRef.delete();
      return true;
    } catch (error) {
      console.error('Delete savings plan error:', error);
      throw error;
    }
  }

  // Get user profile
  async getUserProfile(userId) {
    try {
      const userDoc = await this.db.collection('users').doc(userId).get();
      if (!userDoc.exists) {
        return null;
      }
      return userDoc.data();
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  }

  // Update user profile
  async updateUserProfile(userId, updateData) {
    try {
      const userRef = this.db.collection('users').doc(userId);
      
      // Add timestamp for the update
      const dataToUpdate = {
        ...updateData,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      // If profile picture URL is being removed, set it to null
      if (updateData.profilePictureUrl === '') {
        dataToUpdate.profilePictureUrl = null;
      }

      await userRef.update(dataToUpdate);
      return true;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  // Delete user profile
  async deleteUserProfile(userId) {
    try {
      // Delete user data from Firestore
      await this.db.collection('users').doc(userId).delete();
      
      // Delete user from Firebase Authentication
      await admin.auth().deleteUser(userId);
      
      return true;
    } catch (error) {
      console.error('Error deleting user profile:', error);
      throw error;
    }
  }

  // Save user insights
  async saveUserInsights(userId, insights) {
    try {
      const userRef = this.db.collection('users').doc(userId);
      await userRef.collection('insights').add({
        insights,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } catch (error) {
      console.error('Error saving insights:', error);
      throw error;
    }
  }

  // Get user transactions
  async getUserTransactions(userId) {
    try {
      // Get expenses
      const expensesRef = this.db.collection('users').doc(userId).collection('expenses')
        .orderBy('date', 'desc')
        .limit(100);
      const expensesSnapshot = await expensesRef.get();
      const expenses = expensesSnapshot.docs.map(doc => ({
        id: doc.id,
        type: 'expense',
        ...doc.data()
      }));

      // Get incomes
      const incomesRef = this.db.collection('users').doc(userId).collection('incomes')
        .orderBy('date', 'desc')
        .limit(100);
      const incomesSnapshot = await incomesRef.get();
      const incomes = incomesSnapshot.docs.map(doc => ({
        id: doc.id,
        type: 'income',
        ...doc.data()
      }));

      // Combine and sort by date
      const allTransactions = [...expenses, ...incomes]
        .sort((a, b) => b.date.toDate() - a.date.toDate())
        .slice(0, 100); // Get latest 100 transactions

      return allTransactions;
    } catch (error) {
      console.error('Error getting user transactions:', error);
      throw error;
    }
  }
}

// Create a single instance and export it
const firebaseService = new FirebaseService();
module.exports = firebaseService; 