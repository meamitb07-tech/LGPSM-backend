"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userController = void 0;
const user_service_1 = require("../services/user.service");
exports.userController = {
    async getProfile(req, res, next) {
        try {
            if (!req.user)
                throw { statusCode: 401, message: 'Unauthorized' };
            const user = await user_service_1.userService.getProfile(req.user.userId);
            res.status(200).json({ success: true, data: user });
        }
        catch (error) {
            next(error);
        }
    },
    async updateProfile(req, res, next) {
        try {
            if (!req.user)
                throw { statusCode: 401, message: 'Unauthorized' };
            const user = await user_service_1.userService.updateProfile(req.user.userId, req.body);
            res.status(200).json({ success: true, data: user });
        }
        catch (error) {
            next(error);
        }
    },
    async createUser(req, res, next) {
        try {
            if (!req.user)
                throw { statusCode: 401, message: 'Unauthorized' };
            const user = await user_service_1.userService.createUser(req.user.role, req.body);
            res.status(201).json({ success: true, data: user });
        }
        catch (error) {
            next(error);
        }
    }
};
