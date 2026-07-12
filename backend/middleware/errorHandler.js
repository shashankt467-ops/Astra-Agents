import AuditLog from '../models/AuditLog.js';

const errorHandler = async (err, req, res, next) => {
  console.error('Express Error Handler caught:', err);

  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  // Audit log entry for system errors
  try {
    await AuditLog.create({
      action: 'SYSTEM_ERROR',
      ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
      status: 'FAILED',
      errorDetails: `${err.name}: ${message}\nStack: ${err.stack || ''}`
    });
  } catch (logErr) {
    console.error('Failed to write audit log on error:', logErr.message);
  }

  res.status(status).json({
    success: false,
    error: {
      status,
      message,
      timestamp: new Date()
    }
  });
};

export default errorHandler;
