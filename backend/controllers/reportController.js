import Report from '../models/Report.js';
import AuditLog from '../models/AuditLog.js';

/**
 * GET /api/reports
 * Fetches all reports, supporting text queries and classification filtering.
 */
export const getReports = async (req, res, next) => {
  try {
    const { query, classification } = req.query;
    const filter = {};

    if (classification) {
      filter.classification = classification;
    }

    if (query) {
      filter.$or = [
        { reportId: { $regex: query, $options: 'i' } },
        { summary: { $regex: query, $options: 'i' } },
        { 'evidence.rawText': { $regex: query, $options: 'i' } },
        { 'evidence.pdfText': { $regex: query, $options: 'i' } },
        { 'evidence.ocrText': { $regex: query, $options: 'i' } }
      ];
    }

    const reports = await Report.find(filter).sort({ timestamp: -1 });

    res.status(200).json({
      success: true,
      count: reports.length,
      data: reports
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/reports/:id
 * Fetches a single report by Mongoose ObjectId or ReportId.
 */
export const getReportById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if ID is a valid Mongoose ObjectId, otherwise search by reportId
    const query = id.match(/^[0-9a-fA-F]{24}$/) 
      ? { _id: id } 
      : { reportId: id };

    const report = await Report.findOne(query);
    if (!report) {
      return res.status(404).json({
        success: false,
        error: { message: `Report with ID ${id} not found.` }
      });
    }

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/reports/:id
 * Deletes a report by Mongoose ObjectId or ReportId.
 */
export const deleteReport = async (req, res, next) => {
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
  try {
    const { id } = req.params;
    
    const query = id.match(/^[0-9a-fA-F]{24}$/) 
      ? { _id: id } 
      : { reportId: id };

    const report = await Report.findOneAndDelete(query);
    if (!report) {
      await AuditLog.create({
        action: 'DELETE_REPORT_NOT_FOUND',
        ipAddress,
        status: 'FAILED',
        errorDetails: `Attempted to delete non-existent report ID: ${id}`
      });

      return res.status(404).json({
        success: false,
        error: { message: `Report with ID ${id} not found.` }
      });
    }

    // Success audit logging
    await AuditLog.create({
      action: 'DELETE_REPORT',
      ipAddress,
      status: 'SUCCESS',
      errorDetails: `Successfully deleted report: ${report.reportId}`
    });

    res.status(200).json({
      success: true,
      message: `Report ${report.reportId} successfully deleted.`,
      deletedId: report._id
    });
  } catch (error) {
    next(error);
  }
};
