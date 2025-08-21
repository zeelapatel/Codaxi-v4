/**
 * Hash a password using bcrypt
 */
export declare function hashPassword(password: string): Promise<string>;
/**
 * Compare a plain text password with a hashed password
 */
export declare function comparePassword(password: string, hashedPassword: string): Promise<boolean>;
/**
 * Validate password strength
 */
export declare function validatePassword(password: string): {
    isValid: boolean;
    errors: string[];
};
//# sourceMappingURL=password.d.ts.map