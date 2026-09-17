import mongoose, { Document, Schema } from 'mongoose';

export interface ITemplate extends Document {
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TemplateSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    isActive: { type: Boolean, default: true }
  },
  {
    timestamps: true
  }
);

export const Template = mongoose.model<ITemplate>('Template', TemplateSchema);
