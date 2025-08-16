import validator from 'validator'
import { ValidationError } from '../types'

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  return validator.isEmail(email)
}

/**
 * Validate and sanitize user input
 */
export function validateUserRegistration(data: {
  email: string
  name: string
  password: string
  company?: string
}): ValidationError[] {
  const errors: ValidationError[] = []

  // Email validation
  if (!data.email) {
    errors.push({ field: 'email', message: 'Email is required' })
  } else if (!validateEmail(data.email)) {
    errors.push({ field: 'email', message: 'Please provide a valid email address' })
  }

  // Name validation
  if (!data.name) {
    errors.push({ field: 'name', message: 'Name is required' })
  } else if (data.name.length < 2) {
    errors.push({ field: 'name', message: 'Name must be at least 2 characters long' })
  } else if (data.name.length > 100) {
    errors.push({ field: 'name', message: 'Name must not exceed 100 characters' })
  }

  // Password validation
  if (!data.password) {
    errors.push({ field: 'password', message: 'Password is required' })
  } else if (data.password.length < 8) {
    errors.push({ field: 'password', message: 'Password must be at least 8 characters long' })
  }

  // Company validation (optional)
  if (data.company && data.company.length > 100) {
    errors.push({ field: 'company', message: 'Company name must not exceed 100 characters' })
  }

  return errors
}

/**
 * Validate login input
 */
export function validateUserLogin(data: {
  email: string
  password: string
}): ValidationError[] {
  const errors: ValidationError[] = []

  if (!data.email) {
    errors.push({ field: 'email', message: 'Email is required' })
  } else if (!validateEmail(data.email)) {
    errors.push({ field: 'email', message: 'Please provide a valid email address' })
  }

  if (!data.password) {
    errors.push({ field: 'password', message: 'Password is required' })
  }

  return errors
}

/**
 * Sanitize string input
 */
export function sanitizeString(input: string): string {
  return validator.escape(input.trim())
}

/**
 * Validate organization slug
 */
export function validateSlug(slug: string): boolean {
  // Only allow alphanumeric characters and hyphens
  return /^[a-z0-9-]+$/.test(slug) && slug.length >= 3 && slug.length <= 50
}

/**
 * Generate a random slug from name
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim()
    .substring(0, 50) // Limit length
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  return validator.isUUID(uuid)
}
