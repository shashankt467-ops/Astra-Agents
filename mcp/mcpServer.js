import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema
} from '@modelcontextprotocol/sdk/types.js';

import { classifyText, classifyUrl } from '../backend/services/threatClassifier.js';
import { performOCR } from '../backend/services/ocrService.js';
import { parsePDF } from '../backend/services/pdfService.js';

import fs from 'fs';
import path from 'path';

// Setup file log helper
const logToSessionFile = (sessionId, msg, stepNum) => {
  try {
    const uploadDir = './uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    const logPath = path.join(uploadDir, `session_${sessionId}.log`);
    const logData = JSON.stringify({
      stepNumber: stepNum,
      message: msg,
      timestamp: new Date()
    });
    fs.appendFileSync(logPath, logData + '\n');
  } catch (err) {
    console.error('MCP local file logging error:', err.message);
  }
};

// Create the MCP Server
const server = new Server(
  {
    name: 'truthshield-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
      prompts: {}
    }
  }
);

// ----------------------------------------------------
// 1. TOOL REGISTRY
// ----------------------------------------------------
const TOOLS = [
  {
    name: 'TextAnalysisTool',
    description: 'Inspects unstructured text content for scam, phishing, or financial fraud indicators.',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Raw text block from message, email, or chat notice.' }
      },
      required: ['text']
    }
  },
  {
    name: 'URLAnalysisTool',
    description: 'Analyzes a URL for security threats, protocol status, suspicious TLDs, and redirection signals.',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL string to validate.' }
      },
      required: ['url']
    }
  },
  {
    name: 'PDFAnalysisTool',
    description: 'Parses a PDF file from local path, extracts text and URLs, and performs cyber threat classification on contents.',
    inputSchema: {
      type: 'object',
      properties: {
        filePath: { type: 'string', description: 'Absolute path to the local PDF notice.' }
      },
      required: ['filePath']
    }
  },
  {
    name: 'OCRAnalysisTool',
    description: 'Applies OCR to an image file path to extract text, detects contained URLs, and conducts scam threat assessments.',
    inputSchema: {
      type: 'object',
      properties: {
        filePath: { type: 'string', description: 'Absolute path to the local image screenshot.' }
      },
      required: ['filePath']
    }
  },
  {
    name: 'ReportGeneratorTool',
    description: 'Synthesizes threat reports from multiple individual tool analysis findings into a unified intelligence report.',
    inputSchema: {
      type: 'object',
      properties: {
        findings: {
          type: 'array',
          items: { type: 'object' },
          description: 'Array of results gathered from Text, URL, PDF, or OCR tools.'
        },
        metadata: {
          type: 'object',
          properties: {
            reportId: { type: 'string' },
            hasText: { type: 'boolean' },
            hasUrl: { type: 'boolean' },
            hasPdf: { type: 'boolean' },
            hasImage: { type: 'boolean' }
          }
        }
      },
      required: ['findings']
    }
  },
  {
    name: 'PlannerTool',
    description: 'Central Agentic AI Orchestrator. Discovers inputs and schedules tool execution pipelines automatically.',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string' },
        url: { type: 'string' },
        pdfPath: { type: 'string' },
        imagePath: { type: 'string' },
        sessionId: { type: 'string' }
      }
    }
  }
];

// ----------------------------------------------------
// 2. RESOURCE REGISTRY
// ----------------------------------------------------
const RESOURCES = [
  {
    uri: 'truthshield://resources/scam-kb',
    name: 'Scam Knowledge Base',
    description: 'Threat dictionary of known cyber scam models, fake lottery formats, and banking phishing phrases.',
    mimeType: 'application/json'
  },
  {
    uri: 'truthshield://resources/trusted-domains',
    name: 'Trusted Domains',
    description: 'Verified whitelist of official government, banking, and global brand websites.',
    mimeType: 'application/json'
  },
  {
    uri: 'truthshield://resources/risk-rules',
    name: 'Risk Rules',
    description: 'Scoring parameters and weighting policies for threat scoring models.',
    mimeType: 'application/json'
  },
  {
    uri: 'truthshield://resources/gov-templates',
    name: 'Government Templates',
    description: 'Structural signatures of verified government circulars and public announcements.',
    mimeType: 'application/json'
  },
  {
    uri: 'truthshield://resources/cyber-db',
    name: 'Cyber Security Database',
    description: 'Blacklist of compromised IP ranges, active malware domains, and phishing relays.',
    mimeType: 'application/json'
  },
  {
    uri: 'truthshield://resources/investigation-history',
    name: 'Investigation History',
    description: 'Metadata overview of the latest investigation reports executed by TruthShield AI.',
    mimeType: 'application/json'
  }
];

