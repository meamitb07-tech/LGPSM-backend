import mongoose, { Document, Schema } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    isActive: { type: Boolean, default: true }
  },
  {
    timestamps: true
  }
);

export const Category = mongoose.model<ICategory>('Category', CategorySchema);
