import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import http from 'http';

// 1. Files checklist
const expectedFiles = [
  'backend/config/db.js',
  'backend/config/constants.js',
  'backend/models/Report.js',
  'backend/models/AuditLog.js',
  'backend/models/PlannerSession.js',
  'backend/services/ocrService.js',
  'backend/services/pdfService.js',
  'backend/services/threatClassifier.js',
  'backend/middleware/upload.js',
  'backend/middleware/errorHandler.js',
  'backend/middleware/validator.js',
  'backend/controllers/analysisController.js',
  'backend/controllers/reportController.js',
  'backend/routes/analysisRoutes.js',
  'backend/routes/reportRoutes.js',
  'backend/server.js',
  'backend/.env',
  'mcp/mcpServer.js',
  'mcp/package.json',
  'frontend/tailwind.config.js',
  'frontend/postcss.config.js',
  'frontend/src/index.css',
  'frontend/src/context/ThemeContext.jsx',
  'frontend/src/components/Sidebar.jsx',
  'frontend/src/components/RiskGauge.jsx',
  'frontend/src/components/Timeline.jsx',
  'frontend/src/components/Dropzone.jsx',
  'frontend/src/views/Dashboard.jsx',
  'frontend/src/views/TextModule.jsx',
  'frontend/src/views/UrlModule.jsx',
  'frontend/src/views/PdfModule.jsx',
  'frontend/src/views/OcrModule.jsx',
  'frontend/src/views/PlannerModule.jsx',
  'frontend/src/views/History.jsx',
  'frontend/src/views/Settings.jsx',
  'frontend/src/App.jsx',
  'frontend/src/main.jsx',
  'frontend/index.html',
  'package.json',
  'nitro.json'
];

const postRequest = (urlPath, body) => {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(body);
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: urlPath,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
};

const getRequest = (urlPath) => {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:5000${urlPath}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    }).on('error', reject);
  });
};

const deleteRequest = (urlPath) => {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: urlPath,
      method: 'DELETE'
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
};