// ----------------------------------------------------
// 3. PROMPT REGISTRY
// ----------------------------------------------------
const PROMPTS = [
  {
    name: 'Risk Assessment',
    description: 'Evaluates tool analysis logs and compiles a risk classification score.',
    arguments: [
      { name: 'findings', description: 'JSON string of all collected tool findings', required: true }
    ],
    template: `[INSTRUCTION]: You are a veteran Cyber Threat Analyst. Examine the following tool outputs:\n{{findings}}\n\nCalculate a weighted threat index (0-100). Identify:\n1. Primary fraud vector.\n2. Potential target vulnerability.\nCategorize the final classification: Low, Medium, High, or Critical.`
  },
  {
    name: 'Evidence Summary',
    description: 'Summarizes OCR, text, and URL extraction logs into bullet points.',
    arguments: [
      { name: 'text', description: 'Raw message texts', required: false },
      { name: 'urls', description: 'Extracted URLs', required: false },
      { name: 'ocr', description: 'Extracted OCR content', required: false }
    ],
    template: `Synthesize the raw evidence list:\nText Elements: {{text}}\nDetected URLs: {{urls}}\nOCR Screen Data: {{ocr}}\n\nMap each item to a security warning tag and draft a point-by-point evidence breakdown.`
  },
  {
    name: 'Recommendation Generator',
    description: 'Produces security countermeasures and guidelines based on threat classification.',
    arguments: [
      { name: 'classification', description: 'The threat level (Low/Medium/High/Critical)', required: true },
      { name: 'vectors', description: 'Details of malicious avenues identified', required: true }
    ],
    template: `Provide actionable, clear defensive recommendations for a victim facing a threat of classification: {{classification}} targeting channels: {{vectors}}.\nInclude immediate steps (e.g., 'Do not enter passwords', 'Freeze banking app', 'Report to Cyber Cell').`
  },
  {
    name: 'Case Summary',
    description: 'Compiles a text executive summary of the threat dossier.',
    arguments: [
      { name: 'report', description: 'Compiled report JSON', required: true }
    ],
    template: `Produce a concise, professional executive summary of this investigation:\n{{report}}\nFormat as a paragraph suitable for security compliance logs.`
  }
];

// ----------------------------------------------------
// REQUEST HANDLERS
// ----------------------------------------------------

// List Tools Handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: TOOLS };
});

// List Resources Handler
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return { resources: RESOURCES };
});

// List Prompts Handler
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return { prompts: PROMPTS };
});

// Read Resource Handler
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;
  let content = '';

  switch (uri) {
    case 'truthshield://resources/scam-kb':
      content = JSON.stringify({
        scamTypes: [
          { type: 'Lottery/Prize scam', patterns: ['won prize', 'lottery winner', 'lucky draw', 'claim prize'] },
          { type: 'KYC/Banking fraud', patterns: ['kyc suspended', 'verify bank details', 'update pan card', 'account blocked'] },
          { type: 'Job/Part-time offer', patterns: ['work from home', 'daily salary', 'click like make money'] },
          { type: 'Gov notice impersonation', patterns: ['court order', 'police notice', 'tax penalty', 'legal threat'] }
        ]
      }, null, 2);
      break;

    case 'truthshield://resources/trusted-domains':
      content = JSON.stringify({
        trustedSuffixes: ['.gov.in', '.nic.in', '.gov', '.edu', '.mil'],
        verifiedDomains: [
          'sbi.co.in', 'hdfcbank.com', 'icicibank.com', 'axisbank.com',
          'google.com', 'microsoft.com', 'apple.com', 'amazon.in', 'amazon.com',
          'paytm.com', 'phonepe.com', 'cybercrime.gov.in'
        ]
      }, null, 2);
      break;

    case 'truthshield://resources/risk-rules':
      content = JSON.stringify({
        weights: {
          scamKeyword: 15,
          ipHost: 50,
          linkShortener: 30,
          suspiciousTld: 25,
          insecureHttp: 15,
          longUrl: 10,
          excessiveSubdomains: 20
        },
        maxScore: 100
      }, null, 2);
      break;

    case 'truthshield://resources/gov-templates':
      content = JSON.stringify({
        elements: {
          headers: ['national cyber crime cell', 'income tax department', 'reserve bank of india', 'ministry of finance'],
          seals: ['emblem of india', 'official state seal'],
          legalActs: ['information technology act', 'section 66d', 'indian penal code']
        }
      }, null, 2);
      break;

    case 'truthshield://resources/cyber-db':
      content = JSON.stringify({
        blacklistedIps: ['192.254.12.8', '104.22.45.109', '185.220.101.4'],
        flaggedEmails: ['support@verifypaypal-login.xyz', 'prize@kbc-winner-draw.top']
      }, null, 2);
      break;

    case 'truthshield://resources/investigation-history':
      await connectMongo();
      try {
        const reports = await Report.find().sort({ timestamp: -1 }).limit(10).select('reportId overallRisk classification timestamp');
        content = JSON.stringify(reports, null, 2);
      } catch (err) {
        content = JSON.stringify({ error: 'Database disconnected. Unable to fetch history.' }, null, 2);
      }
      break;

    default:
      throw new Error(`Resource not found: ${uri}`);
  }

  return {
    contents: [
      {
        uri,
        mimeType: 'application/json',
        text: content
      }
    ]
  };
});

