import mongoose, { Document, Schema } from 'mongoose';

export enum CheckInMethod {
  QR = 'QR',
  MANUAL = 'MANUAL'
}

export interface ICheckIn extends Document {
  eventId: mongoose.Types.ObjectId;
  inviteeId: mongoose.Types.ObjectId;
  sessionId?: mongoose.Types.ObjectId | null;
  checkInMethod: CheckInMethod;
  checkedInBy: mongoose.Types.ObjectId;
  checkInAt: Date;
  checkOutAt?: Date | null;
  checkedOutBy?: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const CheckInSchema: Schema = new Schema(
  {
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    inviteeId: { type: Schema.Types.ObjectId, ref: 'Invitee', required: true },
    sessionId: { type: Schema.Types.ObjectId, ref: 'Session', default: null },
    checkInMethod: {
      type: String,
      enum: Object.values(CheckInMethod),
      required: true
    },
    checkedInBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    checkInAt: { type: Date, default: Date.now, required: true },
    checkOutAt: { type: Date, default: null },
    checkedOutBy: { type: Schema.Types.ObjectId, ref: 'User', default: null }
  },
  {
    timestamps: true
  }
);

// Indexes
CheckInSchema.index({ eventId: 1, checkInAt: -1 });
CheckInSchema.index({ inviteeId: 1, eventId: 1 });
CheckInSchema.index({ eventId: 1, inviteeId: 1, sessionId: 1 }, { unique: true });
CheckInSchema.index({ sessionId: 1, checkInAt: -1 });

export const CheckIn = mongoose.model<ICheckIn>('CheckIn', CheckInSchema);
