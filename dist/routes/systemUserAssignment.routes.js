"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.myAssignmentRoutes = exports.assignmentRoutes = exports.eventAssignmentRoutes = void 0;
const express_1 = require("express");
const systemUserAssignment_controller_1 = require("../controllers/systemUserAssignment.controller");
const authenticate_1 = require("../middlewares/authenticate");
const authorizeRoles_1 = require("../middlewares/authorizeRoles");
const User_1 = require("../models/User");
const systemUserAssignment_validator_1 = require("../validators/systemUserAssignment.validator");
const validate = (schema) => (req, res, next) => {
    try {
        schema.parse({ body: req.body });
        next();
    }
    catch (err) {
        res.status(400).json({ error: 'Validation Error', message: 'Invalid input data', details: err.errors });
    }
};
exports.eventAssignmentRoutes = (0, express_1.Router)({ mergeParams: true });
exports.eventAssignmentRoutes.use(authenticate_1.authenticate);
exports.eventAssignmentRoutes.post('/', (0, authorizeRoles_1.authorizeRoles)(User_1.Role.ORGANIZER), validate(systemUserAssignment_validator_1.createAssignmentSchema), systemUserAssignment_controller_1.systemUserAssignmentController.createAssignment);
exports.eventAssignmentRoutes.get('/', (0, authorizeRoles_1.authorizeRoles)(User_1.Role.ORGANIZER), systemUserAssignment_controller_1.systemUserAssignmentController.getAssignmentsByEvent);
exports.assignmentRoutes = (0, express_1.Router)();
exports.assignmentRoutes.use(authenticate_1.authenticate);
exports.assignmentRoutes.patch('/:assignmentId', (0, authorizeRoles_1.authorizeRoles)(User_1.Role.ORGANIZER), validate(systemUserAssignment_validator_1.updateAssignmentSchema), systemUserAssignment_controller_1.systemUserAssignmentController.updateAssignment);
exports.assignmentRoutes.delete('/:assignmentId', (0, authorizeRoles_1.authorizeRoles)(User_1.Role.ORGANIZER), systemUserAssignment_controller_1.systemUserAssignmentController.deleteAssignment);
exports.myAssignmentRoutes = (0, express_1.Router)();
exports.myAssignmentRoutes.use(authenticate_1.authenticate);
exports.myAssignmentRoutes.get('/', (0, authorizeRoles_1.authorizeRoles)(User_1.Role.SYSTEM_USER), systemUserAssignment_controller_1.systemUserAssignmentController.getMyAssignments);
