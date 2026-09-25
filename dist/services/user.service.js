"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.userService = void 0;
const user_repository_1 = require("../repositories/user.repository");
const User_1 = require("../models/User");
// Organizers may only manage staff accounts (SYSTEM_USER); admins may manage anyone.
async function findManageableUser(actorRole, userId) {
    const target = await user_repository_1.userRepository.findById(userId);
    if (!target) {
        throw { statusCode: 404, message: 'User not found' };
    }
    if (actorRole === User_1.Role.ORGANIZER && target.role !== User_1.Role.SYSTEM_USER) {
        throw { statusCode: 403, message: 'Organizers can only manage staff (SYSTEM_USER) accounts' };
    }
    return target;
}
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
    },
    async changePassword(userId, currentPassword, newPassword) {
        const user = await user_repository_1.userRepository.findById(userId);
        if (!user) {
            throw { statusCode: 404, message: 'User not found' };
        }
        if (!user.passwordHash) {
            throw { statusCode: 400, message: 'This account signs in with Google and has no password to change' };
        }
        const { verifyPassword, hashPassword } = await Promise.resolve().then(() => __importStar(require('../utils/password')));
        const matches = await verifyPassword(currentPassword, user.passwordHash);
        if (!matches) {
            throw { statusCode: 400, message: 'Current password is incorrect' };
        }
        user.passwordHash = await hashPassword(newPassword);
        await user.save();
        return { updated: true };
    },
    async createUser(creatorRole, data) {
        // Role Hierarchy rules
        if (creatorRole === 'ORGANIZER' && data.role !== 'SYSTEM_USER') {
            throw { statusCode: 403, message: 'Organizers can only create staff (SYSTEM_USER)' };
        }
        // Admins can create ORGANIZER and SYSTEM_USER (and admins if needed)
        const existingUser = await user_repository_1.userRepository.findByEmail(data.email);
        if (existingUser) {
            throw { statusCode: 400, message: 'Email already in use' };
        }
        const { hashPassword } = await Promise.resolve().then(() => __importStar(require('../utils/password')));
        const { AuthProvider } = await Promise.resolve().then(() => __importStar(require('../models/User')));
        const hashedPassword = await hashPassword(data.password);
        const user = await user_repository_1.userRepository.create({
            fullName: data.fullName,
            email: data.email,
            phone: data.phone,
            ...(data.profile ? { profile: data.profile } : {}),
            passwordHash: hashedPassword,
            authProvider: AuthProvider.LOCAL,
            role: data.role
        });
        return user;
    },
    async getUsers(actorRole, role) {
        const query = { isActive: true };
        if (role) {
            query.role = role;
        }
        // Organizers only ever see staff accounts
        if (actorRole === User_1.Role.ORGANIZER) {
            query.role = User_1.Role.SYSTEM_USER;
        }
        return await user_repository_1.userRepository.find(query);
    },
    async deleteUser(actorRole, userId) {
        await findManageableUser(actorRole, userId);
        const user = await user_repository_1.userRepository.updateById(userId, { isActive: false });
        if (!user) {
            throw { statusCode: 404, message: 'User not found' };
        }
        return { deleted: true };
    },
    async updateUser(actorRole, userId, data) {
        await findManageableUser(actorRole, userId);
        const updatePayload = {};
        if (data.fullName !== undefined)
            updatePayload.fullName = data.fullName;
        if (data.email !== undefined) {
            const existing = await user_repository_1.userRepository.findByEmail(String(data.email).toLowerCase().trim());
            if (existing && existing._id.toString() !== userId) {
                throw { statusCode: 409, message: 'Email already in use' };
            }
            updatePayload.email = data.email;
        }
        if (data.phone !== undefined)
            updatePayload.phone = data.phone;
        if (data.password) {
            const { hashPassword } = await Promise.resolve().then(() => __importStar(require('../utils/password')));
            updatePayload.passwordHash = await hashPassword(data.password);
        }
        const user = await user_repository_1.userRepository.updateById(userId, updatePayload);
        if (!user) {
            throw { statusCode: 404, message: 'User not found' };
        }
        return user;
    }
};
