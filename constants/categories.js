const EXPENSE_CATEGORIES = {
  // Basic Necessities
  FOOD: {
    id: 'food',
    name: 'Food & Dining',
    subcategories: [
      'Groceries',
      'Restaurants',
      'Takeout',
      'Coffee Shops',
      'Fast Food',
      'Snacks'
    ]
  },
  HOUSING: {
    id: 'housing',
    name: 'Housing',
    subcategories: [
      'Rent',
      'Mortgage',
      'Property Tax',
      'Home Insurance',
      'Maintenance',
      'Utilities',
      'Furniture',
      'Home Decor'
    ]
  },
  TRANSPORT: {
    id: 'transport',
    name: 'Transportation',
    subcategories: [
      'Car Payment',
      'Car Insurance',
      'Gas',
      'Public Transit',
      'Ride Sharing',
      'Parking',
      'Maintenance',
      'Tolls'
    ]
  },

  // Personal Care
  HEALTH: {
    id: 'health',
    name: 'Health & Medical',
    subcategories: [
      'Doctor Visits',
      'Dentist',
      'Pharmacy',
      'Health Insurance',
      'Fitness',
      'Supplements',
      'Medical Devices'
    ]
  },
  PERSONAL_CARE: {
    id: 'personal_care',
    name: 'Personal Care',
    subcategories: [
      'Haircuts',
      'Cosmetics',
      'Toiletries',
      'Spa',
      'Beauty Products',
      'Personal Hygiene'
    ]
  },

  // Lifestyle
  SHOPPING: {
    id: 'shopping',
    name: 'Shopping',
    subcategories: [
      'Clothing',
      'Electronics',
      'Books',
      'Gifts',
      'Home Goods',
      'Accessories'
    ]
  },
  ENTERTAINMENT: {
    id: 'entertainment',
    name: 'Entertainment',
    subcategories: [
      'Movies',
      'Streaming Services',
      'Concerts',
      'Events',
      'Games',
      'Hobbies',
      'Subscriptions'
    ]
  },

  // Financial
  FINANCIAL: {
    id: 'financial',
    name: 'Financial',
    subcategories: [
      'Investments',
      'Savings',
      'Loans',
      'Credit Cards',
      'Bank Fees',
      'Taxes'
    ]
  },
  INSURANCE: {
    id: 'insurance',
    name: 'Insurance',
    subcategories: [
      'Life Insurance',
      'Health Insurance',
      'Car Insurance',
      'Home Insurance',
      'Travel Insurance'
    ]
  },

  // Education & Work
  EDUCATION: {
    id: 'education',
    name: 'Education',
    subcategories: [
      'Tuition',
      'Books',
      'Courses',
      'Software',
      'Equipment',
      'Certifications'
    ]
  },
  WORK: {
    id: 'work',
    name: 'Work Expenses',
    subcategories: [
      'Office Supplies',
      'Professional Development',
      'Business Travel',
      'Work Equipment',
      'Business Meals'
    ]
  },

  // Travel & Leisure
  TRAVEL: {
    id: 'travel',
    name: 'Travel',
    subcategories: [
      'Flights',
      'Hotels',
      'Vacation',
      'Travel Insurance',
      'Souvenirs',
      'Local Transport'
    ]
  },
  LEISURE: {
    id: 'leisure',
    name: 'Leisure',
    subcategories: [
      'Sports',
      'Fitness',
      'Outdoor Activities',
      'Memberships',
      'Equipment'
    ]
  },

  // Technology
  TECHNOLOGY: {
    id: 'technology',
    name: 'Technology',
    subcategories: [
      'Devices',
      'Software',
      'Apps',
      'Internet',
      'Phone Bill',
      'Tech Accessories'
    ]
  },

  // Miscellaneous
  CHARITY: {
    id: 'charity',
    name: 'Charity & Donations',
    subcategories: [
      'Donations',
      'Charity Events',
      'Fundraising',
      'Volunteer Expenses'
    ]
  },
  PETS: {
    id: 'pets',
    name: 'Pets',
    subcategories: [
      'Food',
      'Vet',
      'Grooming',
      'Toys',
      'Pet Insurance',
      'Supplies'
    ]
  },
  OTHER: {
    id: 'other',
    name: 'Other',
    subcategories: [
      'Miscellaneous',
      'Uncategorized'
    ]
  }
};

// Helper function to get all categories
const getAllCategories = () => {
  return Object.values(EXPENSE_CATEGORIES).map(category => ({
    id: category.id,
    name: category.name,
    subcategories: category.subcategories
  }));
};

// Helper function to get category by ID
const getCategoryById = (categoryId) => {
  return Object.values(EXPENSE_CATEGORIES).find(
    category => category.id === categoryId
  );
};

// Helper function to validate category
const isValidCategory = (categoryId) => {
  return Object.values(EXPENSE_CATEGORIES).some(
    category => category.id === categoryId
  );
};

// Helper function to validate subcategory
const isValidSubcategory = (categoryId, subcategory) => {
  const category = getCategoryById(categoryId);
  return category && category.subcategories.includes(subcategory);
};

module.exports = {
  EXPENSE_CATEGORIES,
  getAllCategories,
  getCategoryById,
  isValidCategory,
  isValidSubcategory
}; 