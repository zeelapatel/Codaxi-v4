import { Request, Response, NextFunction } from 'express';
/**
 * Simple rate limiting middleware
 */
export declare function rateLimit(maxRequests?: number, windowMs?: number): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Clear rate limit store (for development)
 */
export declare function clearRateLimit(): void;
/**
 * Strict rate limiting for auth endpoints
 */
export declare const authRateLimit: (req: Request, res: Response, next: NextFunction) => void;
/**
 * General rate limiting
 */
export declare const generalRateLimit: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Request size limiting
 */
export declare function requestSizeLimit(maxSize?: number): (req: Request, res: Response, next: NextFunction) => void;
/**
 * CORS headers middleware
 */
export declare function corsHeaders(req: Request, res: Response, next: NextFunction): void;
//# sourceMappingURL=security.d.ts.map