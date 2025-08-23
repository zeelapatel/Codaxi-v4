"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.requireRole = requireRole;
exports.requireAdmin = requireAdmin;
exports.optionalAuth = optionalAuth;
const jwt_1 = require("../utils/jwt");
const response_1 = require("../utils/response");
const database_1 = require("../utils/database");
/**
 * Middleware to authenticate requests using JWT
 */
async function authenticate(req, res, next) {
    try {
        const token = (0, jwt_1.extractTokenFromHeader)(req.headers.authorization);
        if (!token) {
            (0, response_1.sendUnauthorized)(res, 'Access token is required');
            return;
        }
        // Verify token
        const decoded = (0, jwt_1.verifyToken)(token);
        // Check if token is blacklisted (optional: implement token blacklisting)
        const session = await database_1.db.session.findUnique({
            where: { token },
            select: { isRevoked: true, expiresAt: true }
        });
        if (session?.isRevoked) {
            (0, response_1.sendUnauthorized)(res, 'Token has been revoked');
            return;
        }
        // Verify user still exists
        const user = await database_1.db.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                email: true,
                role: true,
                emailVerified: true
            }
        });
        if (!user) {
            (0, response_1.sendUnauthorized)(res, 'User not found');
            return;
        }
        // Attach user to request
        req.user = {
            userId: user.id,
            email: user.email,
            role: user.role,
            organizationId: decoded.organizationId
        };
        next();
    }
    catch (error) {
        console.error('Authentication error:', error);
        (0, response_1.sendUnauthorized)(res, 'Invalid or expired token');
    }
}
/**
 * Middleware to check if user has required role
 */
function requireRole(roles) {
    return (req, res, next) => {
        if (!req.user) {
            (0, response_1.sendUnauthorized)(res, 'Authentication required');
            return;
        }
        if (!roles.includes(req.user.role)) {
            (0, response_1.sendForbidden)(res, 'Insufficient permissions');
            return;
        }
        next();
    };
}
/**
 * Middleware to check if user is admin
 */
function requireAdmin(req, res, next) {
    requireRole(['ADMIN'])(req, res, next);
}
/**
 * Optional authentication middleware (doesn't fail if no token)
 */
async function optionalAuth(req, res, next) {
    try {
        const token = (0, jwt_1.extractTokenFromHeader)(req.headers.authorization);
        if (token) {
            const decoded = (0, jwt_1.verifyToken)(token);
            const user = await database_1.db.user.findUnique({
                where: { id: decoded.userId },
                select: {
                    id: true,
                    email: true,
                    role: true,
                    emailVerified: true
                }
            });
            if (user) {
                req.user = {
                    userId: user.id,
                    email: user.email,
                    role: user.role,
                    organizationId: decoded.organizationId
                };
            }
        }
        next();
    }
    catch (error) {
        // Silent fail for optional auth
        next();
    }
}
//# sourceMappingURL=auth.js.map