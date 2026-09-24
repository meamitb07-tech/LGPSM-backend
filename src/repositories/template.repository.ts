import { Template, ITemplate } from '../models/Template';

export const templateRepository = {
  async create(data: Partial<ITemplate>): Promise<ITemplate> {
    return await Template.create(data);
  },

  async findAll(categoryId?: string): Promise<ITemplate[]> {
    const query: any = { isActive: true };
    if (categoryId) query.categoryId = categoryId;
    return await Template.find(query).populate('categoryId').sort({ createdAt: -1 });
  },

  async findById(id: string): Promise<ITemplate | null> {
    return await Template.findById(id).populate('categoryId');
  },

  async update(id: string, updateData: Partial<ITemplate>): Promise<ITemplate | null> {
    return await Template.findByIdAndUpdate(id, updateData, { new: true });
  },

  async delete(id: string): Promise<ITemplate | null> {
    return await Template.findByIdAndUpdate(id, { isActive: false }, { new: true });
  }
};
