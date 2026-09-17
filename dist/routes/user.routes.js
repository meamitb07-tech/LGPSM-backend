"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
const authenticate_1 = require("../middlewares/authenticate");
const user_validator_1 = require("../validators/user.validator");
const router = (0, express_1.Router)();
const validate = (schema) => (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({ success: false, errors: result.error.format() });
    }
    req.body = result.data;
    next();
};
// All user routes require authentication
router.use(authenticate_1.authenticate);
router.get('/profile', user_controller_1.userController.getProfile);
router.patch('/profile', validate(user_validator_1.updateProfileSchema), user_controller_1.userController.updateProfile);
exports.default = router;
