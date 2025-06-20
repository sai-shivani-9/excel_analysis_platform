
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/excel-analytics';

export const db = {
  async connect() {
    try {
      await mongoose.connect(MONGODB_URI);
      console.log('Connected to MongoDB');
    } catch (error) {
      console.error('MongoDB connection error:', error);
      process.exit(1);
    }
  }
};

// Chart Schema
const chartSchema = new mongoose.Schema({
  userId: String,
  name: String,
  data: Object,
  settings: Object,
  shared: [String],
  createdAt: { type: Date, default: Date.now },
});

export const Chart = mongoose.model('Chart', chartSchema);
