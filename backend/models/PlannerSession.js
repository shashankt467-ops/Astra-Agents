import mongoose from 'mongoose';

const PlannerSessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  steps: [{
    stepNumber: { type: Number, required: true },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  }],
  resultReportId: {
    type: String,
    default: ''
  },
  durationMs: {
    type: Number,
    default: 0
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('PlannerSession', PlannerSessionSchema);
