"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const template_controller_1 = require("../controllers/template.controller");
const authenticate_1 = require("../middlewares/authenticate");
const authorizeRoles_1 = require("../middlewares/authorizeRoles");
const User_1 = require("../models/User");
const template_validator_1 = require("../validators/template.validator");
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
// List/View templates for Organizers & Admins
router.get('/', (0, authorizeRoles_1.authorizeRoles)(User_1.Role.ORGANIZER, User_1.Role.ADMIN), template_controller_1.templateController.getTemplates);
router.get('/:id', (0, authorizeRoles_1.authorizeRoles)(User_1.Role.ORGANIZER, User_1.Role.ADMIN), template_controller_1.templateController.getTemplateById);
// Admin-only template management
router.post('/', (0, authorizeRoles_1.authorizeRoles)(User_1.Role.ADMIN), validate(template_validator_1.createTemplateSchema), template_controller_1.templateController.createTemplate);
router.patch('/:id', (0, authorizeRoles_1.authorizeRoles)(User_1.Role.ADMIN), validate(template_validator_1.updateTemplateSchema), template_controller_1.templateController.updateTemplate);
router.delete('/:id', (0, authorizeRoles_1.authorizeRoles)(User_1.Role.ADMIN), template_controller_1.templateController.deleteTemplate);
exports.default = router;
