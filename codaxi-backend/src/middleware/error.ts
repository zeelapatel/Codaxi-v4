import { Request, Response, NextFunction } from 'express'
import { ApiError } from '../types'
import { sendError, sendInternalError } from '../utils/response'
import { isDevelopment } from '../config'

/**
 * Global error handler middleware
 */
export function errorHandler(
  error: Error | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log error
  console.error('Error:', {
    message: error.message,
    stack: isDevelopment ? error.stack : undefined,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  })

  // Handle known API errors
  if ('statusCode' in error && error.statusCode) {
    sendError(res, error.message, error.statusCode)
    return
  }

  // Handle Prisma errors
  if (error.name === 'PrismaClientKnownRequestError') {
    const prismaError = error as any
    
    switch (prismaError.code) {
      case 'P2002':
        // Unique constraint violation
        const field = prismaError.meta?.target?.[0] || 'field'
        sendError(res, `${field} already exists`, 409)
        return
      
      case 'P2025':
        // Record not found
        sendError(res, 'Record not found', 404)
        return
      
      default:
        sendInternalError(res, 'Database error occurred')
        return
    }
  }

  // Handle validation errors
  if (error.name === 'ValidationError') {
    sendError(res, error.message, 400)
    return
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    sendError(res, 'Invalid token', 401)
    return
  }

  if (error.name === 'TokenExpiredError') {
    sendError(res, 'Token expired', 401)
    return
  }

  // Handle syntax errors
  if (error instanceof SyntaxError && 'status' in error && error.status === 400) {
    sendError(res, 'Invalid JSON format', 400)
    return
  }

  // Default to internal server error
  const message = isDevelopment ? error.message : 'Something went wrong'
  sendInternalError(res, message)
}

/**
 * 404 handler for unknown routes
 */
export function notFoundHandler(req: Request, res: Response): void {
  sendError(res, `Route ${req.method} ${req.path} not found`, 404)
}

/**
 * Create API error
 */
export function createApiError(message: string, statusCode: number = 400): ApiError {
  const error = new Error(message) as ApiError
  error.statusCode = statusCode
  error.isOperational = true
  return error
}

/**
 * Async error handler wrapper
 */
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}
