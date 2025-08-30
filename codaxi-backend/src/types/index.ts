import { Request } from 'express'
import { JwtPayload } from 'jsonwebtoken'

// User types
export interface User {
  id: string
  email: string
  name: string
  company?: string
  role: UserRole
  avatar?: string
  emailVerified: boolean
  createdAt: Date
  updatedAt: Date
  lastLoginAt?: Date
}

export interface CreateUserInput {
  email: string
  name: string
  password: string
  company?: string
}

export interface LoginInput {
  email: string
  password: string
}

export interface UpdateUserInput {
  name?: string
  company?: string
  avatar?: string
}

export interface ChangePasswordInput {
  currentPassword: string
  newPassword: string
}

// Enums
export enum UserRole {
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  VIEWER = 'VIEWER'
}

export enum PlanType {
  FREE = 'FREE',
  TEAM = 'TEAM',
  ENTERPRISE = 'ENTERPRISE'
}

// JWT types
export interface JwtUser extends JwtPayload {
  userId: string
  email: string
  role: UserRole
  organizationId?: string
}

// Express request with user
export interface AuthenticatedRequest extends Request {
  user?: JwtUser
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data?: T
  errors?: ValidationError[]
  timestamp: string
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Error types
export interface ValidationError {
  field: string
  message: string
}

export interface ApiError extends Error {
  statusCode: number
  isOperational?: boolean
}

// Organization types
export interface Organization {
  id: string
  name: string
  slug: string
  description?: string
  planType: PlanType
  settings: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export interface CreateOrganizationInput {
  name: string
  slug: string
  description?: string
}

export interface OrganizationMember {
  id: string
  role: UserRole
  user: User
  organization: Organization
  createdAt: Date
  updatedAt: Date
}

// Session types
export interface Session {
  id: string
  userId: string
  token: string
  expiresAt: Date
  createdAt: Date
  isRevoked: boolean
}

// Email types
export interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

// Audit log types
export interface AuditLogEntry {
  userId?: string
  action: string
  resource?: string
  details?: Record<string, any>
  ipAddress?: string
  userAgent?: string
}

// Configuration types
export interface DatabaseConfig {
  url: string
}

export interface JwtConfig {
  secret: string
  expiresIn: string
}

export interface ServerConfig {
  port: number
  environment: string
  corsOrigin: string
  baseUrl: string
}

export interface GitHubConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
  webhookSecret: string
}

export interface GoogleConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
}

export interface AppConfig {
  database: DatabaseConfig
  jwt: JwtConfig
  server: ServerConfig
  github: GitHubConfig
  google: GoogleConfig
}
