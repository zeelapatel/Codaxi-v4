import dotenv from 'dotenv'
import { AppConfig } from '../types'

// Load environment variables, preferring .env over machine/global env for local dev
dotenv.config({ override: true })

const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'GITHUB_CLIENT_ID',
  'GITHUB_CLIENT_SECRET'
]

// Validate required environment variables
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`)
  }
}

export const config: AppConfig = {
  database: {
    url: process.env.DATABASE_URL!
  },
  jwt: {
    secret: process.env.JWT_SECRET!,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },
  server: {
    port: parseInt(process.env.PORT || '5000', 10),
    environment: process.env.NODE_ENV || 'development',
    corsOrigin: process.env.FRONTEND_URL || 'http://localhost:3000',
    baseUrl: process.env.BACKEND_URL || 'http://localhost:5000'
  },
  github: {
    clientId: process.env.GITHUB_CLIENT_ID!,
    clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    redirectUri: process.env.GITHUB_REDIRECT_URI || 'http://localhost:5000/api/github/auth/callback',
    webhookSecret: process.env.GITHUB_WEBHOOK_SECRET || 'your-webhook-secret'
  }
}

export const isDevelopment = config.server.environment === 'development'
export const isProduction = config.server.environment === 'production'
export const isTest = config.server.environment === 'test'
