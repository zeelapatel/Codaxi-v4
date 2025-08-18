"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
exports.notFoundHandler = notFoundHandler;
exports.createApiError = createApiError;
exports.asyncHandler = asyncHandler;
const response_1 = require("../utils/response");
const config_1 = require("../config");
/**
 * Global error handler middleware
 */
function errorHandler(error, req, res, next) {
    // Log error
    console.error('Error:', {
        message: error.message,
        stack: config_1.isDevelopment ? error.stack : undefined,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent')
    });
    // Handle known API errors
    if ('statusCode' in error && error.statusCode) {
        (0, response_1.sendError)(res, error.message, error.statusCode);
        return;
    }
    // Handle Prisma errors
    if (error.name === 'PrismaClientKnownRequestError') {
        const prismaError = error;
        switch (prismaError.code) {
            case 'P2002':
                // Unique constraint violation
                const field = prismaError.meta?.target?.[0] || 'field';
                (0, response_1.sendError)(res, `${field} already exists`, 409);
                return;
            case 'P2025':
                // Record not found
                (0, response_1.sendError)(res, 'Record not found', 404);
                return;
            default:
                (0, response_1.sendInternalError)(res, 'Database error occurred');
                return;
        }
    }
    // Handle validation errors
    if (error.name === 'ValidationError') {
        (0, response_1.sendError)(res, error.message, 400);
        return;
    }
    // Handle JWT errors
    if (error.name === 'JsonWebTokenError') {
        (0, response_1.sendError)(res, 'Invalid token', 401);
        return;
    }
    if (error.name === 'TokenExpiredError') {
        (0, response_1.sendError)(res, 'Token expired', 401);
        return;
    }
    // Handle syntax errors
    if (error instanceof SyntaxError && 'status' in error && error.status === 400) {
        (0, response_1.sendError)(res, 'Invalid JSON format', 400);
        return;
    }
    // Default to internal server error
    const message = config_1.isDevelopment ? error.message : 'Something went wrong';
    (0, response_1.sendInternalError)(res, message);
}
/**
 * 404 handler for unknown routes
 */
function notFoundHandler(req, res) {
    (0, response_1.sendError)(res, `Route ${req.method} ${req.path} not found`, 404);
}
/**
 * Create API error
 */
function createApiError(message, statusCode = 400) {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.isOperational = true;
    return error;
}
/**
 * Async error handler wrapper
 */
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
//# sourceMappingURL=error.js.map