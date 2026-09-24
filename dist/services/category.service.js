"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.categoryService = void 0;
const category_repository_1 = require("../repositories/category.repository");
exports.categoryService = {
    async createCategory(data) {
        return await category_repository_1.categoryRepository.create(data);
    },
    async getCategories(activeOnly = true) {
        return await category_repository_1.categoryRepository.findAll(activeOnly);
    },
    async getCategoryById(id) {
        const category = await category_repository_1.categoryRepository.findById(id);
        if (!category)
            throw new Error('CATEGORY_NOT_FOUND');
        return category;
    },
    async updateCategory(id, updateData) {
        const category = await category_repository_1.categoryRepository.update(id, updateData);
        if (!category)
            throw new Error('CATEGORY_NOT_FOUND');
        return category;
    },
    async deleteCategory(id) {
        const category = await category_repository_1.categoryRepository.delete(id);
        if (!category)
            throw new Error('CATEGORY_NOT_FOUND');
        return category;
    }
};
