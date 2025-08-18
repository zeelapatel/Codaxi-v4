"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
const client_1 = require("@prisma/client");
const config_1 = require("../config");
// Extend PrismaClient with custom functionality
class DatabaseClient extends client_1.PrismaClient {
    constructor() {
        super({
            log: config_1.isDevelopment ? ['query', 'info', 'warn', 'error'] : ['error'],
            errorFormat: 'pretty',
        });
    }
    async connect() {
        try {
            await this.$connect();
            console.log('✅ Database connected successfully');
        }
        catch (error) {
            console.error('❌ Database connection failed:', error);
            throw error;
        }
    }
    async disconnect() {
        try {
            await this.$disconnect();
            console.log('✅ Database disconnected successfully');
        }
        catch (error) {
            console.error('❌ Database disconnection failed:', error);
            throw error;
        }
    }
    async healthCheck() {
        try {
            await this.$queryRaw `SELECT 1`;
            return true;
        }
        catch {
            return false;
        }
    }
}
// Create and export a singleton instance
exports.db = new DatabaseClient();
// Graceful shutdown handling
process.on('beforeExit', async () => {
    await exports.db.disconnect();
});
process.on('SIGINT', async () => {
    await exports.db.disconnect();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    await exports.db.disconnect();
    process.exit(0);
});
//# sourceMappingURL=database.js.map