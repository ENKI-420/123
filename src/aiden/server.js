import express from 'express';
import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import Orchestrator from './Orchestrator.js';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import apiRoutes from './routes/api.js';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Initialize Orchestrator
const orchestrator = new Orchestrator();

// Rate limiting
const limiter = rateLimit({
windowMs: 15 * 60 * 1000, // 15 minutes
max: 100, // limit each IP to 100 requests per windowMs
message: { error: 'Too many requests, please try again later.' }
});

// Apply rate limiter to all routes
app.use(limiter);

// Middleware
app.use(cors());
app.use(express.json());

// Security middleware
app.use(helmet());
app.use(
helmet.contentSecurityPolicy({
    directives: {
        defaultSrc: ["'self'", "https:"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https:", "blob:"],
        styleSrc: ["'self'", "'unsafe-inline'", "https:"],
        imgSrc: ["'self'", "data:", "https:", "http:", "blob:"],
        connectSrc: ["'self'", "https:", "wss:", "ws:"],
        fontSrc: ["'self'", "https:", "data:"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'", "https:"],
        frameSrc: ["'self'", "https:"],
        workerSrc: ["'self'", "blob:"],
        manifestSrc: ["'self'"],
        baseUri: ["'self'"]
    },
    reportOnly: false
})
);

// API routes
// Request validation middleware
const validateChatRequest = [
body('messages').isArray().notEmpty(),
body('messages.*.role').isString().isIn(['user', 'assistant', 'system']),
body('messages.*.content').isString().notEmpty(),
body('provider').optional().isString()
];

const validateCompletionRequest = [
body('prompt').isString().notEmpty(),
body('provider').optional().isString()
];

// API endpoints
app.post('/api/chat', validateChatRequest, async (req, res, next) => {
try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
    }

    const { messages, provider } = req.body;
    const response = await orchestrator.chat({ messages, provider });
    res.json(response);
} catch (err) {
    next(err);
}
});

app.post('/api/complete', validateCompletionRequest, async (req, res, next) => {
try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
    }

    const { prompt, provider } = req.body;
    const response = await orchestrator.complete({ prompt, provider });
    res.json(response);
} catch (err) {
    next(err);
}
});

app.use('/api', apiRoutes);

// Enhanced health check endpoint
app.get('/health', async (req, res) => {
try {
    const status = await orchestrator.checkHealth();
    res.json({
    status: 'healthy',
    providers: status,
    timestamp: new Date().toISOString()
    });
} catch (err) {
    res.status(503).json({
    status: 'unhealthy',
    error: err.message,
    timestamp: new Date().toISOString()
    });
}
});
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

// Error handling middleware
app.use((err, req, res, next) => {
console.error(err.stack);

// Handle specific error types
if (err.name === 'ValidationError') {
    return res.status(400).json({
    error: 'Validation Error',
    message: err.message
    });
}

if (err.name === 'ProviderError') {
    return res.status(502).json({
    error: 'Provider Error',
    message: 'Error communicating with AI provider'
    });
}

if (err.name === 'RateLimitError') {
    return res.status(429).json({
    error: 'Rate Limit Exceeded',
    message: 'Too many requests, please try again later'
    });
}

// Default error response
res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred'
});
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});
