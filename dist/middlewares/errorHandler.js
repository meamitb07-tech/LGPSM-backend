"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const env_1 = require("../config/env");
// Maps well-known library errors to client-facing HTTP status codes
function resolveStatus(err) {
    if (err?.statusCode) {
        return { statusCode: err.statusCode, message: err.message || 'Request failed' };
    }
    if (err?.name === 'CastError') {
        return { statusCode: 400, message: `Invalid ${err.path || 'identifier'} format` };
    }
    if (err?.name === 'ValidationError') {
        return { statusCode: 400, message: err.message || 'Validation failed' };
    }
    if (err?.name === 'JsonWebTokenError' || err?.name === 'TokenExpiredError' || err?.message === 'Invalid token type') {
        return { statusCode: 401, message: 'Invalid or expired token' };
    }
    if (err?.code === 11000) {
        return { statusCode: 409, message: 'A record with the same unique value already exists' };
    }
    if (err?.type === 'entity.parse.failed') {
        return { statusCode: 400, message: 'Malformed JSON request body' };
    }
    return { statusCode: 500, message: err?.message || 'Internal Server Error' };
}
function errorHandler(err, req, res, next) {
    const { statusCode, message } = resolveStatus(err);
    if (statusCode >= 500) {
        console.error('Error:', err?.message || err);
    }
    res.status(statusCode).json({
        success: false,
        message,
        ...(env_1.env.NODE_ENV === 'development' && statusCode >= 500 && { stack: err?.stack }),
    });
}
