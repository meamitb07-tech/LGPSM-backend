"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tokenRepository = void 0;
const RefreshToken_1 = require("../models/RefreshToken");
exports.tokenRepository = {
    async createRefreshToken(userId, token, expiresAt) {
        const rt = new RefreshToken_1.RefreshToken({ userId, token, expiresAt });
        return rt.save();
    },
    async findByToken(token) {
        return RefreshToken_1.RefreshToken.findOne({ token });
    },
    async revokeToken(token) {
        await RefreshToken_1.RefreshToken.updateOne({ token }, { isRevoked: true });
    },
    async revokeAllForUser(userId) {
        await RefreshToken_1.RefreshToken.updateMany({ userId }, { isRevoked: true });
    }
};
