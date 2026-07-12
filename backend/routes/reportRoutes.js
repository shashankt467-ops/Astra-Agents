import express from 'express';
import {
  getReports,
  getReportById,
  deleteReport
} from '../controllers/reportController.js';

const router = express.Router();

// MongoDB Report CRUD Routes
router.get('/', getReports);
router.get('/:id', getReportById);
router.delete('/:id', deleteReport);

export default router;
