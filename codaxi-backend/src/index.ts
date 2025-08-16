import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { config, isDevelopment } from './config'
import { db } from './utils/database'
import { errorHandler, notFoundHandler } from './middleware/error'
import { generalRateLimit, requestSizeLimit, corsHeaders } from './middleware/security'
import routes from './routes'

// Create Express app
const app = express()

// Trust proxy (for rate limiting and IP detection)
app.set('trust proxy', 1)

// Security middleware
app.use(helmet({
  contentSecurityPolicy: isDevelopment ? false : undefined,
  crossOriginEmbedderPolicy: false
}))

// CORS middleware
app.use(cors({
  origin: config.server.corsOrigin,
  credentials: true,
  optionsSuccessStatus: 200
}))

// Custom CORS headers
app.use(corsHeaders)

// Request logging
if (isDevelopment) {
  app.use(morgan('dev'))
} else {
  app.use(morgan('combined'))
}

// Request parsing middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Rate limiting
app.use(generalRateLimit)

// Request size limiting
app.use(requestSizeLimit())

// API routes
app.use('/api', routes)

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Codaxi Backend API',
    version: '1.0.0',
    description: 'Backend API for Codaxi - AI-powered documentation generator',
    environment: config.server.environment,
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      docs: 'https://docs.codaxi.dev' // Placeholder
    }
  })
})

// Error handling
app.use(notFoundHandler)
app.use(errorHandler)

// Start server
async function startServer() {
  try {
    // Connect to database
    await db.connect()
    
    // Start HTTP server
    const server = app.listen(config.server.port, () => {
      console.log(`
🚀 Codaxi Backend API is running!

📍 Environment: ${config.server.environment}
🌐 Server: http://localhost:${config.server.port}
🔗 Health Check: http://localhost:${config.server.port}/api/health
📊 Database: Connected
🔐 JWT Secret: ${config.jwt.secret.substring(0, 10)}...

Available Endpoints:
• POST /api/auth/register - Register new user
• POST /api/auth/login - User login
• POST /api/auth/logout - User logout
• GET  /api/auth/profile - Get user profile
• POST /api/auth/refresh - Refresh token
• GET  /api/health - Health check

Ready to accept requests! 🎉
      `)
    })

    // Graceful shutdown
    const gracefulShutdown = async () => {
      console.log('\n🔄 Shutting down gracefully...')
      
      server.close(async () => {
        try {
          await db.disconnect()
          console.log('✅ Server closed successfully')
          process.exit(0)
        } catch (error) {
          console.error('❌ Error during shutdown:', error)
          process.exit(1)
        }
      })
    }

    process.on('SIGTERM', gracefulShutdown)
    process.on('SIGINT', gracefulShutdown)

  } catch (error) {
    console.error('❌ Failed to start server:', error)
    process.exit(1)
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
  process.exit(1)
})

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error)
  process.exit(1)
})

// Start the server
startServer()
