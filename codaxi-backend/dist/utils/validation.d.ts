import { ValidationError } from '../types';
/**
 * Validate email format
 */
export declare function validateEmail(email: string): boolean;
/**
 * Validate and sanitize user input
 */
export declare function validateUserRegistration(data: {
    email: string;
    name: string;
    password: string;
    company?: string;
}): ValidationError[];
/**
 * Validate login input
 */
export declare function validateUserLogin(data: {
    email: string;
    password: string;
}): ValidationError[];
/**
 * Sanitize string input
 */
export declare function sanitizeString(input: string): string;
/**
 * Validate organization slug
 */
export declare function validateSlug(slug: string): boolean;
/**
 * Generate a random slug from name
 */
export declare function generateSlug(name: string): string;
/**
 * Validate UUID format
 */
export declare function isValidUUID(uuid: string): boolean;
//# sourceMappingURL=validation.d.ts.map