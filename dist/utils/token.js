"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAccessToken = generateAccessToken;
exports.generateRefreshToken = generateRefreshToken;
exports.verifyAccessToken = verifyAccessToken;
exports.verifyRefreshToken = verifyRefreshToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
function generateAccessToken(userId, role) {
    const payload = { userId, role, type: 'access' };
    return jsonwebtoken_1.default.sign(payload, env_1.env.JWT_SECRET, { expiresIn: env_1.env.JWT_EXPIRES_IN });
}
function generateRefreshToken(userId, role) {
    const payload = { userId, role, type: 'refresh' };
    return jsonwebtoken_1.default.sign(payload, env_1.env.JWT_REFRESH_SECRET, { expiresIn: env_1.env.JWT_REFRESH_EXPIRES_IN });
}
function verifyAccessToken(token) {
    const decoded = jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
    if (decoded.type !== 'access') {
        throw new Error('Invalid token type');
    }
    return decoded;
}
function verifyRefreshToken(token) {
    const decoded = jsonwebtoken_1.default.verify(token, env_1.env.JWT_REFRESH_SECRET);
    if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
    }
    return decoded;
}
