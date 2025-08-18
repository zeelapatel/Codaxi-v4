"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSuccess = sendSuccess;
exports.sendError = sendError;
exports.sendPaginated = sendPaginated;
exports.sendValidationError = sendValidationError;
exports.sendNotFound = sendNotFound;
exports.sendUnauthorized = sendUnauthorized;
exports.sendForbidden = sendForbidden;
exports.sendInternalError = sendInternalError;
/**
 * Send a successful API response
 */
function sendSuccess(res, data, message, statusCode = 200) {
    const response = {
        success: true,
        message,
        data,
        timestamp: new Date().toISOString()
    };
    res.status(statusCode).json(response);
}
/**
 * Send an error API response
 */
function sendError(res, message, statusCode = 400, errors) {
    const response = {
        success: false,
        message,
        errors,
        timestamp: new Date().toISOString()
    };
    res.status(statusCode).json(response);
}
/**
 * Send a paginated API response
 */
function sendPaginated(res, data, page, limit, total, message) {
    const totalPages = Math.ceil(total / limit);
    const response = {
        success: true,
        message,
        data,
        pagination: {
            page,
            limit,
            total,
            totalPages
        },
        timestamp: new Date().toISOString()
    };
    res.status(200).json(response);
}
/**
 * Send validation error response
 */
function sendValidationError(res, errors) {
    sendError(res, 'Validation failed', 400, errors);
}
/**
 * Send not found error response
 */
function sendNotFound(res, resource = 'Resource') {
    sendError(res, `${resource} not found`, 404);
}
/**
 * Send unauthorized error response
 */
function sendUnauthorized(res, message = 'Unauthorized access') {
    sendError(res, message, 401);
}
/**
 * Send forbidden error response
 */
function sendForbidden(res, message = 'Access forbidden') {
    sendError(res, message, 403);
}
/**
 * Send internal server error response
 */
function sendInternalError(res, message = 'Internal server error') {
    sendError(res, message, 500);
}
//# sourceMappingURL=response.js.map