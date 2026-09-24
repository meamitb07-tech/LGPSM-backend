import mongoose, { Document, Schema } from 'mongoose';

export enum OrderStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

export interface IOrder extends Document {
  userId: mongoose.Types.ObjectId;
  eventId: mongoose.Types.ObjectId;
  ticketTierId: mongoose.Types.ObjectId;
  quantity: number;
  amount: number;
  currency: string;
  providerOrderId?: string;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    ticketTierId: { type: Schema.Types.ObjectId, ref: 'TicketTier', required: true },
    quantity: { type: Number, required: true, min: 1 },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    providerOrderId: { type: String },
    status: { type: String, enum: Object.values(OrderStatus), default: OrderStatus.PENDING }
  },
  {
    timestamps: true
  }
);

OrderSchema.index({ userId: 1 });
OrderSchema.index({ eventId: 1 });
OrderSchema.index({ providerOrderId: 1 });

export const Order = mongoose.model<IOrder>('Order', OrderSchema);
