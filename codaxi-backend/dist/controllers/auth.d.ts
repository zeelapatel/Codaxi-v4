import { Request, Response } from 'express';
/**
 * Register a new user
 */
export declare const register: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Login user
 */
export declare const login: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Logout user
 */
export declare const logout: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Get current user profile
 */
export declare const getProfile: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Refresh JWT token
 */
export declare const refreshToken: (req: Request, res: Response, next: import("express").NextFunction) => void;
//# sourceMappingURL=auth.d.ts.map