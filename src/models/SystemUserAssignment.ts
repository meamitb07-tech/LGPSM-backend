import mongoose, { Document, Schema } from 'mongoose';

export interface ISystemUserAssignment extends Document {
  userId: mongoose.Types.ObjectId;
  eventId: mongoose.Types.ObjectId;
  sessionIds: mongoose.Types.ObjectId[];
  assignedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SystemUserAssignmentSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    sessionIds: [{ type: Schema.Types.ObjectId, ref: 'Session' }],
    assignedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
  },
  {
    timestamps: true
  }
);

// Indexes
SystemUserAssignmentSchema.index({ userId: 1 });
SystemUserAssignmentSchema.index({ eventId: 1 });
SystemUserAssignmentSchema.index({ userId: 1, eventId: 1 }, { unique: true });

export const SystemUserAssignment = mongoose.model<ISystemUserAssignment>('SystemUserAssignment', SystemUserAssignmentSchema);
