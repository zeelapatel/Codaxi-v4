"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshToken = exports.getProfile = exports.logout = exports.login = exports.register = void 0;
const types_1 = require("../types");
const password_1 = require("../utils/password");
const jwt_1 = require("../utils/jwt");
const validation_1 = require("../utils/validation");
const response_1 = require("../utils/response");
const error_1 = require("../middleware/error");
const database_1 = require("../utils/database");
/**
 * Register a new user
 */
exports.register = (0, error_1.asyncHandler)(async (req, res) => {
    const { email, name, password, company } = req.body;
    // Validate input
    const validationErrors = (0, validation_1.validateUserRegistration)({ email, name, password, company });
    if (validationErrors.length > 0) {
        (0, response_1.sendValidationError)(res, validationErrors);
        return;
    }
    // Check if user already exists
    const existingUser = await database_1.db.user.findUnique({
        where: { email: email.toLowerCase() }
    });
    if (existingUser) {
        (0, response_1.sendError)(res, 'User with this email already exists', 409);
        return;
    }
    // Hash password
    const hashedPassword = await (0, password_1.hashPassword)(password);
    // Create user
    const user = await database_1.db.user.create({
        data: {
            email: email.toLowerCase(),
            name: name.trim(),
            password: hashedPassword,
            company: company?.trim() || null,
            role: types_1.UserRole.MEMBER
        },
        select: {
            id: true,
            email: true,
            name: true,
            company: true,
            role: true,
            emailVerified: true,
            createdAt: true
        }
    });
    // Create default organization for the user
    const organizationSlug = (0, validation_1.generateSlug)(company || name);
    const organization = await database_1.db.organization.create({
        data: {
            name: company || `${name}'s Organization`,
            slug: organizationSlug,
            description: `Organization for ${name}`,
            members: {
                create: {
                    userId: user.id,
                    role: types_1.UserRole.ADMIN
                }
            }
        }
    });
    // Generate JWT token
    const token = (0, jwt_1.generateToken)({
        userId: user.id,
        email: user.email,
        role: user.role,
        organizationId: organization.id
    });
    // Create session record
    await database_1.db.session.create({
        data: {
            userId: user.id,
            token,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        }
    });
    // Log audit event
    await database_1.db.auditLog.create({
        data: {
            userId: user.id,
            action: 'USER_REGISTERED',
            details: { email: user.email, name: user.name },
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        }
    });
    (0, response_1.sendSuccess)(res, {
        user,
        token,
        organization: {
            id: organization.id,
            name: organization.name,
            slug: organization.slug
        }
    }, 'Account created successfully', 201);
});
/**
 * Login user
 */
exports.login = (0, error_1.asyncHandler)(async (req, res) => {
    const { email, password } = req.body;
    // Validate input
    const validationErrors = (0, validation_1.validateUserLogin)({ email, password });
    if (validationErrors.length > 0) {
        (0, response_1.sendValidationError)(res, validationErrors);
        return;
    }
    // Find user
    const user = await database_1.db.user.findUnique({
        where: { email: email.toLowerCase() },
        include: {
            organizations: {
                include: {
                    organization: true
                },
                where: {
                    role: types_1.UserRole.ADMIN
                },
                take: 1
            }
        }
    });
    if (!user) {
        (0, response_1.sendError)(res, 'Invalid email or password', 401);
        return;
    }
    // Check password
    const isValidPassword = await (0, password_1.comparePassword)(password, user.password);
    if (!isValidPassword) {
        (0, response_1.sendError)(res, 'Invalid email or password', 401);
        return;
    }
    // Get user's primary organization
    const primaryOrganization = user.organizations[0]?.organization;
    // Generate JWT token
    const token = (0, jwt_1.generateToken)({
        userId: user.id,
        email: user.email,
        role: user.role,
        organizationId: primaryOrganization?.id
    });
    // Create session record
    await database_1.db.session.create({
        data: {
            userId: user.id,
            token,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        }
    });
    // Update last login
    await database_1.db.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
    });
    // Log audit event
    await database_1.db.auditLog.create({
        data: {
            userId: user.id,
            action: 'USER_LOGIN',
            details: { email: user.email },
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        }
    });
    // Return user data without password
    const { password: _, ...userWithoutPassword } = user;
    (0, response_1.sendSuccess)(res, {
        user: userWithoutPassword,
        token,
        organization: primaryOrganization ? {
            id: primaryOrganization.id,
            name: primaryOrganization.name,
            slug: primaryOrganization.slug,
            planType: primaryOrganization.planType
        } : null
    }, 'Login successful');
});
/**
 * Logout user
 */
exports.logout = (0, error_1.asyncHandler)(async (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
        // Revoke the session
        await database_1.db.session.updateMany({
            where: { token },
            data: { isRevoked: true }
        });
        // Log audit event
        if (req.user) {
            await database_1.db.auditLog.create({
                data: {
                    userId: req.user.userId,
                    action: 'USER_LOGOUT',
                    details: { email: req.user.email },
                    ipAddress: req.ip,
                    userAgent: req.get('User-Agent')
                }
            });
        }
    }
    (0, response_1.sendSuccess)(res, null, 'Logout successful');
});
/**
 * Get current user profile
 */
exports.getProfile = (0, error_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        throw (0, error_1.createApiError)('Authentication required', 401);
    }
    const user = await database_1.db.user.findUnique({
        where: { id: req.user.userId },
        select: {
            id: true,
            email: true,
            name: true,
            company: true,
            role: true,
            avatar: true,
            emailVerified: true,
            createdAt: true,
            updatedAt: true,
            lastLoginAt: true
        }
    });
    if (!user) {
        throw (0, error_1.createApiError)('User not found', 404);
    }
    (0, response_1.sendSuccess)(res, user);
});
/**
 * Refresh JWT token
 */
exports.refreshToken = (0, error_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        throw (0, error_1.createApiError)('Authentication required', 401);
    }
    // Generate new token
    const newToken = (0, jwt_1.generateToken)({
        userId: req.user.userId,
        email: req.user.email,
        role: req.user.role,
        organizationId: req.user.organizationId
    });
    // Create new session record
    await database_1.db.session.create({
        data: {
            userId: req.user.userId,
            token: newToken,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        }
    });
    // Optionally revoke old token
    const oldToken = req.headers.authorization?.replace('Bearer ', '');
    if (oldToken) {
        await database_1.db.session.updateMany({
            where: { token: oldToken },
            data: { isRevoked: true }
        });
    }
    (0, response_1.sendSuccess)(res, { token: newToken }, 'Token refreshed successfully');
});
//# sourceMappingURL=auth.js.map