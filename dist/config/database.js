"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dns_1 = __importDefault(require("dns"));
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("./env");
async function connectDatabase() {
    const atlasUrl = env_1.env.ATLAS_URL;
    try {
        // Attempting to bypass local DNS SRV blocking
        dns_1.default.setServers(['8.8.8.8', '1.1.1.1']);
    }
    catch (err) {
        console.warn('DNS override failed, using system defaults.');
    }
    await mongoose_1.default.connect(atlasUrl, {
        serverSelectionTimeoutMS: 10000,
    });
    console.log('MongoDB connected successfully');
}
exports.default = connectDatabase;
