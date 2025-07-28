const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const HistorySchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fileName: String,
  date: String,
  xAxis: String,
  yAxis: String,
  chartType: String,
});

module.exports = mongoose.model('History', HistorySchema);