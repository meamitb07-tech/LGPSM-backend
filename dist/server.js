"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const database_1 = __importDefault(require("./config/database"));
const env_1 = require("./config/env");
async function startServer() {
    try {
        await (0, database_1.default)();
        app_1.default.listen(env_1.env.PORT, () => {
            console.log(`Server is running on port ${env_1.env.PORT}`);
            console.log(`Environment: ${env_1.env.NODE_ENV}`);
        });
    }
    catch (error) {
        console.error(`MongoDB connection failed: ${error.message}`);
        process.exit(1);
    }
}
startServer();
