"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.invoiceRepository = void 0;
const Invoice_1 = require("../models/Invoice");
exports.invoiceRepository = {
    async create(data) {
        return await Invoice_1.Invoice.create(data);
    },
    async findById(id) {
        return await Invoice_1.Invoice.findById(id).populate('paymentId').populate('eventId').populate('userId', 'fullName email');
    },
    async findByPaymentId(paymentId) {
        return await Invoice_1.Invoice.findOne({ paymentId });
    }
};
