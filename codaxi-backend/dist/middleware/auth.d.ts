import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
/**
 * Middleware to authenticate requests using JWT
 */
export declare function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
/**
 * Middleware to check if user has required role
 */
export declare function requireRole(roles: string[]): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
/**
 * Middleware to check if user is admin
 */
export declare function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void;
/**
 * Optional authentication middleware (doesn't fail if no token)
 */
export declare function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=auth.d.ts.map