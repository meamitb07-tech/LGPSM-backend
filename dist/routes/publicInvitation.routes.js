"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const publicInvitation_controller_1 = require("../controllers/publicInvitation.controller");
const publicInvitation_validator_1 = require("../validators/publicInvitation.validator");
const router = (0, express_1.Router)();
const validate = (schema) => (req, res, next) => {
    try {
        schema.parse({ body: req.body });
        next();
    }
    catch (err) {
        res.status(400).json({ success: false, error: 'Validation Error', message: 'Invalid input data', details: err.errors });
    }
};
// GET /api/v1/public/invitations/:token
router.get('/:token', publicInvitation_controller_1.publicInvitationController.getPublicInvitation);
// POST /api/v1/public/invitations/:token/rsvp
router.post('/:token/rsvp', validate(publicInvitation_validator_1.submitRsvpSchema), publicInvitation_controller_1.publicInvitationController.submitRsvp);
exports.default = router;
