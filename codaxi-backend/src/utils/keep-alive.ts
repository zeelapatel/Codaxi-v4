import { db } from './database'

class KeepAliveService {
  private static instance: KeepAliveService
  private interval: NodeJS.Timeout | null = null
  private readonly KEEP_ALIVE_INTERVAL = 4 * 60 * 1000 // 4 minutes

  private constructor() {}

  public static getInstance(): KeepAliveService {
    if (!KeepAliveService.instance) {
      KeepAliveService.instance = new KeepAliveService()
    }
    return KeepAliveService.instance
  }

  public start(): void {
    if (this.interval) {
      return // Already running
    }

    // Perform initial check
    this.performKeepAlive()

    // Set up interval
    this.interval = setInterval(() => {
      this.performKeepAlive()
    }, this.KEEP_ALIVE_INTERVAL)
  }

  public stop(): void {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }
  }

  private async performKeepAlive(): Promise<void> {
    try {
      await db.healthCheck()
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 Keep-alive check performed')
      }
    } catch (error) {
      console.error('❌ Keep-alive check failed:', error)
    }
  }
}

export const keepAliveService = KeepAliveService.getInstance()
