import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import rateLimit from 'express-rate-limit';

import connectDB from './config/db.js';
import analysisRoutes from './routes/analysisRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import errorHandler from './middleware/errorHandler.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Global Security Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Turn off for simpler setup in hackathons
  crossOriginEmbedderPolicy: false
}));

// CORS Configuration
const allowedOrigin = process.env.CORS_ORIGIN || '*';
app.use(cors({
  origin: allowedOrigin === '*' ? true : allowedOrigin,
  credentials: true
}));

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate Limiting to prevent brute-force attacks
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 150, // limit each IP to 150 requests per window
  message: {
    success: false,
    error: { message: 'Too many requests from this IP. Please try again in 15 minutes.' }
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip SSE endpoint from strict rate limits to avoid interruption
  skip: (req) => req.path === '/api/planner/stream'
});
app.use('/api/', limiter);

// API Routing Gateway
app.use('/api', analysisRoutes);
app.use('/api/reports', reportRoutes);

// Host compiled Frontend React Assets in production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.resolve(__dirname, '../frontend/dist');
  app.use(express.static(distPath));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  // Simple health check in development
  app.get('/', (req, res) => {
    res.status(200).json({ status: 'healthy', service: 'TruthShield AI Backend Gateway' });
  });
}

// Global Error Handler Middleware
app.use(errorHandler);

// Listen
app.listen(PORT, () => {
  console.log(`Server started in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
