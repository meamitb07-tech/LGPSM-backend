import mongoose, { Document, Schema } from 'mongoose';

export interface ITemplate extends Document {
  name: string;
  categoryId?: mongoose.Types.ObjectId;
  subcategoryId?: mongoose.Types.ObjectId;
  previewImageKey?: string;
  templateData?: Record<string, any>;
  isSystemTemplate: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TemplateSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category' },
    subcategoryId: { type: Schema.Types.ObjectId, ref: 'Category' },
    previewImageKey: { type: String },
    templateData: { type: Schema.Types.Mixed, default: {} },
    isSystemTemplate: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true }
  },
  {
    timestamps: true
  }
);

export const Template = mongoose.model<ITemplate>('Template', TemplateSchema);
