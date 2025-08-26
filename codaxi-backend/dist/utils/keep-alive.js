"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeepAliveService = void 0;
const axios_1 = __importDefault(require("axios"));
const config_1 = require("../config");
class KeepAliveService {
    constructor() {
        this.interval = null;
        this.INTERVAL_TIME = 10 * 60 * 1000; // 10 minutes
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
        const pingServer = async () => {
            try {
                // Always use internal URL to avoid routing loops
                const url = `http://localhost:${process.env.PORT || config_1.config.server.port}/api/health`;
                await axios_1.default.get(url);
                console.log('Keep-alive ping successful at:', new Date().toISOString());
            }
            catch (error) {
                console.error('Keep-alive ping failed:', new Date().toISOString(), error);
            }
        };
        // Initial ping
        pingServer();
        // Set up interval
        this.interval = setInterval(pingServer, this.INTERVAL_TIME);
    }
    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }
}
exports.KeepAliveService = KeepAliveService;
//# sourceMappingURL=keep-alive.js.map