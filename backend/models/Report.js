import mongoose from 'mongoose';

const ReportSchema = new mongoose.Schema({
  reportId: {
    type: String,
    required: true,
    unique: true
  },
  overallRisk: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  confidence: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  classification: {
    type: String,
    required: true,
    enum: ['Low', 'Medium', 'High', 'Critical']
  },
  summary: {
    type: String,
    required: true
  },
  inputsAnalyzed: {
    hasText: { type: Boolean, default: false },
    hasUrl: { type: Boolean, default: false },
    hasPdf: { type: Boolean, default: false },
    hasImage: { type: Boolean, default: false }
  },
  evidence: {
    matchedKeywords: { type: [String], default: [] },
    detectedUrls: [{
      url: { type: String },
      riskScore: { type: Number },
      classification: { type: String },
      reasons: { type: [String] }
    }],
    ocrText: { type: String, default: '' },
    pdfText: { type: String, default: '' },
    rawText: { type: String, default: '' }
  },
  recommendations: {
    type: [String],
    default: []
  },
  sourceFiles: [{
    fileName: { type: String },
    fileType: { type: String },
    filePath: { type: String }
  }],
  timestamp: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Report', ReportSchema);
