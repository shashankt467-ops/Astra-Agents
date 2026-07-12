import mongoose from 'mongoose';

const AuditLogSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now
  },
  action: {
    type: String,
    required: true
  },
  ipAddress: {
    type: String,
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ['SUCCESS', 'FAILED']
  },
  errorDetails: {
    type: String,
    default: ''
  }
});

export default mongoose.model('AuditLog', AuditLogSchema);
