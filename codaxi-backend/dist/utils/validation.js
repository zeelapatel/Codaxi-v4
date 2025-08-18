"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateEmail = validateEmail;
exports.validateUserRegistration = validateUserRegistration;
exports.validateUserLogin = validateUserLogin;
exports.sanitizeString = sanitizeString;
exports.validateSlug = validateSlug;
exports.generateSlug = generateSlug;
exports.isValidUUID = isValidUUID;
const validator_1 = __importDefault(require("validator"));
/**
 * Validate email format
 */
function validateEmail(email) {
    return validator_1.default.isEmail(email);
}
/**
 * Validate and sanitize user input
 */
function validateUserRegistration(data) {
    const errors = [];
    // Email validation
    if (!data.email) {
        errors.push({ field: 'email', message: 'Email is required' });
    }
    else if (!validateEmail(data.email)) {
        errors.push({ field: 'email', message: 'Please provide a valid email address' });
    }
    // Name validation
    if (!data.name) {
        errors.push({ field: 'name', message: 'Name is required' });
    }
    else if (data.name.length < 2) {
        errors.push({ field: 'name', message: 'Name must be at least 2 characters long' });
    }
    else if (data.name.length > 100) {
        errors.push({ field: 'name', message: 'Name must not exceed 100 characters' });
    }
    // Password validation
    if (!data.password) {
        errors.push({ field: 'password', message: 'Password is required' });
    }
    else if (data.password.length < 8) {
        errors.push({ field: 'password', message: 'Password must be at least 8 characters long' });
    }
    // Company validation (optional)
    if (data.company && data.company.length > 100) {
        errors.push({ field: 'company', message: 'Company name must not exceed 100 characters' });
    }
    return errors;
}
/**
 * Validate login input
 */
function validateUserLogin(data) {
    const errors = [];
    if (!data.email) {
        errors.push({ field: 'email', message: 'Email is required' });
    }
    else if (!validateEmail(data.email)) {
        errors.push({ field: 'email', message: 'Please provide a valid email address' });
    }
    if (!data.password) {
        errors.push({ field: 'password', message: 'Password is required' });
    }
    return errors;
}
/**
 * Sanitize string input
 */
function sanitizeString(input) {
    return validator_1.default.escape(input.trim());
}
/**
 * Validate organization slug
 */
function validateSlug(slug) {
    // Only allow alphanumeric characters and hyphens
    return /^[a-z0-9-]+$/.test(slug) && slug.length >= 3 && slug.length <= 50;
}
/**
 * Generate a random slug from name
 */
function generateSlug(name) {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single
        .trim()
        .substring(0, 50); // Limit length
}
/**
 * Validate UUID format
 */
function isValidUUID(uuid) {
    return validator_1.default.isUUID(uuid);
}
//# sourceMappingURL=validation.js.map