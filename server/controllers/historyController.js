const History = require('../models/History');

// @desc    Get user's analysis history
// @route   GET /api/history
// @access  Private
const getHistory = async (req, res) => {
  try {
    const history = await History.find({ userId: req.user.id })
      .sort({ createdAt: -1 }) // Sort by newest first
      .limit(100); // Limit to last 100 entries

    res.json({
      success: true,
      count: history.length,
      data: history
    });

  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ 
      success: false,
      msg: 'Server error while fetching history' 
    });
  }
};

// @desc    Add new analysis to history
// @route   POST /api/history
// @access  Private
const addHistory = async (req, res) => {
  try {
    const { fileName, date, xAxis, yAxis, chartType } = req.body;

    // Validation
    if (!fileName || !xAxis || !yAxis || !chartType) {
      return res.status(400).json({ 
        success: false,
        msg: 'Please provide all required fields' 
      });
    }

    // Validate chart type
    const validChartTypes = ['bar', 'line', 'pie', '3d-surface'];
    if (!validChartTypes.includes(chartType)) {
      return res.status(400).json({ 
        success: false,
        msg: 'Invalid chart type' 
      });
    }

    // Create new history entry
    const historyEntry = new History({
      userId: req.user.id,
      fileName: fileName.trim(),
      date: date || new Date().toLocaleString(),
      xAxis: xAxis.trim(),
      yAxis: yAxis.trim(),
      chartType
    });

    const savedHistory = await historyEntry.save();

    res.status(201).json({
      success: true,
      msg: 'Analysis saved to history',
      data: savedHistory
    });

  } catch (error) {
    console.error('Add history error:', error);
    res.status(500).json({ 
      success: false,
      msg: 'Server error while saving to history' 
    });
  }
};

// @desc    Delete history entry
// @route   DELETE /api/history/:id
// @access  Private
const deleteHistory = async (req, res) => {
  try {
    const historyEntry = await History.findById(req.params.id);

    if (!historyEntry) {
      return res.status(404).json({ 
        success: false,
        msg: 'History entry not found' 
      });
    }

    // Check if the history entry belongs to the current user
    if (historyEntry.userId.toString() !== req.user.id) {
      return res.status(403).json({ 
        success: false,
        msg: 'Not authorized to delete this entry' 
      });
    }

    await History.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      msg: 'History entry deleted successfully'
    });

  } catch (error) {
    console.error('Delete history error:', error);
    res.status(500).json({ 
      success: false,
      msg: 'Server error while deleting history entry' 
    });
  }
};

// @desc    Clear all user history
// @route   DELETE /api/history
// @access  Private
const clearHistory = async (req, res) => {
  try {
    const result = await History.deleteMany({ userId: req.user.id });

    res.json({
      success: true,
      msg: `Cleared ${result.deletedCount} history entries`
    });

  } catch (error) {
    console.error('Clear history error:', error);
    res.status(500).json({ 
      success: false,
      msg: 'Server error while clearing history' 
    });
  }
};

module.exports = {
  getHistory,
  addHistory,
  deleteHistory,
  clearHistory
};