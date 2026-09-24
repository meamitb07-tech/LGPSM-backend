import mongoose, { Document, Schema } from 'mongoose';

export interface IAuditLog extends Document {
  actorId: mongoose.Types.ObjectId;
  actorType: 'ADMIN' | 'ORGANIZER' | 'SYSTEM_USER';
  eventId?: mongoose.Types.ObjectId;
  action: string;
  entityType?: string;
  entityId?: mongoose.Types.ObjectId;
  status: 'SUCCESS' | 'FAILED';
  metadata?: Record<string, any>;
  createdAt: Date;
}

const AuditLogSchema: Schema = new Schema(
  {
    actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    actorType: { type: String, enum: ['ADMIN', 'ORGANIZER', 'SYSTEM_USER'], required: true },
    eventId: { type: Schema.Types.ObjectId, ref: 'Event' },
    action: { type: String, required: true },
    entityType: { type: String },
    entityId: { type: Schema.Types.ObjectId },
    status: { type: String, enum: ['SUCCESS', 'FAILED'], default: 'SUCCESS' },
    metadata: { type: Schema.Types.Mixed, default: {} }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

AuditLogSchema.index({ actorId: 1 });
AuditLogSchema.index({ eventId: 1 });
AuditLogSchema.index({ action: 1 });
AuditLogSchema.index({ createdAt: -1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
