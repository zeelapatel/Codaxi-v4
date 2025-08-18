import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../types';
/**
 * Global error handler middleware
 */
export declare function errorHandler(error: Error | ApiError, req: Request, res: Response, next: NextFunction): void;
/**
 * 404 handler for unknown routes
 */
export declare function notFoundHandler(req: Request, res: Response): void;
/**
 * Create API error
 */
export declare function createApiError(message: string, statusCode?: number): ApiError;
/**
 * Async error handler wrapper
 */
export declare function asyncHandler(fn: Function): (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=error.d.ts.map