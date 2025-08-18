"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../controllers/auth");
const auth_2 = require("../middleware/auth");
const security_1 = require("../middleware/security");
const router = (0, express_1.Router)();
/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', security_1.authRateLimit, auth_1.register);
/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', security_1.authRateLimit, auth_1.login);
/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', auth_2.authenticate, auth_1.logout);
/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', auth_2.authenticate, auth_1.getProfile);
/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh JWT token
 * @access  Private
 */
router.post('/refresh', auth_2.authenticate, auth_1.refreshToken);
exports.default = router;
//# sourceMappingURL=auth.js.map