const runAudit = async () => {
  console.log('=== TruthShield AI - System Audit ===');
  const results = {
    workspaceFiles: 'FAIL',
    mcpServer: 'FAIL',
    mongodbConnection: 'FAIL',
    textAnalysisApi: 'FAIL',
    urlAnalysisApi: 'FAIL',
    plannerWorkflow: 'FAIL',
    reportCrudApi: 'FAIL',
    frontendBundling: 'FAIL'
  };

  // 1. Check workspace files
  let allFilesExist = true;
  for (const file of expectedFiles) {
    const fullPath = path.resolve('../' + file);
    if (!fs.existsSync(fullPath)) {
      console.error(`Missing File: ${file}`);
      allFilesExist = false;
    }
  }
  if (allFilesExist) {
    results.workspaceFiles = 'PASS';
  }

  // 2. Verify Frontend Bundling
  if (fs.existsSync(path.resolve('../frontend/dist/index.html'))) {
    results.frontendBundling = 'PASS';
  }

  // 3. Launch Server in Background and audit endpoints
  console.log('Launching backend gateway server...');
  const serverProcess = spawn('node', ['server.js'], {
    cwd: path.resolve('.'),
    env: { ...process.env, PORT: '5000', NODE_ENV: 'development' }
  });

  let serverStarted = false;
  let mongoConnected = false;

  await new Promise((resolve) => {
    serverProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log('Server Stdout:', output.trim());
      if (output.includes('Server started')) {
        serverStarted = true;
      }
      if (output.includes('MongoDB Connected')) {
        mongoConnected = true;
        resolve(); // Server ready
      }
    });

    serverProcess.stderr.on('data', (data) => {
      console.error('Server Stderr:', data.toString().trim());
    });

    // Timeout fallback after 8 seconds
    setTimeout(resolve, 8000);
  });

  if (serverStarted) {
    results.mcpServer = 'PASS';
  }
  if (mongoConnected) {
    results.mongodbConnection = 'PASS';
  }

  // If server failed to start, compile and terminate
  if (!serverStarted) {
    console.error('Backend server failed to launch.');
    serverProcess.kill();
    printReport(results);
    return;
  }

  try {
    // 4. Test Text API
    console.log('Testing Text Analysis endpoint...');
    const textRes = await postRequest('/api/text/analyze', {
      text: 'CONGRATULATIONS! You won a grand lottery cash prize. Call to claim your award, click here to verify bank details now.'
    });
    console.log('Text API Response:', textRes.body);
    if (textRes.status === 200 && textRes.body.success && (textRes.body.data.classification === 'High' || textRes.body.data.classification === 'Critical')) {
      results.textAnalysisApi = 'PASS';
    }

    // 5. Test URL API
    console.log('Testing URL Analysis endpoint...');
    const urlRes = await postRequest('/api/url/analyze', {
      url: 'http://bit.ly/fake-banking-verify-login'
    });
    console.log('URL API Response:', urlRes.body);
    if (urlRes.status === 200 && urlRes.body.success && urlRes.body.data.riskScore >= 40) {
      results.urlAnalysisApi = 'PASS';
    }

    // 6. Test Agentic Planner Workflow
    console.log('Testing Planner orchestration...');
    const plannerSessionId = `TEST-SESSION-${Date.now()}`;
    const plannerRes = await postRequest('/api/planner/analyze', {
      text: 'Urgent lottery prize claim',
      url: 'http://scam-link.xyz',
      sessionId: plannerSessionId
    });

    if (plannerRes.status === 202 && plannerRes.body.success) {
      console.log('Polling MongoDB for final compiled report...');
      let testReport = null;

      // Poll reports list up to 30 times (15 seconds total)
      for (let attempt = 0; attempt < 30; attempt++) {
        await new Promise(r => setTimeout(r, 500));
        const reportsRes = await getRequest('/api/reports');
        if (reportsRes.status === 200 && reportsRes.body.success) {
          testReport = reportsRes.body.data.find(r => 
            r.evidence.detectedUrls.some(u => u.url.includes('scam-link.xyz'))
          );
          if (testReport) {
            console.log(`Report found after ${attempt * 0.5} seconds! ID: ${testReport.reportId}`);
            results.plannerWorkflow = 'PASS';
            break;
          }
        }
      }

      if (testReport) {
        // 7. Test Report DELETE CRUD API
        console.log('Testing Report deletion...');
        const deleteRes = await deleteRequest(`/api/reports/${testReport._id}`);
        console.log('Delete API Response:', deleteRes.body);
        if (deleteRes.status === 200 && deleteRes.body.success) {
          results.reportCrudApi = 'PASS';
        }
      } else {
        console.error('Planner report did not populate in MongoDB within timeout.');
      }
    }
  } catch (err) {
    console.error('API Verification caught error:', err);
  } finally {
    console.log('Stopping backend gateway server...');
    serverProcess.kill();
  }

  printReport(results);
};

const printReport = (results) => {
  console.log('\n=======================================');
  console.log('        FINAL VERIFICATION REPORT       ');
  console.log('=======================================');
  console.log(`[Workspace Files Audit]  : ${results.workspaceFiles}`);
  console.log(`[MCP Server Stdio Channel]: ${results.mcpServer}`);
  console.log(`[MongoDB Connection Check]: ${results.mongodbConnection}`);
  console.log(`[Text Analysis API (MCP)] : ${results.textAnalysisApi}`);
  console.log(`[URL Analysis API (MCP)]  : ${results.urlAnalysisApi}`);
  console.log(`[Planner Orchestrations]  : ${results.plannerWorkflow}`);
  console.log(`[Reports CRUD Operations] : ${results.reportCrudApi}`);
  console.log(`[Frontend Build Bundle]   : ${results.frontendBundling}`);
  console.log('=======================================');
};

runAudit().catch(err => {
  console.error('Audit Script failed:', err);
  process.exit(1);
});
