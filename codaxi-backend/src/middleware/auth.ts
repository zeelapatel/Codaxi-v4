import { Request, Response, NextFunction } from 'express'
import { AuthenticatedRequest, JwtUser } from '../types'
import { verifyToken, extractTokenFromHeader } from '../utils/jwt'
import { sendUnauthorized, sendForbidden } from '../utils/response'
import { db } from '../utils/database'

/**
 * Middleware to authenticate requests using JWT
 */
export async function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = extractTokenFromHeader(req.headers.authorization)

    if (!token) {
      sendUnauthorized(res, 'Access token is required')
      return
    }

    // Verify token
    const decoded = verifyToken(token)
    
    // Check if token is blacklisted (optional: implement token blacklisting)
    const session = await db.session.findUnique({
      where: { token },
      select: { isRevoked: true, expiresAt: true }
    })

    if (session?.isRevoked) {
      sendUnauthorized(res, 'Token has been revoked')
      return
    }

    // Verify user still exists
    const user = await db.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        emailVerified: true
      }
    })

    if (!user) {
      sendUnauthorized(res, 'User not found')
      return
    }

    // Attach user to request
    req.user = {
      userId: user.id,
      email: user.email,
      role: user.role as any,
      organizationId: decoded.organizationId
    }

    next()
  } catch (error) {
    console.error('Authentication error:', error)
    sendUnauthorized(res, 'Invalid or expired token')
  }
}

/**
 * Middleware to check if user has required role
 */
export function requireRole(roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendUnauthorized(res, 'Authentication required')
      return
    }

    if (!roles.includes(req.user.role)) {
      sendForbidden(res, 'Insufficient permissions')
      return
    }

    next()
  }
}

/**
 * Middleware to check if user is admin
 */
export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  requireRole(['ADMIN'])(req, res, next)
}

/**
 * Optional authentication middleware (doesn't fail if no token)
 */
export async function optionalAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = extractTokenFromHeader(req.headers.authorization)

    if (token) {
      const decoded = verifyToken(token)
      
      const user = await db.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          role: true,
          emailVerified: true
        }
      })

      if (user) {
        req.user = {
          userId: user.id,
          email: user.email,
          role: user.role as any,
          organizationId: decoded.organizationId
        }
      }
    }

    next()
  } catch (error) {
    // Silent fail for optional auth
    next()
  }
}
