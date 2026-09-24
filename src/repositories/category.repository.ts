import { Category, ICategory } from '../models/Category';

export const categoryRepository = {
  async create(data: Partial<ICategory>): Promise<ICategory> {
    return await Category.create(data);
  },

  async findAll(activeOnly: boolean = true): Promise<ICategory[]> {
    const query = activeOnly ? { isActive: true } : {};
    return await Category.find(query).sort({ name: 1 });
  },

  async findById(id: string): Promise<ICategory | null> {
    return await Category.findById(id);
  },

  async update(id: string, updateData: Partial<ICategory>): Promise<ICategory | null> {
    return await Category.findByIdAndUpdate(id, updateData, { new: true });
  },

  async delete(id: string): Promise<ICategory | null> {
    return await Category.findByIdAndUpdate(id, { isActive: false }, { new: true });
  }
};
