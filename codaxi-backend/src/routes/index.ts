import { Router } from 'express'
import authRoutes from './auth'
import { clearRateLimit } from '../middleware/security'

const router = Router()

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  })
})

// Development endpoint to clear rate limits
if (process.env.NODE_ENV === 'development') {
  router.post('/dev/clear-rate-limits', (req, res) => {
    clearRateLimit()
    res.json({
      success: true,
      message: 'Rate limits cleared',
      timestamp: new Date().toISOString()
    })
  })
}

// API routes
router.use('/auth', authRoutes)

export default router
