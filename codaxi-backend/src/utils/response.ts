import { Response } from 'express'
import { ApiResponse, PaginatedResponse, ValidationError } from '../types'

/**
 * Send a successful API response
 */
export function sendSuccess<T>(
  res: Response,
  data?: T,
  message?: string,
  statusCode: number = 200
): void {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  }

  res.status(statusCode).json(response)
}

/**
 * Send an error API response
 */
export function sendError(
  res: Response,
  message: string,
  statusCode: number = 400,
  errors?: ValidationError[]
): void {
  const response: ApiResponse = {
    success: false,
    message,
    errors,
    timestamp: new Date().toISOString()
  }

  res.status(statusCode).json(response)
}

/**
 * Send a paginated API response
 */
export function sendPaginated<T>(
  res: Response,
  data: T[],
  page: number,
  limit: number,
  total: number,
  message?: string
): void {
  const totalPages = Math.ceil(total / limit)
  
  const response: PaginatedResponse<T> = {
    success: true,
    message,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages
    },
    timestamp: new Date().toISOString()
  }

  res.status(200).json(response)
}

/**
 * Send validation error response
 */
export function sendValidationError(
  res: Response,
  errors: ValidationError[]
): void {
  sendError(res, 'Validation failed', 400, errors)
}

/**
 * Send not found error response
 */
export function sendNotFound(
  res: Response,
  resource: string = 'Resource'
): void {
  sendError(res, `${resource} not found`, 404)
}

/**
 * Send unauthorized error response
 */
export function sendUnauthorized(
  res: Response,
  message: string = 'Unauthorized access'
): void {
  sendError(res, message, 401)
}

/**
 * Send forbidden error response
 */
export function sendForbidden(
  res: Response,
  message: string = 'Access forbidden'
): void {
  sendError(res, message, 403)
}

/**
 * Send internal server error response
 */
export function sendInternalError(
  res: Response,
  message: string = 'Internal server error'
): void {
  sendError(res, message, 500)
}
