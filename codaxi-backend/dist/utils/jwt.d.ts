import { JwtUser } from '../types';
/**
 * Generate a JWT token for a user
 */
export declare function generateToken(payload: Omit<JwtUser, 'iat' | 'exp'>): string;
/**
 * Verify and decode a JWT token
 */
export declare function verifyToken(token: string): JwtUser;
/**
 * Decode a JWT token without verification (for expired token info)
 */
export declare function decodeToken(token: string): JwtUser | null;
/**
 * Check if a token is expired
 */
export declare function isTokenExpired(token: string): boolean;
/**
 * Extract token from Authorization header
 */
export declare function extractTokenFromHeader(authHeader: string | undefined): string | null;
//# sourceMappingURL=jwt.d.ts.map