"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const env_1 = require("../config/env");
function errorHandler(err, req, res, next) {
    console.error('Error:', err.message || err);
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    res.status(statusCode).json({
        success: false,
        message,
        ...(env_1.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
}
