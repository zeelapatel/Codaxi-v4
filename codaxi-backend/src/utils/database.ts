import { PrismaClient } from '@prisma/client'
import { isDevelopment } from '../config'

// Extend PrismaClient with custom functionality
class DatabaseClient extends PrismaClient {
  constructor() {
    super({
      log: isDevelopment ? ['query', 'info', 'warn', 'error'] : ['error'],
      errorFormat: 'pretty',
    })
  }

  async connect(): Promise<void> {
    try {
      await this.$connect()
      console.log('✅ Database connected successfully')
    } catch (error) {
      console.error('❌ Database connection failed:', error)
      throw error
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.$disconnect()
      console.log('✅ Database disconnected successfully')
    } catch (error) {
      console.error('❌ Database disconnection failed:', error)
      throw error
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`
      return true
    } catch {
      return false
    }
  }
}

// Create and export a singleton instance
export const db = new DatabaseClient()

// Graceful shutdown handling
process.on('beforeExit', async () => {
  await db.disconnect()
})

process.on('SIGINT', async () => {
  await db.disconnect()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  await db.disconnect()
  process.exit(0)
})
