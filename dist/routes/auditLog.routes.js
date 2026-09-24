"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auditLog_controller_1 = require("../controllers/auditLog.controller");
const authenticate_1 = require("../middlewares/authenticate");
const authorizeRoles_1 = require("../middlewares/authorizeRoles");
const User_1 = require("../models/User");
const router = (0, express_1.Router)();
router.use(authenticate_1.authenticate);
// View audit logs - ADMIN and ORGANIZER
router.get('/', (0, authorizeRoles_1.authorizeRoles)(User_1.Role.ADMIN, User_1.Role.ORGANIZER), auditLog_controller_1.auditLogController.getLogs);
exports.default = router;
