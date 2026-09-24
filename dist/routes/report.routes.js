"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const report_controller_1 = require("../controllers/report.controller");
const authenticate_1 = require("../middlewares/authenticate");
const authorizeRoles_1 = require("../middlewares/authorizeRoles");
const User_1 = require("../models/User");
const router = (0, express_1.Router)();
router.use(authenticate_1.authenticate);
// Overall dashboard analytics
router.get('/dashboard', (0, authorizeRoles_1.authorizeRoles)(User_1.Role.ORGANIZER, User_1.Role.ADMIN), report_controller_1.reportController.getDashboardStats);
// Event-specific analytics report
router.get('/events/:eventId', (0, authorizeRoles_1.authorizeRoles)(User_1.Role.ORGANIZER, User_1.Role.ADMIN), report_controller_1.reportController.getEventReport);
exports.default = router;
