const express = require('express');
const { 
  getHistory, 
  addHistory, 
  deleteHistory, 
  clearHistory 
} = require('../controllers/historyController');
const { protect } = require('../middleware/auth');
const { validateHistory } = require('../middleware/validation');

const router = express.Router();

// All routes are protected
router.use(protect);

// @route   GET /api/history
// @desc    Get user's analysis history
// @access  Private
router.get('/', getHistory);

// @route   POST /api/history
// @desc    Add new analysis to history
// @access  Private
router.post('/', validateHistory, addHistory);

// @route   DELETE /api/history/:id
// @desc    Delete specific history entry
// @access  Private
router.delete('/:id', deleteHistory);

// @route   DELETE /api/history
// @desc    Clear all user history
// @access  Private
router.delete('/', clearHistory);

module.exports = router;