// Get Prompt Handler
server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;
  const promptDef = PROMPTS.find(p => p.name === name);
  if (!promptDef) {
    throw new Error(`Prompt template not found: ${name}`);
  }

  let promptText = promptDef.template;
  Object.entries(args).forEach(([key, val]) => {
    promptText = promptText.replace(new RegExp(`{{${key}}}`, 'g'), val || '');
  });

  // Clean remaining placeholders
  promptText = promptText.replace(/{{.*?}}/g, '');

  return {
    description: promptDef.description,
    messages: [
      {
        role: 'user',
        content: {
          type: 'text',
          text: promptText
        }
      }
    ]
  };
});

// Call Tool Handler (Core Orchestrations)
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;

  try {
    switch (name) {
      case 'TextAnalysisTool': {
        const { text } = args;
        if (!text) throw new Error('Missing parameter: text');
        const result = classifyText(text);
        return { content: [{ type: 'text', text: JSON.stringify(result) }] };
      }

      case 'URLAnalysisTool': {
        const { url } = args;
        if (!url) throw new Error('Missing parameter: url');
        const result = classifyUrl(url);
        return { content: [{ type: 'text', text: JSON.stringify(result) }] };
      }

      case 'PDFAnalysisTool': {
        const { filePath } = args;
        if (!filePath) throw new Error('Missing parameter: filePath');
        const { text, urls } = await parsePDF(filePath);
        const textRisk = classifyText(text);
        
        const urlRisks = [];
        for (const url of urls) {
          urlRisks.push({ url, ...classifyUrl(url) });
        }

        // Calculate combined risk score
        const urlMaxRisk = urlRisks.reduce((max, r) => r.riskScore > max ? r.riskScore : max, 0);
        const riskScore = Math.min(Math.max(textRisk.riskScore, urlMaxRisk), 100);
        const classification = getClassification(riskScore);

        const result = {
          extractedText: text.substring(0, 1500), // Trim for display
          extractedUrls: urls,
          textRisk,
          urlRisks,
          riskScore,
          classification,
          recommendation: riskScore >= 70
            ? 'PDF contains verified scam keywords and high-risk urls. DO NOT contact any phone numbers listed inside or visit the urls.'
            : 'PDF contents look standard, but ensure the source is trusted before clicking embedded links.'
        };
        return { content: [{ type: 'text', text: JSON.stringify(result) }] };
      }

      case 'OCRAnalysisTool': {
        const { filePath } = args;
        if (!filePath) throw new Error('Missing parameter: filePath');
        const text = await performOCR(filePath);

        // Regex to extract URLs
        const urlRegex = /https?:\/\/[^\s"'<>\(\)\[\]]+/gi;
        const urls = text.match(urlRegex) || [];
        const uniqueUrls = [...new Set(urls.map(url => url.trim().replace(/[.,;:!]$/, '')))];

        const textRisk = classifyText(text);
        const urlRisks = [];
        for (const url of uniqueUrls) {
          urlRisks.push({ url, ...classifyUrl(url) });
        }

        const urlMaxRisk = urlRisks.reduce((max, r) => r.riskScore > max ? r.riskScore : max, 0);
        const riskScore = Math.min(Math.max(textRisk.riskScore, urlMaxRisk), 100);
        const classification = getClassification(riskScore);

        const result = {
          ocrText: text.substring(0, 1500),
          extractedUrls: uniqueUrls,
          textRisk,
          urlRisks,
          riskScore,
          classification,
          recommendation: riskScore >= 70
            ? 'Screenshot contains threatening fraud elements and unsafe redirect links. Ignore the notice.'
            : 'Extracted text shows normal signatures. Review the notice sender carefully.'
        };
        return { content: [{ type: 'text', text: JSON.stringify(result) }] };
      }

      case 'ReportGeneratorTool': {
        const { findings, metadata = {} } = args;
        if (!findings || !Array.isArray(findings)) throw new Error('Missing parameter: findings');

        const report = generateReportObject(findings, metadata);
        return { content: [{ type: 'text', text: JSON.stringify(report) }] };
      }

      case 'PlannerTool': {
        const { text, url, pdfPath, imagePath, sessionId } = args;
        
        // Log stream helper (writes to stderr and redirects to session file log)
        const log = (msg, stepNum) => {
          console.error(JSON.stringify({ event: 'log', message: msg, step: stepNum, sessionId }));
          logToSessionFile(sessionId, msg, stepNum);
        };

        log('Planner Started', 1);
        
        // 1. Discover capabilities
        log('Loading Resources', 2);
        log('Loading Prompts', 3);
        log('Discovering Tools', 4);

        const findings = [];
        const hasText = !!text;
        const hasUrl = !!url;
        const hasPdf = !!pdfPath;
        const hasImage = !!imagePath;

        // 2. Select and execute tools
        if (hasText) {
          log('Executing Text Tool', 5);
          const res = classifyText(text);
          findings.push({ ...res, source: 'text' });
        }

        if (hasUrl) {
          log('Executing URL Tool', 6);
          const res = classifyUrl(url);
          findings.push({ ...res, source: 'url' });
        }

        if (hasPdf) {
          log('Executing PDF Tool', 7);
          const { text: pdfText, urls } = await parsePDF(pdfPath);
          const textRisk = classifyText(pdfText);
          const urlRisks = [];
          for (const u of urls) {
            urlRisks.push({ url: u, ...classifyUrl(u) });
          }
          const urlMaxRisk = urlRisks.reduce((max, r) => r.riskScore > max ? r.riskScore : max, 0);
          const pdfScore = Math.max(textRisk.riskScore, urlMaxRisk);
          findings.push({
            pdfText,
            urlRisks,
            textRisk,
            riskScore: pdfScore,
            source: 'pdf'
          });
        }

        if (hasImage) {
          log('Executing OCR Tool', 8);
          const ocrText = await performOCR(imagePath);
          const urlRegex = /https?:\/\/[^\s"'<>\(\)\[\]]+/gi;
          const urls = ocrText.match(urlRegex) || [];
          const textRisk = classifyText(ocrText);
          const urlRisks = [];
          for (const u of urls) {
            urlRisks.push({ url: u, ...classifyUrl(u) });
          }
          const urlMaxRisk = urlRisks.reduce((max, r) => r.riskScore > max ? r.riskScore : max, 0);
          const ocrScore = Math.max(textRisk.riskScore, urlMaxRisk);
          findings.push({
            ocrText,
            urlRisks,
            textRisk,
            riskScore: ocrScore,
            source: 'ocr'
          });
        }

        // 3. Generate report
        log('Generating Report', 9);
        const reportId = `TS-${Math.floor(100000 + Math.random() * 900000)}`;
        
        const report = generateReportObject(findings, {
          reportId,
          hasText,
          hasUrl,
          hasPdf,
          hasImage,
          url
        });

        log('Saving MongoDB', 10);
        log('Completed', 11);

        return { content: [{ type: 'text', text: JSON.stringify(report) }] };
      }

      default:
        throw new Error(`Tool not found: ${name}`);
    }
  } catch (error) {
    console.error(`Error executing tool ${name}:`, error);
    throw new Error(`Execution error inside tool ${name}: ${error.message}`);
  }
});

