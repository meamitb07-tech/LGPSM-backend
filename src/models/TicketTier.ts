import mongoose, { Document, Schema } from 'mongoose';

export interface ITicketTier extends Document {
  eventId: mongoose.Types.ObjectId;
  name: string;
  price: number;
  currency: string;
  capacity: number;
  sold: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TicketTierSchema: Schema = new Schema(
  {
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    capacity: { type: Number, required: true, min: 1 },
    sold: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
  },
  {
    timestamps: true
  }
);

TicketTierSchema.index({ eventId: 1 });

export const TicketTier = mongoose.model<ITicketTier>('TicketTier', TicketTierSchema);
