import { Response } from 'express';
import { ValidationError } from '../types';
/**
 * Send a successful API response
 */
export declare function sendSuccess<T>(res: Response, data?: T, message?: string, statusCode?: number): void;
/**
 * Send an error API response
 */
export declare function sendError(res: Response, message: string, statusCode?: number, errors?: ValidationError[]): void;
/**
 * Send a paginated API response
 */
export declare function sendPaginated<T>(res: Response, data: T[], page: number, limit: number, total: number, message?: string): void;
/**
 * Send validation error response
 */
export declare function sendValidationError(res: Response, errors: ValidationError[]): void;
/**
 * Send not found error response
 */
export declare function sendNotFound(res: Response, resource?: string): void;
/**
 * Send unauthorized error response
 */
export declare function sendUnauthorized(res: Response, message?: string): void;
/**
 * Send forbidden error response
 */
export declare function sendForbidden(res: Response, message?: string): void;
/**
 * Send internal server error response
 */
export declare function sendInternalError(res: Response, message?: string): void;
//# sourceMappingURL=response.d.ts.map