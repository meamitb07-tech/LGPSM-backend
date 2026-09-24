"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notification_controller_1 = require("../controllers/notification.controller");
const authenticate_1 = require("../middlewares/authenticate");
const authorizeRoles_1 = require("../middlewares/authorizeRoles");
const User_1 = require("../models/User");
const notification_validator_1 = require("../validators/notification.validator");
const router = (0, express_1.Router)();
const validate = (schema) => (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({ success: false, errors: result.error.format() });
    }
    req.body = result.data;
    next();
};
router.use(authenticate_1.authenticate);
router.get('/', notification_controller_1.notificationController.getUserNotifications);
router.patch('/read-all', notification_controller_1.notificationController.markAllAsRead);
router.patch('/:id/read', notification_controller_1.notificationController.markAsRead);
router.post('/', (0, authorizeRoles_1.authorizeRoles)(User_1.Role.ADMIN), validate(notification_validator_1.createNotificationSchema), notification_controller_1.notificationController.createNotification);
exports.default = router;
