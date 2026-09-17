"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dns_1 = __importDefault(require("dns"));
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("./env");
async function connectDatabase() {
    const atlasUrl = env_1.env.atlas_URL;
    dns_1.default.setServers([env_1.env.DNS_SERVER]);
    await mongoose_1.default.connect(atlasUrl, {
        serverSelectionTimeoutMS: 10000,
    });
    console.log('MongoDB connected successfully');
}
exports.default = connectDatabase;
