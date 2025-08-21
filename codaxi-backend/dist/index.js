"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const config_1 = require("./config");
const database_1 = require("./utils/database");
const error_1 = require("./middleware/error");
const security_1 = require("./middleware/security");
const routes_1 = __importDefault(require("./routes"));
// Create Express app
const app = (0, express_1.default)();
// Trust proxy (for rate limiting and IP detection)
app.set('trust proxy', 1);
// Security middleware
app.use((0, helmet_1.default)({
    contentSecurityPolicy: config_1.isDevelopment ? false : undefined,
    crossOriginEmbedderPolicy: false
}));
// CORS middleware
app.use((0, cors_1.default)({
    origin: config_1.config.server.corsOrigin,
    credentials: true,
    optionsSuccessStatus: 200
}));
// Custom CORS headers
app.use(security_1.corsHeaders);
// Request logging
if (config_1.isDevelopment) {
    app.use((0, morgan_1.default)('dev'));
}
else {
    app.use((0, morgan_1.default)('combined'));
}
// Request parsing middleware
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Rate limiting is applied per-route in routes/index.ts (GitHub endpoints only),
// to avoid throttling internal APIs and dev SSE streams
// Request size limiting
app.use((0, security_1.requestSizeLimit)());
// API routes
app.use('/api', routes_1.default);
// Root endpoint
app.get('/', (req, res) => {
    res.json({
        name: 'Codaxi Backend API',
        version: '1.0.0',
        description: 'Backend API for Codaxi - AI-powered documentation generator',
        environment: config_1.config.server.environment,
        timestamp: new Date().toISOString(),
        endpoints: {
            health: '/api/health',
            auth: '/api/auth',
            docs: 'https://docs.codaxi.dev' // Placeholder
        }
    });
});
// Error handling
app.use(error_1.notFoundHandler);
app.use(error_1.errorHandler);
// Start server
async function startServer() {
    try {
        // Connect to database
        await database_1.db.connect();
        // Start HTTP server
        const server = app.listen(config_1.config.server.port, () => {
            console.log(`
🚀 Codaxi Backend API is running!

📍 Environment: ${config_1.config.server.environment}
🌐 Server: http://localhost:${config_1.config.server.port}
🔗 Health Check: http://localhost:${config_1.config.server.port}/api/health
📊 Database: Connected
🔐 JWT Secret: ${config_1.config.jwt.secret.substring(0, 10)}...

Available Endpoints:
• POST /api/auth/register - Register new user
• POST /api/auth/login - User login
• POST /api/auth/logout - User logout
• GET  /api/auth/profile - Get user profile
• POST /api/auth/refresh - Refresh token
• GET  /api/health - Health check

Ready to accept requests! 🎉
      `);
        });
        // Graceful shutdown
        const gracefulShutdown = async () => {
            console.log('\n🔄 Shutting down gracefully...');
            server.close(async () => {
                try {
                    await database_1.db.disconnect();
                    console.log('✅ Server closed successfully');
                    process.exit(0);
                }
                catch (error) {
                    console.error('❌ Error during shutdown:', error);
                    process.exit(1);
                }
            });
        };
        process.on('SIGTERM', gracefulShutdown);
        process.on('SIGINT', gracefulShutdown);
    }
    catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}
// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});
// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});
// Start the server
startServer();
//# sourceMappingURL=index.js.map