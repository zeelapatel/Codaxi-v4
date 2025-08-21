"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashPassword = hashPassword;
exports.comparePassword = comparePassword;
exports.validatePassword = validatePassword;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const SALT_ROUNDS = 12;
/**
 * Hash a password using bcrypt
 */
async function hashPassword(password) {
    return bcryptjs_1.default.hash(password, SALT_ROUNDS);
}
/**
 * Compare a plain text password with a hashed password
 */
async function comparePassword(password, hashedPassword) {
    return bcryptjs_1.default.compare(password, hashedPassword);
}
/**
 * Validate password strength
 */
function validatePassword(password) {
    const errors = [];
    if (password.length < 8) {
        errors.push('Password must be at least 8 characters long');
    }
    if (!/(?=.*[a-z])/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }
    if (!/(?=.*[A-Z])/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }
    if (!/(?=.*\d)/.test(password)) {
        errors.push('Password must contain at least one number');
    }
    if (!/(?=.*[@$!%*?&])/.test(password)) {
        errors.push('Password must contain at least one special character (@$!%*?&)');
    }
    return {
        isValid: errors.length === 0,
        errors
    };
}
//# sourceMappingURL=password.js.map