"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.categoryRepository = void 0;
const Category_1 = require("../models/Category");
exports.categoryRepository = {
    async create(data) {
        return await Category_1.Category.create(data);
    },
    async findAll(activeOnly = true) {
        const query = activeOnly ? { isActive: true } : {};
        return await Category_1.Category.find(query).sort({ name: 1 });
    },
    async findById(id) {
        return await Category_1.Category.findById(id);
    },
    async update(id, updateData) {
        return await Category_1.Category.findByIdAndUpdate(id, updateData, { new: true });
    },
    async delete(id) {
        return await Category_1.Category.findByIdAndUpdate(id, { isActive: false }, { new: true });
    }
};
