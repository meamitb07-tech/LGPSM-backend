import crypto from 'crypto';
import { orderRepository } from '../repositories/order.repository';
import { paymentRepository } from '../repositories/payment.repository';
import { invoiceRepository } from '../repositories/invoice.repository';
import { TicketTier } from '../models/TicketTier';
import { Event } from '../models/Event';
import { OrderStatus } from '../models/Order';
import { PaymentStatus } from '../models/Payment';

// Payments fail closed: nothing is marked PAID unless Razorpay is configured and the signature verifies.
function getRazorpayCredentials() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new Error('PAYMENT_PROVIDER_NOT_CONFIGURED');
  }
  return { keyId, keySecret };
}

async function createRazorpayOrder(amountInPaise: number, currency: string, receipt: string) {
  const { keyId, keySecret } = getRazorpayCredentials();
  const response = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`
    },
    body: JSON.stringify({ amount: amountInPaise, currency, receipt })
  });
  const data: any = await response.json().catch(() => ({}));
  if (!response.ok || !data?.id) {
    throw new Error('PAYMENT_PROVIDER_ERROR');
  }
  return data;
}

export const paymentService = {
  async createTicketOrder(userId: string, eventId: string, ticketTierId: string, quantity: number) {
    const event = await Event.findById(eventId);
    if (!event) throw new Error('EVENT_NOT_FOUND');

    const tier = await TicketTier.findOne({ _id: ticketTierId, eventId, isActive: true });
    if (!tier) throw new Error('TICKET_TIER_NOT_FOUND');

    if (tier.sold + quantity > tier.capacity) {
      throw new Error('TIER_CAPACITY_EXCEEDED');
    }

    const totalAmount = tier.price * quantity;
    const currency = tier.currency || 'INR';

    // Order must exist at the provider before we record anything locally
    getRazorpayCredentials();
    const receipt = `rcpt_${Date.now()}`;
    const razorpayOrder = await createRazorpayOrder(Math.round(totalAmount * 100), currency, receipt);
    const providerOrderId: string = razorpayOrder.id;

    const order = await orderRepository.create({
      userId: userId as any,
      eventId: eventId as any,
      ticketTierId: ticketTierId as any,
      quantity,
      amount: totalAmount,
      currency,
      providerOrderId,
      status: OrderStatus.PENDING
    });

    const payment = await paymentRepository.create({
      orderId: order._id as any,
      userId: userId as any,
      eventId: eventId as any,
      provider: 'RAZORPAY',
      providerOrderId,
      amountBase: totalAmount,
      taxAmount: 0,
      totalAmount,
      currency,
      status: PaymentStatus.CREATED,
      signatureVerified: false
    });

    return {
      order,
      payment,
      razorpayOrder: {
        id: providerOrderId,
        entity: razorpayOrder.entity,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        receipt: razorpayOrder.receipt
      }
    };
  },

  async verifyPayment(userId: string, providerOrderId: string, providerPaymentId: string, signature?: string) {
    const { keySecret } = getRazorpayCredentials();

    const payment = await paymentRepository.findByProviderOrderId(providerOrderId);
    if (!payment || payment.userId.toString() !== userId) throw new Error('PAYMENT_NOT_FOUND');

    let isValid = false;
    if (signature) {
      const generatedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(`${providerOrderId}|${providerPaymentId}`)
        .digest('hex');
      isValid = generatedSignature === signature;
    }

    if (!isValid) {
      await paymentRepository.updatePaymentStatus(providerOrderId, PaymentStatus.FAILED, providerPaymentId, false);
      await orderRepository.updateStatus((payment.orderId as any).toString(), OrderStatus.FAILED);
      throw new Error('INVALID_PAYMENT_SIGNATURE');
    }

    const updatedPayment = await paymentRepository.updatePaymentStatus(providerOrderId, PaymentStatus.PAID, providerPaymentId, true);
    const updatedOrder = await orderRepository.updateStatus((payment.orderId as any).toString(), OrderStatus.PAID);

    // Update tier sold count
    if (updatedOrder) {
      await TicketTier.findByIdAndUpdate(updatedOrder.ticketTierId, { $inc: { sold: updatedOrder.quantity } });
    }

    // Generate Invoice
    let invoice = await invoiceRepository.findByPaymentId((payment._id as any).toString());
    if (!invoice && updatedPayment) {
      const invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      invoice = await invoiceRepository.create({
        invoiceNumber,
        paymentId: updatedPayment._id as any,
        userId: userId as any,
        eventId: updatedPayment.eventId as any,
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

  async handleWebhook(eventBody: any, signature?: string) {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error('PAYMENT_PROVIDER_NOT_CONFIGURED');
    }
    if (!signature) {
      throw new Error('INVALID_WEBHOOK_SIGNATURE');
    }
    {
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(JSON.stringify(eventBody))
        .digest('hex');

      if (expectedSignature !== signature) {
        throw new Error('INVALID_WEBHOOK_SIGNATURE');
      }
    }

    const eventName = eventBody.event;
    const paymentEntity = eventBody.payload?.payment?.entity;
    if (!paymentEntity) return { success: true, message: 'Ignored non-payment event' };

    const providerOrderId = paymentEntity.order_id;
    const providerPaymentId = paymentEntity.id;

    if (eventName === 'payment.captured' || eventName === 'order.paid') {
      const payment = await paymentRepository.findByProviderOrderId(providerOrderId);
      if (payment && payment.status !== PaymentStatus.PAID) {
        await paymentRepository.updatePaymentStatus(providerOrderId, PaymentStatus.PAID, providerPaymentId, true);
        const order = await orderRepository.updateStatus((payment.orderId as any).toString(), OrderStatus.PAID);
        if (order) {
          await TicketTier.findByIdAndUpdate(order.ticketTierId, { $inc: { sold: order.quantity } });
          const invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          await invoiceRepository.create({
            invoiceNumber,
            paymentId: payment._id as any,
            userId: payment.userId as any,
            eventId: payment.eventId as any,
            subtotal: payment.amountBase,
            tax: payment.taxAmount,
            total: payment.totalAmount,
            paymentMethod: 'RAZORPAY',
            paymentStatus: 'PAID',
            issuedAt: new Date()
          });
        }
      }
    } else if (eventName === 'payment.failed') {
      await paymentRepository.updatePaymentStatus(providerOrderId, PaymentStatus.FAILED, providerPaymentId, false);
      const payment = await paymentRepository.findByProviderOrderId(providerOrderId);
      if (payment) {
        await orderRepository.updateStatus((payment.orderId as any).toString(), OrderStatus.FAILED);
      }
    }

    return { success: true, event: eventName };
  },

  async getUserOrders(userId: string, page: number = 1, limit: number = 20) {
    return await orderRepository.findByUserId(userId, page, limit);
  },

  async getOrderById(orderId: string, userId: string) {
    const order = await orderRepository.findById(orderId);
    if (!order || order.userId.toString() !== userId) throw new Error('ORDER_NOT_FOUND');
    return order;
  },

  async getInvoiceById(invoiceId: string, userId: string) {
    const invoice = await invoiceRepository.findById(invoiceId);
    if (!invoice || invoice.userId.toString() !== userId) throw new Error('INVOICE_NOT_FOUND');
    return invoice;
  }
};
