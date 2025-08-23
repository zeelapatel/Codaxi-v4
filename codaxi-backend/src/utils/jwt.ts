import jwt, { SignOptions } from 'jsonwebtoken'
import { config } from '../config'
import { JwtUser } from '../types'

/**
 * Generate a JWT token for a user
 */
export function generateToken(payload: Omit<JwtUser, 'iat' | 'exp'>): string {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn
  } as SignOptions)
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): JwtUser {
  return jwt.verify(token, config.jwt.secret) as JwtUser
}

/**
 * Decode a JWT token without verification (for expired token info)
 */
export function decodeToken(token: string): JwtUser | null {
  try {
    return jwt.decode(token) as JwtUser
  } catch {
    return null
  }
}

/**
 * Check if a token is expired
 */
export function isTokenExpired(token: string): boolean {
  try {
    const decoded = jwt.decode(token) as any
    if (!decoded || !decoded.exp) return true
    
    const currentTime = Math.floor(Date.now() / 1000)
    return decoded.exp < currentTime
  } catch {
    return true
  }
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  
  return authHeader.substring(7) // Remove 'Bearer ' prefix
}
