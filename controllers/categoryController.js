const { getAllCategories, getCategoryById, isValidCategory, isValidSubcategory } = require('../constants/categories');

// Get all expense categories
exports.getCategories = async (req, res) => {
  try {
    const categories = getAllCategories();
    res.json({
      message: 'Categories retrieved successfully',
      categories
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      error: 'Failed to fetch categories',
      message: error.message
    });
  }
};

// Get category by ID
exports.getCategoryById = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const category = getCategoryById(categoryId);

    if (!category) {
      return res.status(404).json({
        error: 'Category not found',
        message: 'The specified category does not exist'
      });
    }

    res.json({
      message: 'Category retrieved successfully',
      category
    });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({
      error: 'Failed to fetch category',
      message: error.message
    });
  }
};

// Validate category and subcategory
exports.validateCategory = async (req, res) => {
  try {
    const { categoryId, subcategory } = req.body;

    if (!categoryId) {
      return res.status(400).json({
        error: 'Missing category ID',
        message: 'Please provide a category ID'
      });
    }

    const isValid = isValidCategory(categoryId);
    const isValidSub = subcategory ? isValidSubcategory(categoryId, subcategory) : true;

    res.json({
      message: 'Category validation completed',
      isValid,
      isValidSubcategory: isValidSub
    });
  } catch (error) {
    console.error('Validate category error:', error);
    res.status(500).json({
      error: 'Failed to validate category',
      message: error.message
    });
  }
}; 