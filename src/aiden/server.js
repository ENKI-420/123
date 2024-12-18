import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
res.status(200).json({ status: 'healthy' });
});

// Error handling middleware
app.use((err, req, res, next) => {
console.error(err.stack);
res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
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

