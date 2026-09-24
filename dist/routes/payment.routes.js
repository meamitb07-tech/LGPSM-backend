"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const payment_controller_1 = require("../controllers/payment.controller");
const authenticate_1 = require("../middlewares/authenticate");
const payment_validator_1 = require("../validators/payment.validator");
const router = (0, express_1.Router)();
const validate = (schema) => (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({ success: false, errors: result.error.format() });
    }
    req.body = result.data;
    next();
};
// Razorpay Public Webhook (unauthenticated signature verified)
router.post('/payments/webhook', payment_controller_1.paymentController.handleWebhook);
// Protected routes
router.use(authenticate_1.authenticate);
router.post('/payments/order', validate(payment_validator_1.createOrderSchema), payment_controller_1.paymentController.createTicketOrder);
router.post('/payments/verify', validate(payment_validator_1.verifyPaymentSchema), payment_controller_1.paymentController.verifyPayment);
router.get('/orders', payment_controller_1.paymentController.getUserOrders);
router.get('/orders/:id', payment_controller_1.paymentController.getOrderById);
router.get('/invoices/:id', payment_controller_1.paymentController.getInvoiceById);
exports.default = router;
