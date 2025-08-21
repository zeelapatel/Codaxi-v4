"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isTest = exports.isProduction = exports.isDevelopment = exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
const requiredEnvVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'GITHUB_CLIENT_ID',
    'GITHUB_CLIENT_SECRET'
];
// Validate required environment variables
for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`);
    }
}
exports.config = {
    database: {
        url: process.env.DATABASE_URL
    },
    jwt: {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    },
    server: {
        port: parseInt(process.env.PORT || '5000', 10),
        environment: process.env.NODE_ENV || 'development',
        corsOrigin: process.env.FRONTEND_URL || 'http://localhost:3000',
        baseUrl: process.env.BACKEND_URL || 'http://localhost:5000'
    },
    github: {
        clientId: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        redirectUri: process.env.GITHUB_REDIRECT_URI || 'http://localhost:5000/api/github/auth/callback',
        webhookSecret: process.env.GITHUB_WEBHOOK_SECRET || 'your-webhook-secret'
    }
};
exports.isDevelopment = exports.config.server.environment === 'development';
exports.isProduction = exports.config.server.environment === 'production';
exports.isTest = exports.config.server.environment === 'test';
//# sourceMappingURL=index.js.map