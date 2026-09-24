import { Invoice, IInvoice } from '../models/Invoice';

export const invoiceRepository = {
  async create(data: Partial<IInvoice>): Promise<IInvoice> {
    return await Invoice.create(data);
  },

  async findById(id: string): Promise<IInvoice | null> {
    return await Invoice.findById(id).populate('paymentId').populate('eventId').populate('userId', 'fullName email');
  },

  async findByPaymentId(paymentId: string): Promise<IInvoice | null> {
    return await Invoice.findOne({ paymentId });
  }
};
