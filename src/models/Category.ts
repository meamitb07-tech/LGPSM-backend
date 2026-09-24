import mongoose, { Document, Schema } from 'mongoose';

export interface ISubcategory {
  _id?: mongoose.Types.ObjectId;
  name: string;
  isActive: boolean;
}

export interface ICategory extends Document {
  name: string;
  description?: string;
  subcategories: ISubcategory[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SubcategorySchema = new Schema(
  {
    name: { type: String, required: true },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

const CategorySchema: Schema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String },
    subcategories: { type: [SubcategorySchema], default: [] },
    isActive: { type: Boolean, default: true }
  },
  {
    timestamps: true
  }
);

export const Category = mongoose.model<ICategory>('Category', CategorySchema);
