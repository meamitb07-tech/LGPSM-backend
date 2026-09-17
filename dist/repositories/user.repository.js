"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRepository = void 0;
const User_1 = require("../models/User");
exports.userRepository = {
    async findByEmail(email) {
        return User_1.User.findOne({ email });
    },
    async findById(id) {
        return User_1.User.findById(id);
    },
    async create(data) {
        const user = new User_1.User(data);
        return user.save();
    },
    async updateById(id, updateData) {
        return User_1.User.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    }
};
