"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const order_repository_1 = require("../repositories/order.repository");
const payment_repository_1 = require("../repositories/payment.repository");
const invoice_repository_1 = require("../repositories/invoice.repository");
const TicketTier_1 = require("../models/TicketTier");
const Event_1 = require("../models/Event");
const Order_1 = require("../models/Order");
const Payment_1 = require("../models/Payment");
exports.paymentService = {
    async createTicketOrder(userId, eventId, ticketTierId, quantity) {
        const event = await Event_1.Event.findById(eventId);
        if (!event)
            throw new Error('EVENT_NOT_FOUND');
        const tier = await TicketTier_1.TicketTier.findOne({ _id: ticketTierId, eventId, isActive: true });
        if (!tier)
            throw new Error('TICKET_TIER_NOT_FOUND');
        if (tier.sold + quantity > tier.capacity) {
            throw new Error('TIER_CAPACITY_EXCEEDED');
        }
        const totalAmount = tier.price * quantity;
        const providerOrderId = `order_rzp_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        const order = await order_repository_1.orderRepository.create({
            userId: userId,
            eventId: eventId,
            ticketTierId: ticketTierId,
            quantity,
            amount: totalAmount,
            currency: tier.currency || 'INR',
            providerOrderId,
            status: Order_1.OrderStatus.PENDING
        });
        const payment = await payment_repository_1.paymentRepository.create({
            orderId: order._id,
            userId: userId,
            eventId: eventId,
            provider: 'RAZORPAY',
            providerOrderId,
            amountBase: totalAmount,
            taxAmount: 0,
            totalAmount,
            currency: tier.currency || 'INR',
            status: Payment_1.PaymentStatus.CREATED,
            signatureVerified: false
        });
        return {
            order,
            payment,
            razorpayOrder: {
                id: providerOrderId,
                entity: 'order',
                amount: totalAmount * 100, // amount in paise
                currency: tier.currency || 'INR',
                receipt: order._id.toString()
            }
        };
    },
    async verifyPayment(userId, providerOrderId, providerPaymentId, signature) {
        const payment = await payment_repository_1.paymentRepository.findByProviderOrderId(providerOrderId);
        if (!payment)
            throw new Error('PAYMENT_NOT_FOUND');
        let isValid = true;
        const keySecret = process.env.RAZORPAY_KEY_SECRET;
        if (keySecret && signature) {
            const generatedSignature = crypto_1.default
                .createHmac('sha256', keySecret)
                .update(`${providerOrderId}|${providerPaymentId}`)
                .digest('hex');
            isValid = generatedSignature === signature;
        }
        if (!isValid) {
            await payment_repository_1.paymentRepository.updatePaymentStatus(providerOrderId, Payment_1.PaymentStatus.FAILED, providerPaymentId, false);
            await order_repository_1.orderRepository.updateStatus(payment.orderId.toString(), Order_1.OrderStatus.FAILED);
            throw new Error('INVALID_PAYMENT_SIGNATURE');
        }
        const updatedPayment = await payment_repository_1.paymentRepository.updatePaymentStatus(providerOrderId, Payment_1.PaymentStatus.PAID, providerPaymentId, true);
        const updatedOrder = await order_repository_1.orderRepository.updateStatus(payment.orderId.toString(), Order_1.OrderStatus.PAID);
        // Update tier sold count
        if (updatedOrder) {
            await TicketTier_1.TicketTier.findByIdAndUpdate(updatedOrder.ticketTierId, { $inc: { sold: updatedOrder.quantity } });
        }
        // Generate Invoice
        let invoice = await invoice_repository_1.invoiceRepository.findByPaymentId(payment._id.toString());
        if (!invoice && updatedPayment) {
            const invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            invoice = await invoice_repository_1.invoiceRepository.create({
                invoiceNumber,
                paymentId: updatedPayment._id,
                userId: userId,
                eventId: updatedPayment.eventId,
                subtotal: updatedPayment.amountBase,
                tax: updatedPayment.taxAmount,
                total: updatedPayment.totalAmount,
                paymentMethod: 'RAZORPAY',
                paymentStatus: 'PAID',
                issuedAt: new Date()
            });
        }
        return { order: updatedOrder, payment: updatedPayment, invoice };
    },
    async handleWebhook(eventBody, signature) {
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
        if (webhookSecret && signature) {
            const expectedSignature = crypto_1.default
                .createHmac('sha256', webhookSecret)
                .update(JSON.stringify(eventBody))
                .digest('hex');
            if (expectedSignature !== signature) {
                throw new Error('INVALID_WEBHOOK_SIGNATURE');
            }
        }
        const eventName = eventBody.event;
        const paymentEntity = eventBody.payload?.payment?.entity;
        if (!paymentEntity)
            return { success: true, message: 'Ignored non-payment event' };
        const providerOrderId = paymentEntity.order_id;
        const providerPaymentId = paymentEntity.id;
        if (eventName === 'payment.captured' || eventName === 'order.paid') {
            const payment = await payment_repository_1.paymentRepository.findByProviderOrderId(providerOrderId);
            if (payment && payment.status !== Payment_1.PaymentStatus.PAID) {
                await payment_repository_1.paymentRepository.updatePaymentStatus(providerOrderId, Payment_1.PaymentStatus.PAID, providerPaymentId, true);
                const order = await order_repository_1.orderRepository.updateStatus(payment.orderId.toString(), Order_1.OrderStatus.PAID);
                if (order) {
                    await TicketTier_1.TicketTier.findByIdAndUpdate(order.ticketTierId, { $inc: { sold: order.quantity } });
                    const invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
                    await invoice_repository_1.invoiceRepository.create({
                        invoiceNumber,
                        paymentId: payment._id,
                        userId: payment.userId,
                        eventId: payment.eventId,
                        subtotal: payment.amountBase,
                        tax: payment.taxAmount,
                        total: payment.totalAmount,
                        paymentMethod: 'RAZORPAY',
                        paymentStatus: 'PAID',
                        issuedAt: new Date()
                    });
                }
            }
        }
        else if (eventName === 'payment.failed') {
            await payment_repository_1.paymentRepository.updatePaymentStatus(providerOrderId, Payment_1.PaymentStatus.FAILED, providerPaymentId, false);
            const payment = await payment_repository_1.paymentRepository.findByProviderOrderId(providerOrderId);
            if (payment) {
                await order_repository_1.orderRepository.updateStatus(payment.orderId.toString(), Order_1.OrderStatus.FAILED);
            }
        }
        return { success: true, event: eventName };
    },
    async getUserOrders(userId, page = 1, limit = 20) {
        return await order_repository_1.orderRepository.findByUserId(userId, page, limit);
    },
    async getOrderById(orderId, userId) {
        const order = await order_repository_1.orderRepository.findById(orderId);
        if (!order)
            throw new Error('ORDER_NOT_FOUND');
        return order;
    },
    async getInvoiceById(invoiceId, userId) {
        const invoice = await invoice_repository_1.invoiceRepository.findById(invoiceId);
        if (!invoice)
            throw new Error('INVOICE_NOT_FOUND');
        return invoice;
    }
};
