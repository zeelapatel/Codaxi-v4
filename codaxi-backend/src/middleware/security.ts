import { Request, Response, NextFunction } from 'express'
import { sendError } from '../utils/response'

/**
 * Rate limiting store (in production, use Redis)
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

/**
 * Simple rate limiting middleware
 */
export function rateLimit(maxRequests: number = 100, windowMs: number = 15 * 60 * 1000) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const clientId = req.ip || 'unknown'
    const now = Date.now()
    const resetTime = now + windowMs

    // Clean expired entries
    for (const [key, value] of rateLimitStore.entries()) {
      if (value.resetTime < now) {
        rateLimitStore.delete(key)
      }
    }

    // Get or create client record
    let clientRecord = rateLimitStore.get(clientId)
    if (!clientRecord || clientRecord.resetTime < now) {
      clientRecord = { count: 0, resetTime }
      rateLimitStore.set(clientId, clientRecord)
    }

    // Check rate limit
    if (clientRecord.count >= maxRequests) {
      res.set({
        'X-RateLimit-Limit': maxRequests.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': Math.ceil(clientRecord.resetTime / 1000).toString()
      })
      
      sendError(res, 'Too many requests', 429)
      return
    }

    // Increment count
    clientRecord.count++

    // Set rate limit headers
    res.set({
      'X-RateLimit-Limit': maxRequests.toString(),
      'X-RateLimit-Remaining': (maxRequests - clientRecord.count).toString(),
      'X-RateLimit-Reset': Math.ceil(clientRecord.resetTime / 1000).toString()
    })

    next()
  }
}

/**
 * Clear rate limit store (for development)
 */
export function clearRateLimit(): void {
  rateLimitStore.clear()
}

/**
 * Strict rate limiting for auth endpoints
 */
export const authRateLimit = rateLimit(50, 15 * 60 * 1000) // 50 requests per 15 minutes (increased for development)

/**
 * General rate limiting
 */
export const generalRateLimit = rateLimit(100, 15 * 60 * 1000) // 100 requests per 15 minutes

/**
 * Request size limiting
 */
export function requestSizeLimit(maxSize: number = 1024 * 1024) { // 1MB default
  return (req: Request, res: Response, next: NextFunction): void => {
    const contentLength = parseInt(req.get('content-length') || '0', 10)
    
    if (contentLength > maxSize) {
      sendError(res, 'Request entity too large', 413)
      return
    }

    next()
  }
}

/**
 * CORS headers middleware
 */
export function corsHeaders(req: Request, res: Response, next: NextFunction): void {
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    process.env.FRONTEND_URL
  ].filter(Boolean)

  const origin = req.get('Origin')
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Max-Age', '86400') // 24 hours

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  next()
}
