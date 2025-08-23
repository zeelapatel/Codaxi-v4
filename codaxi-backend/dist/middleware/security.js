"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generalRateLimit = exports.authRateLimit = void 0;
exports.rateLimit = rateLimit;
exports.clearRateLimit = clearRateLimit;
exports.requestSizeLimit = requestSizeLimit;
exports.corsHeaders = corsHeaders;
const response_1 = require("../utils/response");
/**
 * Rate limiting store (in production, use Redis)
 */
const rateLimitStore = new Map();
/**
 * Simple rate limiting middleware
 */
function rateLimit(maxRequests = 100, windowMs = 15 * 60 * 1000) {
    return (req, res, next) => {
        const clientId = req.ip || 'unknown';
        const now = Date.now();
        const resetTime = now + windowMs;
        // Clean expired entries
        for (const [key, value] of rateLimitStore.entries()) {
            if (value.resetTime < now) {
                rateLimitStore.delete(key);
            }
        }
        // Get or create client record
        let clientRecord = rateLimitStore.get(clientId);
        if (!clientRecord || clientRecord.resetTime < now) {
            clientRecord = { count: 0, resetTime };
            rateLimitStore.set(clientId, clientRecord);
        }
        // Check rate limit
        if (clientRecord.count >= maxRequests) {
            res.set({
                'X-RateLimit-Limit': maxRequests.toString(),
                'X-RateLimit-Remaining': '0',
                'X-RateLimit-Reset': Math.ceil(clientRecord.resetTime / 1000).toString()
            });
            (0, response_1.sendError)(res, 'Too many requests', 429);
            return;
        }
        // Increment count
        clientRecord.count++;
        // Set rate limit headers
        res.set({
            'X-RateLimit-Limit': maxRequests.toString(),
            'X-RateLimit-Remaining': (maxRequests - clientRecord.count).toString(),
            'X-RateLimit-Reset': Math.ceil(clientRecord.resetTime / 1000).toString()
        });
        next();
    };
}
/**
 * Clear rate limit store (for development)
 */
function clearRateLimit() {
    rateLimitStore.clear();
}
/**
 * Strict rate limiting for auth endpoints
 */
exports.authRateLimit = rateLimit(50, 15 * 60 * 1000); // 50 requests per 15 minutes (increased for development)
/**
 * General rate limiting
 */
exports.generalRateLimit = rateLimit(100, 15 * 60 * 1000); // 100 requests per 15 minutes
/**
 * Request size limiting
 */
function requestSizeLimit(maxSize = 1024 * 1024) {
    return (req, res, next) => {
        const contentLength = parseInt(req.get('content-length') || '0', 10);
        if (contentLength > maxSize) {
            (0, response_1.sendError)(res, 'Request entity too large', 413);
            return;
        }
        next();
    };
}
/**
 * CORS headers middleware
 */
function corsHeaders(req, res, next) {
    const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:3001',
        process.env.FRONTEND_URL
    ].filter(Boolean);
    const origin = req.get('Origin');
    if (origin && allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    next();
}
//# sourceMappingURL=security.js.map