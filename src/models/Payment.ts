import mongoose, { Document, Schema } from 'mongoose';

export enum PaymentStatus {
  CREATED = 'CREATED',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED'
}

export interface IPayment extends Document {
  orderId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  eventId: mongoose.Types.ObjectId;
  provider: string;
  providerOrderId: string;
  providerPaymentId?: string;
  amountBase: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  status: PaymentStatus;
  signatureVerified: boolean;
  webhookData?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema: Schema = new Schema(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    provider: { type: String, default: 'RAZORPAY' },
    providerOrderId: { type: String, required: true },
    providerPaymentId: { type: String },
    amountBase: { type: Number, required: true },
    taxAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    status: { type: String, enum: Object.values(PaymentStatus), default: PaymentStatus.CREATED },
    signatureVerified: { type: Boolean, default: false },
    webhookData: { type: Schema.Types.Mixed, default: {} }
  },
  {
    timestamps: true
  }
);

PaymentSchema.index({ orderId: 1 });
PaymentSchema.index({ providerOrderId: 1 });
PaymentSchema.index({ providerPaymentId: 1 });

export const Payment = mongoose.model<IPayment>('Payment', PaymentSchema);
