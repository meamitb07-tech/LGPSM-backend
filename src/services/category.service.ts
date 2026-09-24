import { categoryRepository } from '../repositories/category.repository';
import { ICategory } from '../models/Category';

export const categoryService = {
  async createCategory(data: Partial<ICategory>): Promise<ICategory> {
    return await categoryRepository.create(data);
  },

  async getCategories(activeOnly: boolean = true): Promise<ICategory[]> {
    return await categoryRepository.findAll(activeOnly);
  },

  async getCategoryById(id: string): Promise<ICategory> {
    const category = await categoryRepository.findById(id);
    if (!category) throw new Error('CATEGORY_NOT_FOUND');
    return category;
  },

  async updateCategory(id: string, updateData: Partial<ICategory>): Promise<ICategory> {
    const category = await categoryRepository.update(id, updateData);
    if (!category) throw new Error('CATEGORY_NOT_FOUND');
    return category;
  },

  async deleteCategory(id: string): Promise<ICategory> {
    const category = await categoryRepository.delete(id);
    if (!category) throw new Error('CATEGORY_NOT_FOUND');
    return category;
  }
};
