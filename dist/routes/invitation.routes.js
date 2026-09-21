"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const invitation_controller_1 = require("../controllers/invitation.controller");
const authenticate_1 = require("../middlewares/authenticate");
const authorizeRoles_1 = require("../middlewares/authorizeRoles");
const User_1 = require("../models/User");
const invitation_validator_1 = require("../validators/invitation.validator");
const router = (0, express_1.Router)({ mergeParams: true });
const validate = (schema) => (req, res, next) => {
    try {
        schema.parse({ body: req.body });
        next();
    }
    catch (err) {
        res.status(400).json({ error: 'Validation Error', message: 'Invalid input data', details: err.errors });
    }
};
router.use(authenticate_1.authenticate);
// POST /api/v1/events/:eventId/invitations/send
router.post('/send', (0, authorizeRoles_1.authorizeRoles)(User_1.Role.ORGANIZER), validate(invitation_validator_1.sendInvitationSchema), invitation_controller_1.invitationController.sendInvitations);
// POST /api/v1/events/:eventId/invitations/resend
router.post('/resend', (0, authorizeRoles_1.authorizeRoles)(User_1.Role.ORGANIZER), validate(invitation_validator_1.resendInvitationSchema), invitation_controller_1.invitationController.resendInvitations);
// GET /api/v1/events/:eventId/invitations
router.get('/', (0, authorizeRoles_1.authorizeRoles)(User_1.Role.ORGANIZER), invitation_controller_1.invitationController.getInvitations);
exports.default = router;
