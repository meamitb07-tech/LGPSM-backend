import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { errorHandler } from './middlewares/errorHandler';

import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import eventRoutes from './routes/event.routes';
import mediaRoutes from './routes/media.routes';
import { eventSessionRoutes, sessionRoutes } from './routes/session.routes';
import { eventInviteeRoutes, inviteeRoutes } from './routes/invitee.routes';
import { eventAssignmentRoutes, assignmentRoutes, myAssignmentRoutes } from './routes/systemUserAssignment.routes';

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
app.use('/api/v1/events', eventRoutes);
app.use('/api/v1/media', mediaRoutes);
app.use('/api/v1/events/:eventId/sessions', eventSessionRoutes);
app.use('/api/v1/sessions', sessionRoutes);
app.use('/api/v1/events/:eventId/invitees', eventInviteeRoutes);
app.use('/api/v1/invitees', inviteeRoutes);
app.use('/api/v1/events/:eventId/assignments', eventAssignmentRoutes);
app.use('/api/v1/assignments', assignmentRoutes);
app.use('/api/v1/users/me/assignments', myAssignmentRoutes);

// Global error handler should be the last middleware
app.use(errorHandler);

export default app;
