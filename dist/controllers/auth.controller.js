"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = void 0;
const auth_service_1 = require("../services/auth.service");
exports.authController = {
    async register(req, res, next) {
        try {
            const user = await auth_service_1.authService.register(req.body);
            res.status(201).json({ success: true, data: user });
        }
        catch (error) {
            next(error);
        }
    },
    async login(req, res, next) {
        try {
            const result = await auth_service_1.authService.login(req.body);
            res.status(200).json({ success: true, data: result });
        }
        catch (error) {
            next(error);
        }
    },
    async googleAuth(req, res, next) {
        try {
            const result = await auth_service_1.authService.googleAuth(req.body.token);
            res.status(200).json({ success: true, data: result });
        }
        catch (error) {
            next(error);
        }
    },
    async refresh(req, res, next) {
        try {
            const result = await auth_service_1.authService.refresh(req.body.refreshToken);
            res.status(200).json({ success: true, data: result });
        }
        catch (error) {
            next(error);
        }
    },
    async logout(req, res, next) {
        try {
            await auth_service_1.authService.logout(req.body.refreshToken);
            res.status(200).json({ success: true, message: 'Logged out successfully' });
        }
        catch (error) {
            next(error);
        }
    },
    async forgotPassword(req, res, next) {
        try {
            await auth_service_1.authService.forgotPassword(req.body.email);
            res.status(200).json({ success: true, message: 'If the email exists, a reset link has been generated.' });
        }
        catch (error) {
            next(error);
        }
    },
    async resetPassword(req, res, next) {
        try {
            await auth_service_1.authService.resetPassword(req.body.token, req.body.newPassword);
            res.status(200).json({ success: true, message: 'Password reset successfully' });
        }
        catch (error) {
            next(error);
        }
    }
};
