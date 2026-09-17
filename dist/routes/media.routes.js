"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const media_controller_1 = require("../controllers/media.controller");
const authenticate_1 = require("../middlewares/authenticate");
const authorizeRoles_1 = require("../middlewares/authorizeRoles");
const User_1 = require("../models/User");
const media_validator_1 = require("../validators/media.validator");
const router = (0, express_1.Router)();
const validate = (schema) => (req, res, next) => {
    try {
        schema.parse({ body: req.body });
        next();
    }
    catch (err) {
        res.status(400).json({ error: 'Validation Error', message: 'Invalid input data', details: err.errors });
    }
};
// Media endpoints require authentication and ORGANIZER role
router.post('/presign', authenticate_1.authenticate, (0, authorizeRoles_1.authorizeRoles)(User_1.Role.ORGANIZER), validate(media_validator_1.presignMediaSchema), media_controller_1.mediaController.presign);
exports.default = router;