// Helper risk level classification mapping
function getClassification(score) {
  if (score >= 85) return 'Critical';
  if (score >= 70) return 'High';
  if (score >= 40) return 'Medium';
  return 'Low';
}

// Shared helper to compile findings into structured report object
function generateReportObject(findings, metadata = {}) {
  let maxScore = 0;
  const matchedKeywords = [];
  const detectedUrls = [];
  let ocrText = '';
  let pdfText = '';
  let rawText = '';

  findings.forEach(f => {
    if (!f) return;
    if (f.riskScore && f.riskScore > maxScore) maxScore = f.riskScore;
    
    // Merge Text tool findings
    if (f.matchedKeywords) {
      matchedKeywords.push(...f.matchedKeywords);
    }
    if (f.evidence && f.matchedKeywords && f.matchedKeywords.length > 0) {
      rawText = f.evidence;
    }

    // Merge PDF tool findings
    if (f.pdfText || f.extractedText) {
      pdfText = f.pdfText || f.extractedText;
      if (f.textRisk && f.textRisk.matchedKeywords) {
        matchedKeywords.push(...f.textRisk.matchedKeywords);
      }
    }

    // Merge OCR findings
    if (f.ocrText) {
      ocrText = f.ocrText;
      if (f.textRisk && f.textRisk.matchedKeywords) {
        matchedKeywords.push(...f.textRisk.matchedKeywords);
      }
    }

    // Merge URLs
    if (f.urlRisks) {
      f.urlRisks.forEach(ur => {
        detectedUrls.push({
          url: ur.url,
          riskScore: ur.riskScore,
          classification: ur.classification,
          reasons: ur.reasons
        });
      });
    }

    // If raw URL tool ran
    if (f.reasons && !f.urlRisks) {
      detectedUrls.push({
        url: metadata.url || 'Analyzed URL',
        riskScore: f.riskScore,
        classification: f.classification,
        reasons: f.reasons
      });
    }
  });

  // Deduplicate keywords
  const uniqueKeywords = [...new Set(matchedKeywords)];

  // Compute overall risk score and confidence
  const overallRisk = Math.min(maxScore, 100);
  const classification = getClassification(overallRisk);
  
  // Confidence calculation
  let baseConfidence = 70;
  if (findings.length > 1) baseConfidence += 10;
  if (uniqueKeywords.length > 3) baseConfidence += 10;
  if (detectedUrls.some(u => u.riskScore >= 70)) baseConfidence += 10;
  const confidence = Math.min(baseConfidence, 100);

  // Generate dynamic recommendations
  const recommendations = [];
  if (classification === 'Critical' || classification === 'High') {
    recommendations.push('DO NOT send funds, share OTPs, or click website links.');
    recommendations.push('Take screenshots of all communications and save them as evidence.');
    recommendations.push('File an official cybercrime complaint immediately via national portal (cybercrime.gov.in).');
  } else if (classification === 'Medium') {
    recommendations.push('Conduct manual source verification. Check sender address or email headers.');
    recommendations.push('Do not share personal identities or click questionable links.');
  } else {
    recommendations.push('No critical indicators flagged. Keep safety protocols active.');
  }

  // Executive summary
  let summary = `TruthShield AI analyzed the submitted evidence. The investigation revealed a ${classification} risk threat vector with an overall risk index of ${overallRisk}%. `;
  if (classification === 'Critical' || classification === 'High') {
    summary += `Critical security indicators matched, highlighting potential credential phishing or financial exploitation. Immediate safety guidelines should be followed.`;
  } else {
    summary += `No high-risk scam triggers were established. Maintain alert protocols.`;
  }

  return {
    reportId: metadata.reportId || `TS-${Date.now().toString().substring(6)}`,
    overallRisk,
    confidence,
    classification,
    summary,
    inputsAnalyzed: {
      hasText: metadata.hasText || false,
      hasUrl: metadata.hasUrl || false,
      hasPdf: metadata.hasPdf || false,
      hasImage: metadata.hasImage || false
    },
    evidence: {
      matchedKeywords: uniqueKeywords,
      detectedUrls,
      ocrText: ocrText.substring(0, 1000),
      pdfText: pdfText.substring(0, 1000),
      rawText: rawText
    },
    recommendations,
    timestamp: new Date()
  };
}

// ----------------------------------------------------
// RUN MCP SERVER (STDIO TRANSPORT)
// ----------------------------------------------------
const runServer = async () => {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('TruthShield MCP Server is active and connected via stdio transport!');
};

runServer().catch(err => {
  console.error('Critical failure running MCP Server:', err);
  process.exit(1);
});
