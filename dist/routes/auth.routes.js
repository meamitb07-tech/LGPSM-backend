"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const rateLimiter_1 = require("../middlewares/rateLimiter");
const auth_validator_1 = require("../validators/auth.validator");
const router = (0, express_1.Router)();
// Middleware to validate body using Zod
const validate = (schema) => (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({ success: false, errors: result.error.format() });
    }
    req.body = result.data;
    next();
};
router.use(rateLimiter_1.authRateLimiter);
router.post('/register', validate(auth_validator_1.registerSchema), auth_controller_1.authController.register);
router.post('/login', validate(auth_validator_1.loginSchema), auth_controller_1.authController.login);
router.post('/google', validate(auth_validator_1.googleAuthSchema), auth_controller_1.authController.googleAuth);
router.post('/refresh', validate(auth_validator_1.refreshTokenSchema), auth_controller_1.authController.refresh);
router.post('/logout', auth_controller_1.authController.logout); // logout might not need strict validation if token is missing it just does nothing
router.post('/forgot-password', validate(auth_validator_1.forgotPasswordSchema), auth_controller_1.authController.forgotPassword);
router.post('/reset-password', validate(auth_validator_1.resetPasswordSchema), auth_controller_1.authController.resetPassword);
exports.default = router;
