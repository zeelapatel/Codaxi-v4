"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = __importDefault(require("./auth"));
const github_1 = __importDefault(require("./github"));
const scan_1 = __importDefault(require("./scan"));
const security_1 = require("../middleware/security");
const router = (0, express_1.Router)();
// Health check endpoint
router.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0'
    });
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
exports.default = router;
//# sourceMappingURL=index.js.map