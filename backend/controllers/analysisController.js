import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { CallToolResultSchema } from '@modelcontextprotocol/sdk/types.js';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import Report from '../models/Report.js';
import PlannerSession from '../models/PlannerSession.js';
import AuditLog from '../models/AuditLog.js';

// Helper to resolve the MCP Server script path
const getMcpServerPath = () => {
  return path.resolve('../mcp/mcpServer.js');
};

/**
 * Spawns an MCP Server instance and runs a single tool.
 * @param {string} toolName - Name of the MCP tool.
 * @param {object} toolArgs - Arguments to pass to the tool.
 * @returns {Promise<any>} - Decoded JSON response.
 */
const runMcpTool = async (toolName, toolArgs) => {
  const mcpPath = getMcpServerPath();
  const transport = new StdioClientTransport({
    command: 'node',
    args: [mcpPath],
    env: {
      ...process.env,
      MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/truthshield'
    }
  });

  const client = new Client(
    { name: 'truthshield-express-gateway', version: '1.0.0' },
    { capabilities: {} }
  );

  await client.connect(transport);

  try {
    const result = await client.request({
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: toolArgs
      }
    }, CallToolResultSchema);

    await transport.close();
    return JSON.parse(result.content[0].text);
  } catch (error) {
    await transport.close();
    throw error;
  }
};

/**
 * POST /api/text/analyze
 */
export const analyzeText = async (req, res, next) => {
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
  try {
    const { text } = req.body;
    const findings = await runMcpTool('TextAnalysisTool', { text });

    await AuditLog.create({
      action: 'ANALYZE_TEXT',
      ipAddress,
      status: 'SUCCESS'
    });

    res.status(200).json({
      success: true,
      data: findings
    });
  } catch (error) {
    await AuditLog.create({
      action: 'ANALYZE_TEXT_ERROR',
      ipAddress,
      status: 'FAILED',
      errorDetails: error.message
    });
    next(error);
  }
};

/**
 * POST /api/url/analyze
 */
export const analyzeUrl = async (req, res, next) => {
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
  try {
    const { url } = req.body;
    const findings = await runMcpTool('URLAnalysisTool', { url });

    await AuditLog.create({
      action: 'ANALYZE_URL',
      ipAddress,
      status: 'SUCCESS'
    });

    res.status(200).json({
      success: true,
      data: findings
    });
  } catch (error) {
    await AuditLog.create({
      action: 'ANALYZE_URL_ERROR',
      ipAddress,
      status: 'FAILED',
      errorDetails: error.message
    });
    next(error);
  }
};

/**
 * POST /api/pdf/analyze
 */
export const analyzePdf = async (req, res, next) => {
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
  if (!req.file) {
    return res.status(400).json({ success: false, error: { message: 'PDF file upload is required.' } });
  }

  const filePath = path.resolve(req.file.path);
  try {
    const findings = await runMcpTool('PDFAnalysisTool', { filePath });

    // Clean upload file
    fs.unlink(filePath, (err) => {
      if (err) console.error('Failed to unlink PDF file:', err.message);
    });

    await AuditLog.create({
      action: 'ANALYZE_PDF',
      ipAddress,
      status: 'SUCCESS'
    });

    res.status(200).json({
      success: true,
      data: findings
    });
  } catch (error) {
    fs.unlink(filePath, () => {});
    await AuditLog.create({
      action: 'ANALYZE_PDF_ERROR',
      ipAddress,
      status: 'FAILED',
      errorDetails: error.message
    });
    next(error);
  }
};

/**
 * POST /api/image/analyze
 */
export const analyzeImage = async (req, res, next) => {
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
  if (!req.file) {
    return res.status(400).json({ success: false, error: { message: 'Image file upload is required.' } });
  }

  const filePath = path.resolve(req.file.path);
  try {
    const findings = await runMcpTool('OCRAnalysisTool', { filePath });

    // Clean upload file
    fs.unlink(filePath, (err) => {
      if (err) console.error('Failed to unlink OCR image file:', err.message);
    });

    await AuditLog.create({
      action: 'ANALYZE_IMAGE',
      ipAddress,
      status: 'SUCCESS'
    });

    res.status(200).json({
      success: true,
      data: findings
    });
  } catch (error) {
    fs.unlink(filePath, () => {});
    await AuditLog.create({
      action: 'ANALYZE_IMAGE_ERROR',
      ipAddress,
      status: 'FAILED',
      errorDetails: error.message
    });
    next(error);
  }
};

/**
 * POST /api/planner/analyze
 * Accepts multiple inputs, creates a session, starts background Planner, and returns immediately.
 */
