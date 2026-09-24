"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.templateRepository = void 0;
const Template_1 = require("../models/Template");
exports.templateRepository = {
    async create(data) {
        return await Template_1.Template.create(data);
    },
    async findAll(categoryId) {
        const query = { isActive: true };
        if (categoryId)
            query.categoryId = categoryId;
        return await Template_1.Template.find(query).populate('categoryId').sort({ createdAt: -1 });
    },
    async findById(id) {
        return await Template_1.Template.findById(id).populate('categoryId');
    },
    async update(id, updateData) {
        return await Template_1.Template.findByIdAndUpdate(id, updateData, { new: true });
    },
    async delete(id) {
        return await Template_1.Template.findByIdAndUpdate(id, { isActive: false }, { new: true });
    }
};
