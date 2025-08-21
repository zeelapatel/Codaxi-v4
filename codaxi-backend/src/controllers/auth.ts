import { Request, Response } from 'express'
import { AuthenticatedRequest, CreateUserInput, LoginInput, UserRole } from '../types'
import { hashPassword, comparePassword } from '../utils/password'
import { generateToken } from '../utils/jwt'
import { validateUserRegistration, validateUserLogin, generateSlug } from '../utils/validation'
import { sendSuccess, sendError, sendValidationError } from '../utils/response'
import { asyncHandler, createApiError } from '../middleware/error'
import { db } from '../utils/database'

/**
 * Register a new user
 */
export const register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { email, name, password, company }: CreateUserInput = req.body

  // Validate input
  const validationErrors = validateUserRegistration({ email, name, password, company })
  if (validationErrors.length > 0) {
    sendValidationError(res, validationErrors)
    return
  }

  // Check if user already exists
  const existingUser = await db.user.findUnique({
    where: { email: email.toLowerCase() }
  })

  if (existingUser) {
    sendError(res, 'User with this email already exists', 409)
    return
  }

  // Hash password
  const hashedPassword = await hashPassword(password)

  // Create user
  const user = await db.user.create({
    data: {
      email: email.toLowerCase(),
      name: name.trim(),
      password: hashedPassword,
      company: company?.trim() || null,
      role: UserRole.MEMBER
    },
    select: {
      id: true,
      email: true,
      name: true,
      company: true,
      role: true,
      emailVerified: true,
      createdAt: true
    }
  })

  // Create default organization for the user
  const organizationSlug = generateSlug(company || name)
  const organization = await db.organization.create({
    data: {
      name: company || `${name}'s Organization`,
      slug: organizationSlug,
      description: `Organization for ${name}`,
      members: {
        create: {
          userId: user.id,
          role: UserRole.ADMIN
        }
      }
    }
  })

  // Generate JWT token
  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role as UserRole,
    organizationId: organization.id
  })

  // Create session record
  await db.session.create({
    data: {
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    }
  })

  // Log audit event
  await db.auditLog.create({
    data: {
      userId: user.id,
      action: 'USER_REGISTERED',
      details: { email: user.email, name: user.name },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    }
  })

  sendSuccess(res, {
    user,
    token,
    organization: {
      id: organization.id,
      name: organization.name,
      slug: organization.slug
    }
  }, 'Account created successfully', 201)
})

/**
 * Login user
 */
export const login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { email, password }: LoginInput = req.body

  // Validate input
  const validationErrors = validateUserLogin({ email, password })
  if (validationErrors.length > 0) {
    sendValidationError(res, validationErrors)
    return
  }

  // Find user
  const user = await db.user.findUnique({
    where: { email: email.toLowerCase() },
    include: {
      organizations: {
        include: {
          organization: true
        },
        where: {
          role: UserRole.ADMIN
        },
        take: 1
      }
    }
  })

  if (!user) {
    sendError(res, 'Invalid email or password', 401)
    return
  }

  // Check password
  const isValidPassword = await comparePassword(password, user.password)
  if (!isValidPassword) {
    sendError(res, 'Invalid email or password', 401)
    return
  }

  // Get user's primary organization
  const primaryOrganization = user.organizations[0]?.organization

  // Generate JWT token
  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role as UserRole,
    organizationId: primaryOrganization?.id
  })

  // Create session record
  await db.session.create({
    data: {
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    }
  })

  // Update last login
  await db.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() }
  })

  // Log audit event
  await db.auditLog.create({
    data: {
      userId: user.id,
      action: 'USER_LOGIN',
      details: { email: user.email },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    }
  })

  // Return user data without password
  const { password: _, ...userWithoutPassword } = user

  sendSuccess(res, {
    user: userWithoutPassword,
    token,
    organization: primaryOrganization ? {
      id: primaryOrganization.id,
      name: primaryOrganization.name,
      slug: primaryOrganization.slug,
      planType: primaryOrganization.planType
    } : null
  }, 'Login successful')
})

/**
 * Logout user
 */
export const logout = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const token = req.headers.authorization?.replace('Bearer ', '')
  
  if (token) {
    // Revoke the session
    await db.session.updateMany({
      where: { token },
      data: { isRevoked: true }
    })

    // Log audit event
    if (req.user) {
      await db.auditLog.create({
        data: {
          userId: req.user.userId,
          action: 'USER_LOGOUT',
          details: { email: req.user.email },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }
      })
    }
  }

  sendSuccess(res, null, 'Logout successful')
})

/**
 * Get current user profile
 */
export const getProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw createApiError('Authentication required', 401)
  }

  const user = await db.user.findUnique({
    where: { id: req.user.userId },
    select: {
      id: true,
      email: true,
      name: true,
      company: true,
      role: true,
      avatar: true,
      emailVerified: true,
      createdAt: true,
      updatedAt: true,
      lastLoginAt: true
    }
  })

  if (!user) {
    throw createApiError('User not found', 404)
  }

  sendSuccess(res, user)
})

/**
 * Refresh JWT token
 */
export const refreshToken = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw createApiError('Authentication required', 401)
  }

  // Generate new token
  const newToken = generateToken({
    userId: req.user.userId,
    email: req.user.email,
    role: req.user.role,
    organizationId: req.user.organizationId
  })

  // Create new session record
  await db.session.create({
    data: {
      userId: req.user.userId,
      token: newToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    }
  })

  // Optionally revoke old token
  const oldToken = req.headers.authorization?.replace('Bearer ', '')
  if (oldToken) {
    await db.session.updateMany({
      where: { token: oldToken },
      data: { isRevoked: true }
    })
  }

  sendSuccess(res, { token: newToken }, 'Token refreshed successfully')
})
