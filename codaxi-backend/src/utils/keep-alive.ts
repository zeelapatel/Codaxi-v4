import axios from 'axios';
import { config } from '../config';

export class KeepAliveService {
  private static instance: KeepAliveService;
  private interval: NodeJS.Timeout | null = null;
  private readonly INTERVAL_TIME = 10 * 60 * 1000; // 10 minutes

  private constructor() {}

  static getInstance(): KeepAliveService {
    if (!KeepAliveService.instance) {
      KeepAliveService.instance = new KeepAliveService();
    }
    return KeepAliveService.instance;
  }

  start(): void {
    if (this.interval) {
      return; // Already running
    }

    const pingServer = async () => {
      try {
        // In production, we want to ping localhost since we're pinging ourselves
        const url = process.env.NODE_ENV === 'production' 
          ? `http://localhost:${config.server.port}/api/health`
          : `${process.env.BACKEND_URL || `http://localhost:${config.server.port}`}/api/health`;
        
        await axios.get(url);
        console.log('Keep-alive ping successful at:', new Date().toISOString());
      } catch (error) {
        console.error('Keep-alive ping failed:', new Date().toISOString(), error);
      }
    };

    // Initial ping
    pingServer();

    // Set up interval
    this.interval = setInterval(pingServer, this.INTERVAL_TIME);
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}
