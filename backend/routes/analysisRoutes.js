import express from 'express';
import upload from '../middleware/upload.js';
import {
  validateTextAnalysis,
  validateUrlAnalysis
} from '../middleware/validator.js';
import {
  analyzeText,
  analyzeUrl,
  analyzePdf,
  analyzeImage,
  analyzePlanner,
  streamPlannerLogs
} from '../controllers/analysisController.js';

const router = express.Router();

// Direct Analysis Routes
router.post('/text/analyze', validateTextAnalysis, analyzeText);
router.post('/url/analyze', validateUrlAnalysis, analyzeUrl);
router.post('/pdf/analyze', upload.single('file'), analyzePdf);
router.post('/image/analyze', upload.single('file'), analyzeImage);

// Agentic Planner Trigger Route
router.post('/planner/analyze', upload.fields([
  { name: 'pdf', maxCount: 1 },
  { name: 'image', maxCount: 1 }
]), analyzePlanner);

// SSE Log Stream Route
router.get('/planner/stream', streamPlannerLogs);

export default router;
