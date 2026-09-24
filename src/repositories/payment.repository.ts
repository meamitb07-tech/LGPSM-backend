import { Payment, IPayment } from '../models/Payment';

export const paymentRepository = {
  async create(data: Partial<IPayment>): Promise<IPayment> {
    return await Payment.create(data);
  },

  async findByOrderId(orderId: string): Promise<IPayment | null> {
    return await Payment.findOne({ orderId });
  },

  async findByProviderOrderId(providerOrderId: string): Promise<IPayment | null> {
    return await Payment.findOne({ providerOrderId });
  },

  async updatePaymentStatus(providerOrderId: string, status: string, providerPaymentId?: string, signatureVerified?: boolean): Promise<IPayment | null> {
    const update: any = { status };
    if (providerPaymentId) update.providerPaymentId = providerPaymentId;
    if (signatureVerified !== undefined) update.signatureVerified = signatureVerified;

    return await Payment.findOneAndUpdate({ providerOrderId }, update, { new: true });
  }
};
