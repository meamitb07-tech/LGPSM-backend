"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventCheckInRoutes = exports.checkInRoutes = void 0;
const express_1 = require("express");
const checkIn_controller_1 = require("../controllers/checkIn.controller");
const authenticate_1 = require("../middlewares/authenticate");
const authorizeRoles_1 = require("../middlewares/authorizeRoles");
const User_1 = require("../models/User");
const checkIn_validator_1 = require("../validators/checkIn.validator");
const validate = (schema) => (req, res, next) => {
    try {
        schema.parse({ body: req.body });
        next();
    }
    catch (err) {
        res.status(400).json({ error: 'Validation Error', message: 'Invalid input data', details: err.errors });
    }
};
exports.checkInRoutes = (0, express_1.Router)();
exports.checkInRoutes.use(authenticate_1.authenticate);
exports.checkInRoutes.post('/scan', (0, authorizeRoles_1.authorizeRoles)(User_1.Role.ORGANIZER, User_1.Role.SYSTEM_USER, User_1.Role.ADMIN), validate(checkIn_validator_1.scanCheckInSchema), checkIn_controller_1.checkInController.scanCheckIn);
exports.checkInRoutes.post('/manual', (0, authorizeRoles_1.authorizeRoles)(User_1.Role.ORGANIZER, User_1.Role.SYSTEM_USER, User_1.Role.ADMIN), validate(checkIn_validator_1.manualCheckInSchema), checkIn_controller_1.checkInController.manualCheckIn);
exports.eventCheckInRoutes = (0, express_1.Router)({ mergeParams: true });
exports.eventCheckInRoutes.use(authenticate_1.authenticate);
exports.eventCheckInRoutes.get('/', (0, authorizeRoles_1.authorizeRoles)(User_1.Role.ORGANIZER, User_1.Role.SYSTEM_USER, User_1.Role.ADMIN), checkIn_controller_1.checkInController.getCheckIns);
exports.default = exports.checkInRoutes;
