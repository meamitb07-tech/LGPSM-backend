"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userService = void 0;
const user_repository_1 = require("../repositories/user.repository");
exports.userService = {
    async getProfile(userId) {
        const user = await user_repository_1.userRepository.findById(userId);
        if (!user) {
            throw { statusCode: 404, message: 'User not found' };
        }
        return user;
    },
    async updateProfile(userId, data) {
        const user = await user_repository_1.userRepository.updateById(userId, data);
        if (!user) {
            throw { statusCode: 404, message: 'User not found' };
        }
        return user;
    }
};
