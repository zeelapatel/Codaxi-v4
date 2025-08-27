"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../utils/database");
const auth_1 = __importDefault(require("./auth"));
const github_1 = __importDefault(require("./github"));
const scan_1 = __importDefault(require("./scan"));
const docs_1 = __importDefault(require("./docs"));
const security_1 = require("../middleware/security");
const router = (0, express_1.Router)();
// Health check endpoint
router.get('/health', async (req, res) => {
    try {
        // Perform a lightweight DB operation to keep the instance alive
        const dbHealthy = await database_1.db.healthCheck();
        res.json({
            status: 'OK',
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
            version: '1.0.0',
            database: dbHealthy ? 'Connected' : 'Disconnected'
        });
    }
    catch (error) {
        res.status(500).json({
            status: 'Error',
            timestamp: new Date().toISOString(),
            error: 'Health check failed'
        });
    }
});
// Development endpoint to clear rate limits
if (process.env.NODE_ENV === 'development') {
    router.post('/dev/clear-rate-limits', (req, res) => {
        (0, security_1.clearRateLimit)();
        res.json({
            success: true,
            message: 'Rate limits cleared',
            timestamp: new Date().toISOString()
        });
    });
}
// API routes
router.use('/auth', auth_1.default);
router.use('/github', github_1.default);
router.use('/', scan_1.default);
router.use('/', docs_1.default);
exports.default = router;
//# sourceMappingURL=index.js.map