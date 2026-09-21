"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const env_1 = require("./config/env");
const errorHandler_1 = require("./middlewares/errorHandler");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const event_routes_1 = __importDefault(require("./routes/event.routes"));
const media_routes_1 = __importDefault(require("./routes/media.routes"));
const session_routes_1 = require("./routes/session.routes");
const invitee_routes_1 = require("./routes/invitee.routes");
const invitation_routes_1 = __importDefault(require("./routes/invitation.routes"));
const publicInvitation_routes_1 = __importDefault(require("./routes/publicInvitation.routes"));
const systemUserAssignment_routes_1 = require("./routes/systemUserAssignment.routes");
const app = (0, express_1.default)();
// Security and Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: env_1.env.FRONTEND_URL,
    credentials: true
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Basic health-check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Backend is running securely' });
});
// API Routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/users', user_routes_1.default);
app.use('/api/v1/events', event_routes_1.default);
app.use('/api/v1/media', media_routes_1.default);
app.use('/api/v1/events/:eventId/sessions', session_routes_1.eventSessionRoutes);
app.use('/api/v1/sessions', session_routes_1.sessionRoutes);
app.use('/api/v1/events/:eventId/invitees', invitee_routes_1.eventInviteeRoutes);
app.use('/api/v1/invitees', invitee_routes_1.inviteeRoutes);
app.use('/api/v1/events/:eventId/assignments', systemUserAssignment_routes_1.eventAssignmentRoutes);
app.use('/api/v1/events/:eventId/invitations', invitation_routes_1.default);
app.use('/api/v1/public/invitations', publicInvitation_routes_1.default);
app.use('/api/v1/assignments', systemUserAssignment_routes_1.assignmentRoutes);
app.use('/api/v1/users/me/assignments', systemUserAssignment_routes_1.myAssignmentRoutes);
// Global error handler should be the last middleware
app.use(errorHandler_1.errorHandler);
exports.default = app;
