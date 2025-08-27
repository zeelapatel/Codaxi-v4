"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.keepAliveService = void 0;
const database_1 = require("./database");
class KeepAliveService {
    constructor() {
        this.interval = null;
        this.KEEP_ALIVE_INTERVAL = 4 * 60 * 1000; // 4 minutes
    }
    static getInstance() {
        if (!KeepAliveService.instance) {
            KeepAliveService.instance = new KeepAliveService();
        }
        return KeepAliveService.instance;
    }
    start() {
        if (this.interval) {
            return; // Already running
        }
        // Perform initial check
        this.performKeepAlive();
        // Set up interval
        this.interval = setInterval(() => {
            this.performKeepAlive();
        }, this.KEEP_ALIVE_INTERVAL);
    }
    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }
    async performKeepAlive() {
        try {
            await database_1.db.healthCheck();
            if (process.env.NODE_ENV === 'development') {
                console.log('🔄 Keep-alive check performed');
            }
        }
        catch (error) {
            console.error('❌ Keep-alive check failed:', error);
        }
    }
}
exports.keepAliveService = KeepAliveService.getInstance();
//# sourceMappingURL=keep-alive.js.map