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
        const baseUrl = process.env.BACKEND_URL || `http://localhost:${config.server.port}`;
        await axios.get(`${baseUrl}/api/health`);
        console.log('Keep-alive ping successful');
      } catch (error) {
        console.error('Keep-alive ping failed:', error);
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
