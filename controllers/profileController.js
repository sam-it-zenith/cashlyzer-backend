const firebaseService = require('../services/firebaseService');

// Get user profile
const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.uid;
    const profile = await firebaseService.getUserProfile(userId);
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('Error getting user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving profile',
      error: error.message
    });
  }
};

// Update user profile
const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.uid;
    const updateData = req.body;

    // Validate required fields
    if (!updateData) {
      return res.status(400).json({
        success: false,
        message: 'No update data provided'
      });
    }

    // Allowed fields for update
    const allowedFields = [
      'name',
      'email',
      'phoneNumber',
      'currency',
      'language',
      'notificationPreferences',
      'theme',
      'profilePictureUrl'
    ];

    // Validate profile picture URL if provided
    if (updateData.profilePictureUrl) {
      try {
        new URL(updateData.profilePictureUrl);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid profile picture URL format'
        });
      }
    }

    // Filter out any fields that aren't allowed
    const filteredData = Object.keys(updateData)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = updateData[key];
        return obj;
      }, {});

    if (Object.keys(filteredData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    // Update profile in Firebase
    await firebaseService.updateUserProfile(userId, filteredData);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: filteredData
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
};

// Delete user profile
const deleteUserProfile = async (req, res) => {
  try {
    const userId = req.user.uid;
    
    // Delete user profile from Firebase
    await firebaseService.deleteUserProfile(userId);

    res.json({
      success: true,
      message: 'Profile deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting profile',
      error: error.message
    });
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  deleteUserProfile
}; 