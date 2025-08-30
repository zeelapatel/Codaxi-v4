import { Router } from 'express'
import { db } from '../utils/database'
import authRoutes from './auth'
import githubRoutes from './github'
import googleRoutes from './google'
import scanRoutes from './scan'
import docsRoutes from './docs'
import { clearRateLimit } from '../middleware/security'

const router = Router()

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    // Perform a lightweight DB operation to keep the instance alive
    const dbHealthy = await db.healthCheck()
    
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      database: dbHealthy ? 'Connected' : 'Disconnected'
    })
  } catch (error) {
    res.status(500).json({
      status: 'Error',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    })
  }
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
router.use('/github', githubRoutes)
router.use('/google', googleRoutes)
router.use('/', scanRoutes)
router.use('/', docsRoutes)

export default router
