const mongoose = require('mongoose');

const HistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  fileName: {
    type: String,
    required: [true, 'File name is required'],
    trim: true,
    maxlength: [255, 'File name cannot be more than 255 characters']
  },
  date: {
    type: String,
    default: () => new Date().toLocaleString()
  },
  xAxis: {
    type: String,
    required: [true, 'X-axis is required'],
    trim: true,
    maxlength: [100, 'X-axis name cannot be more than 100 characters']
  },
  yAxis: {
    type: String,
    required: [true, 'Y-axis is required'],
    trim: true,
    maxlength: [100, 'Y-axis name cannot be more than 100 characters']
  },
  chartType: {
    type: String,
    required: [true, 'Chart type is required'],
    enum: {
      values: ['bar', 'line', 'pie', '3d-surface'],
      message: 'Chart type must be one of: bar, line, pie, 3d-surface'
    }
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
HistorySchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('History', HistorySchema);