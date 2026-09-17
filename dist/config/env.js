"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const zod_1 = require("zod");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const envSchema = zod_1.z.object({
    PORT: zod_1.z.string().default('5000'),
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    atlas_URL: zod_1.z.string().min(1, 'atlas_URL is required'),
    DNS_SERVER: zod_1.z.string().optional().default('8.8.8.8'),
    FRONTEND_URL: zod_1.z.string().default('http://localhost:3000'),
    JWT_SECRET: zod_1.z.string().min(1, 'JWT_SECRET is required'),
    JWT_REFRESH_SECRET: zod_1.z.string().min(1, 'JWT_REFRESH_SECRET is required'),
    JWT_EXPIRES_IN: zod_1.z.string().default('15m'),
    JWT_REFRESH_EXPIRES_IN: zod_1.z.string().default('7d'),
    GOOGLE_CLIENT_ID: zod_1.z.string().optional(),
});
const _env = envSchema.safeParse(process.env);
if (!_env.success) {
    console.error('❌ Invalid environment variables:', _env.error.format());
    process.exit(1);
}
exports.env = _env.data;