export const analyzePlanner = async (req, res, next) => {
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
  try {
    const { text, url, sessionId = uuidv4() } = req.body;
    let pdfPath = '';
    let imagePath = '';

    // Handle files if uploaded
    if (req.files) {
      if (req.files.pdf && req.files.pdf[0]) {
        pdfPath = path.resolve(req.files.pdf[0].path);
      }
      if (req.files.image && req.files.image[0]) {
        imagePath = path.resolve(req.files.image[0].path);
      }
    }

    // Initialize the planner session in MongoDB
    await PlannerSession.create({
      sessionId,
      steps: []
    });

    // Start background processing so client can stream log events
    runMcpPlanner({ text, url, pdfPath, imagePath, sessionId, ipAddress });

    res.status(202).json({
      success: true,
      message: 'Agentic Planner initiated successfully.',
      sessionId
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Background processor for MCP Planner. Executes planner tool and saves final report.
 */
const runMcpPlanner = async ({ text, url, pdfPath, imagePath, sessionId, ipAddress }) => {
  const startTime = Date.now();
  try {
    const report = await runMcpTool('PlannerTool', {
      text,
      url,
      pdfPath,
      imagePath,
      sessionId
    });

    // Append file information if available
    const sourceFiles = [];
    if (pdfPath) {
      sourceFiles.push({
        fileName: path.basename(pdfPath),
        fileType: 'PDF',
        filePath: pdfPath
      });
    }
    if (imagePath) {
      sourceFiles.push({
        fileName: path.basename(imagePath),
        fileType: 'IMAGE',
        filePath: imagePath
      });
    }

    // Save final report to MongoDB
    const reportDoc = await Report.create({
      ...report,
      sourceFiles
    });

    // Update session duration and link the report
    const durationMs = Date.now() - startTime;
    await PlannerSession.updateOne(
      { sessionId },
      { 
        resultReportId: reportDoc.reportId,
        durationMs
      }
    );

    // Audit log
    await AuditLog.create({
      action: 'PLANNER_COMPLETE',
      ipAddress,
      status: 'SUCCESS',
      errorDetails: `Session: ${sessionId}, Report: ${reportDoc.reportId}`
    });

  } catch (error) {
    console.error(`Planner background error for session ${sessionId}:`, error);
    
    // Save error state step inside PlannerSession
    try {
      await PlannerSession.updateOne(
        { sessionId },
        {
          $push: {
            steps: {
              stepNumber: 99,
              message: `Error: ${error.message}`,
              timestamp: new Date()
            }
          }
        }
      );
      
      await AuditLog.create({
        action: 'PLANNER_FAILED',
        ipAddress,
        status: 'FAILED',
        errorDetails: `Session ${sessionId} failed: ${error.message}`
      });
    } catch (dbErr) {
      console.error('Failed to log planner failure to DB:', dbErr.message);
    }
  } finally {
    // Delete files from disk after planning completes
    if (pdfPath && fs.existsSync(pdfPath)) {
      fs.unlink(pdfPath, () => {});
    }
    if (imagePath && fs.existsSync(imagePath)) {
      fs.unlink(imagePath, () => {});
    }
  }
};

/**
 * GET /api/planner/stream
 * Streams execution logs of a given planner session using Server-Sent Events (SSE).
 */
export const streamPlannerLogs = async (req, res) => {
  const { sessionId } = req.query;

  if (!sessionId) {
    return res.status(400).json({ success: false, error: { message: 'Missing parameter: sessionId' } });
  }

  // Set SSE Headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  // Send initial spacer connection event
  res.write(': connected\n\n');

  const logFilePath = path.join('./uploads', `session_${sessionId}.log`);
  let lastIndex = 0;
  
  // Set up polling interval to check local file for new steps
  const pollInterval = setInterval(async () => {
    try {
      let steps = [];

      // Read steps from local log file if it exists
      if (fs.existsSync(logFilePath)) {
        const fileContent = fs.readFileSync(logFilePath, 'utf8').trim();
        if (fileContent) {
          const lines = fileContent.split('\n');
          steps = lines.map(line => JSON.parse(line));
        }
      }

      if (steps.length > lastIndex) {
        for (let i = lastIndex; i < steps.length; i++) {
          const step = steps[i];
          
          // Write step to SSE
          res.write(`event: log\ndata: ${JSON.stringify(step)}\n\n`);
          
          // Sync step to MongoDB PlannerSession
          try {
            await PlannerSession.findOneAndUpdate(
              { sessionId },
              { $push: { steps: step } },
              { upsert: true, new: true }
            );
          } catch (dbErr) {
            console.error('Failed to sync log step to MongoDB:', dbErr.message);
          }
        }
        lastIndex = steps.length;
      }

      // Check if session contains failure step
      const hasFailed = steps.some(s => s.stepNumber === 99 || s.message.startsWith('Error:'));
      if (hasFailed) {
        res.write(`event: error\ndata: ${JSON.stringify({ message: 'Planner execution encountered a critical error.' })}\n\n`);
        clearInterval(pollInterval);
        cleanupLogFile(logFilePath);
        res.end();
        return;
      }

      // Check if complete and report is saved
      const session = await PlannerSession.findOne({ sessionId });
      if (session && session.resultReportId) {
        const report = await Report.findOne({ reportId: session.resultReportId });
        if (report) {
          res.write(`event: result\ndata: ${JSON.stringify(report)}\n\n`);
          clearInterval(pollInterval);
          cleanupLogFile(logFilePath);
          res.end();
        }
      }
    } catch (err) {
      console.error('SSE polling error:', err.message);
      res.write(`event: error\ndata: ${JSON.stringify({ message: 'Internal polling failure.' })}\n\n`);
      clearInterval(pollInterval);
      cleanupLogFile(logFilePath);
      res.end();
    }
  }, 400);

  // Close hook
  req.on('close', () => {
    clearInterval(pollInterval);
  });
};

// Helper to cleanup temporary file
const cleanupLogFile = (filePath) => {
  if (fs.existsSync(filePath)) {
    fs.unlink(filePath, () => {});
  }
};
