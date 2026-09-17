import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { errorHandler } from './middlewares/errorHandler';

import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';

const app = express();

// Security and Middleware
app.use(helmet());
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic health-check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Backend is running securely' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Global error handler should be the last middleware
app.use(errorHandler);

export default app;
