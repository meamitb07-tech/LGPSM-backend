"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentRepository = void 0;
const Payment_1 = require("../models/Payment");
exports.paymentRepository = {
    async create(data) {
        return await Payment_1.Payment.create(data);
    },
    async findByOrderId(orderId) {
        return await Payment_1.Payment.findOne({ orderId });
    },
    async findByProviderOrderId(providerOrderId) {
        return await Payment_1.Payment.findOne({ providerOrderId });
    },
    async updatePaymentStatus(providerOrderId, status, providerPaymentId, signatureVerified) {
        const update = { status };
        if (providerPaymentId)
            update.providerPaymentId = providerPaymentId;
        if (signatureVerified !== undefined)
            update.signatureVerified = signatureVerified;
        return await Payment_1.Payment.findOneAndUpdate({ providerOrderId }, update, { new: true });
    }
};
