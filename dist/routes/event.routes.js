"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const event_controller_1 = require("../controllers/event.controller");
const authenticate_1 = require("../middlewares/authenticate");
const authorizeRoles_1 = require("../middlewares/authorizeRoles");
const User_1 = require("../models/User");
const event_validator_1 = require("../validators/event.validator");
const router = (0, express_1.Router)();
// Zod validation middleware wrapper
const validate = (schema) => (req, res, next) => {
    try {
        schema.parse({ body: req.body });
        next();
    }
    catch (err) {
        res.status(400).json({ error: 'Validation Error', message: 'Invalid input data', details: err.errors });
    }
};
// All event routes require authentication
router.use(authenticate_1.authenticate);
// Organizer specific routes
router.post('/', (0, authorizeRoles_1.authorizeRoles)(User_1.Role.ORGANIZER), validate(event_validator_1.createEventSchema), event_controller_1.eventController.createEvent);
router.get('/', (0, authorizeRoles_1.authorizeRoles)(User_1.Role.ORGANIZER), event_controller_1.eventController.getEvents);
router.get('/:eventId', (0, authorizeRoles_1.authorizeRoles)(User_1.Role.ORGANIZER), event_controller_1.eventController.getEventById);
router.patch('/:eventId', (0, authorizeRoles_1.authorizeRoles)(User_1.Role.ORGANIZER), validate(event_validator_1.updateEventSchema), event_controller_1.eventController.updateEvent);
router.delete('/:eventId', (0, authorizeRoles_1.authorizeRoles)(User_1.Role.ORGANIZER), event_controller_1.eventController.deleteEvent);
exports.default = router;
