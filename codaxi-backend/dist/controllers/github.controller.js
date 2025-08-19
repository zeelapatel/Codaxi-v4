"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitHubController = void 0;
const github_service_1 = require("../services/github.service");
const response_1 = require("../utils/response");
const config_1 = require("../config");
const client_1 = require("@prisma/client");
const crypto_1 = __importDefault(require("crypto"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const prisma = new client_1.PrismaClient();
// Initialize GitHub service with config
const githubService = new github_service_1.GitHubService({
    clientId: config_1.config.github.clientId,
    clientSecret: config_1.config.github.clientSecret,
    redirectUri: config_1.config.github.redirectUri,
    scope: 'repo user'
});
class GitHubController {
    /**
     * Generate OAuth authorization URL
     */
    static async generateAuthUrl(req, res) {
        try {
            const { userId } = req.user;
            const state = crypto_1.default.randomBytes(32).toString('hex');
            // Store state for verification
            await prisma.gitHubOAuthState.create({
                data: {
                    id: state,
                    userId,
                    expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
                }
            });
            const authUrl = githubService.generateAuthUrl(state);
            (0, response_1.sendSuccess)(res, { authUrl, state }, 'GitHub authorization URL generated');
        }
        catch (error) {
            console.error('Error generating auth URL:', error);
            (0, response_1.sendError)(res, 'Failed to generate authorization URL', 500);
        }
    }
    /**
     * Handle OAuth callback
     */
    static async handleOAuthCallback(req, res) {
        try {
            const { code, state } = req.method === 'GET' ? req.query : req.body;
            if (!code || !state) {
                return (0, response_1.sendError)(res, 'Missing authorization code or state', 400);
            }
            // Verify state
            const storedState = await prisma.gitHubOAuthState.findUnique({
                where: { id: state }
            });
            if (!storedState || storedState.expiresAt < new Date()) {
                return (0, response_1.sendError)(res, 'Invalid or expired state parameter', 400);
            }
            // Clean up used state
            await prisma.gitHubOAuthState.delete({
                where: { id: state }
            });
            // Exchange code for token
            const tokenResponse = await githubService.exchangeCodeForToken(code);
            // Get GitHub user info
            const githubUser = await githubService.getAuthenticatedUser(tokenResponse.access_token);
            // Check if connection already exists
            let connection = await prisma.gitHubConnection.findFirst({
                where: {
                    userId: storedState.userId,
                    githubUserId: githubUser.id
                }
            });
            if (connection) {
                // Update existing connection
                connection = await prisma.gitHubConnection.update({
                    where: { id: connection.id },
                    data: {
                        accessToken: tokenResponse.access_token,
                        refreshToken: tokenResponse.refresh_token || connection.refreshToken,
                        tokenExpiresAt: tokenResponse.expires_in
                            ? new Date(Date.now() + tokenResponse.expires_in * 1000)
                            : undefined,
                        scope: tokenResponse.scope,
                        isActive: true,
                        updatedAt: new Date()
                    }
                });
            }
            else {
                // Create new connection
                connection = await prisma.gitHubConnection.create({
                    data: {
                        userId: storedState.userId,
                        githubUserId: githubUser.id,
                        githubUsername: githubUser.login,
                        accessToken: tokenResponse.access_token,
                        refreshToken: tokenResponse.refresh_token,
                        tokenExpiresAt: tokenResponse.expires_in
                            ? new Date(Date.now() + tokenResponse.expires_in * 1000)
                            : undefined,
                        scope: tokenResponse.scope,
                        isActive: true
                    }
                });
            }
            // Redirect back to frontend with success
            res.redirect(302, `${config_1.config.server.corsOrigin}/onboarding?github=success`);
        }
        catch (error) {
            console.error('Error handling OAuth callback:', error);
            // Redirect back to frontend with error
            res.redirect(302, `${config_1.config.server.corsOrigin}/onboarding?github=error`);
        }
    }
    /**
     * Get user's GitHub repositories
     */
    static async getUserRepositories(req, res) {
        try {
            console.log('[GitHubController] Getting repositories for user');
            const { userId } = req.user;
            // Get user's GitHub connection
            console.log('[GitHubController] Finding GitHub connection for user:', userId);
            const connection = await prisma.gitHubConnection.findFirst({
                where: {
                    userId,
                    isActive: true
                }
            });
            console.log('[GitHubController] GitHub connection found:', {
                found: !!connection,
                connectionId: connection?.id,
                githubUsername: connection?.githubUsername
            });
            if (!connection) {
                return (0, response_1.sendSuccess)(res, { repositories: [] }, 'No active GitHub connection found');
            }
            // Check if token is expired
            if (connection.tokenExpiresAt && connection.tokenExpiresAt < new Date()) {
                return (0, response_1.sendError)(res, 'GitHub access token expired. Please reconnect your account.', 401);
            }
            // Get repositories from GitHub
            console.log('[GitHubController] Fetching repositories from GitHub');
            const repositories = await githubService.getUserRepositories(connection.accessToken);
            console.log('[GitHubController] GitHub repositories fetched:', {
                count: repositories.length,
                repositories: repositories.map(r => ({ id: r.id, full_name: r.full_name }))
            });
            // Get connected repository IDs to exclude them
            console.log('[GitHubController] Finding already connected repositories');
            const connectedRepos = await prisma.gitHubRepositoryConnection.findMany({
                where: {
                    githubConnection: {
                        userId,
                        isActive: true
                    },
                    isActive: true
                },
                select: {
                    githubRepoId: true
                }
            });
            const connectedRepoIds = new Set(connectedRepos.map((r) => r.githubRepoId));
            console.log('[GitHubController] Connected repository IDs:', {
                count: connectedRepoIds.size,
                ids: Array.from(connectedRepoIds)
            });
            // Filter out already connected repositories; avoid extra per-repo GitHub calls here
            console.log('[GitHubController] Filtering repositories without enrichment to limit API usage');
            const availableRepos = repositories.filter(repo => !connectedRepoIds.has(repo.id));
            (0, response_1.sendSuccess)(res, { repositories: availableRepos }, 'GitHub repositories retrieved successfully');
        }
        catch (error) {
            console.error('Error getting repositories:', error);
            (0, response_1.sendError)(res, 'Failed to retrieve repositories', 500);
        }
    }
    /**
     * Connect a specific repository
     */
    static async connectRepository(req, res) {
        try {
            const { userId } = req.user;
            const { owner, repo } = req.body;
            if (!owner || !repo) {
                return (0, response_1.sendError)(res, 'Repository owner and name are required', 400);
            }
            // Get user's GitHub connection
            const connection = await prisma.gitHubConnection.findFirst({
                where: {
                    userId,
                    isActive: true
                }
            });
            if (!connection) {
                return (0, response_1.sendError)(res, 'No active GitHub connection found', 404);
            }
            // Check repository access
            const hasAccess = await githubService.checkRepositoryAccess(connection.accessToken, owner, repo);
            if (!hasAccess) {
                return (0, response_1.sendError)(res, 'No access to this repository', 403);
            }
            // Get repository details once and cache for future
            const repository = await githubService.getRepository(connection.accessToken, owner, repo);
            // Check if repository is already connected
            const existingConnection = await prisma.gitHubRepositoryConnection.findFirst({
                where: {
                    githubConnectionId: connection.id,
                    githubRepoId: repository.id
                }
            });
            if (existingConnection) {
                return (0, response_1.sendError)(res, 'Repository is already connected', 409);
            }
            // Create repository connection
            const repoConnection = await prisma.gitHubRepositoryConnection.create({
                data: {
                    githubConnectionId: connection.id,
                    repositoryId: crypto_1.default.randomUUID(), // Generate unique ID for our system
                    githubRepoId: repository.id,
                    githubRepoName: repository.name,
                    githubRepoFullName: repository.full_name,
                    isActive: true,
                    cachedRepo: repository
                }
            });
            // Download tarball once and cache to disk
            try {
                const storageDir = path_1.default.join(process.cwd(), 'storage', 'repos');
                fs_1.default.mkdirSync(storageDir, { recursive: true });
                const tarballPath = path_1.default.join(storageDir, `${repoConnection.repositoryId}.tar.gz`);
                const tarStream = await githubService.downloadTarball(connection.accessToken, owner, repo, repository.default_branch || 'main');
                await new Promise((resolve, reject) => {
                    const ws = fs_1.default.createWriteStream(tarballPath);
                    tarStream.pipe(ws);
                    ws.on('finish', () => resolve());
                    ws.on('error', reject);
                    tarStream.on('error', reject);
                });
                await prisma.gitHubRepositoryConnection.update({
                    where: { id: repoConnection.id },
                    data: { tarballFilePath: tarballPath, tarballUpdatedAt: new Date() }
                });
            }
            catch (e) {
                console.warn('Failed to cache tarball on connect:', e);
            }
            // Create webhook for the repository
            try {
                const webhookUrl = `${config_1.config.server.baseUrl}/api/github/webhook`;
                const webhookSecret = crypto_1.default.randomBytes(32).toString('hex');
                const webhook = await githubService.createWebhook(connection.accessToken, owner, repo, webhookUrl, webhookSecret);
                // Store webhook info
                await prisma.gitHubWebhook.create({
                    data: {
                        repositoryConnectionId: repoConnection.id,
                        webhookId: webhook.id,
                        webhookUrl: webhookUrl,
                        webhookSecret: webhookSecret,
                        isActive: true
                    }
                });
            }
            catch (webhookError) {
                console.error('Failed to create webhook:', webhookError);
                // Continue without webhook - user can retry later
            }
            (0, response_1.sendSuccess)(res, {
                repository,
                connection: repoConnection
            }, 'Repository connected successfully');
        }
        catch (error) {
            console.error('Error connecting repository:', error);
            (0, response_1.sendError)(res, 'Failed to connect repository', 500);
        }
    }
    /**
     * Disconnect a repository
     */
    static async disconnectRepository(req, res) {
        try {
            const { userId } = req.user;
            const { connectionId } = req.params;
            // Get repository connection
            const repoConnection = await prisma.gitHubRepositoryConnection.findFirst({
                where: {
                    id: connectionId,
                    githubConnection: {
                        userId
                    }
                },
                include: {
                    githubConnection: {
                        select: {
                            accessToken: true
                        }
                    },
                    webhooks: true
                }
            });
            if (!repoConnection) {
                return (0, response_1.sendError)(res, 'Repository connection not found', 404);
            }
            // Delete webhooks from GitHub
            for (const webhook of repoConnection.webhooks) {
                try {
                    await githubService.deleteWebhook(repoConnection.githubConnection.accessToken, repoConnection.githubRepoFullName.split('/')[0], repoConnection.githubRepoFullName.split('/')[1], webhook.webhookId);
                }
                catch (webhookError) {
                    console.error('Failed to delete webhook:', webhookError);
                }
            }
            // Delete webhook records
            await prisma.gitHubWebhook.deleteMany({
                where: {
                    repositoryConnectionId: connectionId
                }
            });
            // Delete repository connection
            await prisma.gitHubRepositoryConnection.delete({
                where: { id: connectionId }
            });
            (0, response_1.sendSuccess)(res, null, 'Repository disconnected successfully');
        }
        catch (error) {
            console.error('Error disconnecting repository:', error);
            (0, response_1.sendError)(res, 'Failed to disconnect repository', 500);
        }
    }
    /**
     * Get connected repositories
     */
    static async getConnectedRepositories(req, res) {
        try {
            const { userId } = req.user;
            const connections = await prisma.gitHubRepositoryConnection.findMany({
                where: {
                    githubConnection: {
                        userId,
                        isActive: true
                    },
                    isActive: true
                },
                include: {
                    githubConnection: {
                        select: {
                            githubUsername: true,
                            isActive: true,
                            accessToken: true
                        }
                    }
                }
            });
            // Return cached details only (no GitHub calls)
            const data = connections.map((c) => ({
                ...c,
                repository: c.cachedRepo || null,
                languages: c.cachedLanguages ? Object.keys(c.cachedLanguages) : []
            }));
            (0, response_1.sendSuccess)(res, { connections: data }, 'Connected repositories retrieved successfully');
        }
        catch (error) {
            console.error('Error getting connected repositories:', error);
            (0, response_1.sendError)(res, 'Failed to retrieve connected repositories', 500);
        }
    }
    /**
     * Get repository details
     */
    static async getRepositoryDetails(req, res) {
        try {
            const { userId } = req.user;
            const { repoId } = req.params;
            const connection = await prisma.gitHubRepositoryConnection.findFirst({
                where: {
                    repositoryId: repoId,
                    githubConnection: {
                        userId,
                        isActive: true
                    },
                    isActive: true
                },
                include: {
                    githubConnection: {
                        select: {
                            accessToken: true
                        }
                    }
                }
            });
            if (!connection) {
                return (0, response_1.sendError)(res, 'Repository not found', 404);
            }
            // Get repository details from GitHub
            const [owner, repo] = connection.githubRepoFullName.split('/');
            const repository = await githubService.getRepository(connection.githubConnection.accessToken, owner, repo);
            // Get languages
            const languages = await githubService.getRepositoryLanguages(connection.githubConnection.accessToken, owner, repo);
            // Get last scan status from DB if available; fallback to in-memory, or null
            let lastScan = null;
            try {
                // @ts-ignore - prisma client may not have scan if generate hasn't run yet
                const lastScanRow = await prisma.scan.findFirst({
                    where: { repositoryId: connection.repositoryId },
                    orderBy: { updatedAt: 'desc' }
                });
                if (lastScanRow) {
                    lastScan = {
                        id: lastScanRow.id,
                        status: lastScanRow.status,
                        timestamp: (lastScanRow.completedAt || lastScanRow.startedAt).toISOString()
                    };
                }
            }
            catch (e) {
                // ignore
            }
            if (!lastScan) {
                try {
                    const { getInMemoryScanForRepo } = await Promise.resolve().then(() => __importStar(require('./scan.controller')));
                    const inMem = getInMemoryScanForRepo?.(connection.repositoryId);
                    if (inMem) {
                        lastScan = {
                            id: inMem.id,
                            status: inMem.status,
                            timestamp: (inMem.completedAt || inMem.startedAt)
                        };
                    }
                }
                catch { }
            }
            // Calculate docs freshness (mock for now)
            const docsFreshness = 85;
            (0, response_1.sendSuccess)(res, {
                id: connection.repositoryId,
                owner,
                name: repo,
                description: repository.description || '',
                languages: Object.keys(languages),
                docsFreshness,
                lastScan,
                isFavorite: false, // Mock for now
                updatedAt: repository.updated_at
            }, 'Repository details retrieved successfully');
        }
        catch (error) {
            console.error('Error getting repository details:', error);
            (0, response_1.sendError)(res, 'Failed to retrieve repository details', 500);
        }
    }
    /**
     * Handle GitHub webhook
     */
    static async handleWebhook(req, res) {
        try {
            const signature = req.headers['x-hub-signature-256'];
            const event = req.headers['x-github-event'];
            const delivery = req.headers['x-github-delivery'];
            if (!signature || !event || !delivery) {
                return (0, response_1.sendError)(res, 'Missing required webhook headers', 400);
            }
            // Verify webhook signature
            const payload = JSON.stringify(req.body);
            const expectedSignature = `sha256=${crypto_1.default
                .createHmac('sha256', config_1.config.github.webhookSecret)
                .update(payload)
                .digest('hex')}`;
            if (signature !== expectedSignature) {
                return (0, response_1.sendError)(res, 'Invalid webhook signature', 401);
            }
            // Process webhook based on event type
            switch (event) {
                case 'push':
                    await handlePushEvent(req.body);
                    break;
                case 'pull_request':
                    await handlePullRequestEvent(req.body);
                    break;
                default:
                    console.log(`Unhandled webhook event: ${event}`);
            }
            res.status(200).json({ received: true });
        }
        catch (error) {
            console.error('Error handling webhook:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    /**
     * Disconnect GitHub account
     */
    static async disconnectAccount(req, res) {
        try {
            const { userId } = req.user;
            // Get all repository connections
            const repoConnections = await prisma.gitHubRepositoryConnection.findMany({
                where: {
                    githubConnection: {
                        userId
                    }
                },
                include: {
                    githubConnection: {
                        select: {
                            accessToken: true
                        }
                    },
                    webhooks: true
                }
            });
            // Delete webhooks and repository connections
            for (const repoConnection of repoConnections) {
                // Delete webhooks from GitHub
                for (const webhook of repoConnection.webhooks) {
                    try {
                        await githubService.deleteWebhook(repoConnection.githubConnection.accessToken, repoConnection.githubRepoFullName.split('/')[0], repoConnection.githubRepoFullName.split('/')[1], webhook.webhookId);
                    }
                    catch (webhookError) {
                        console.error('Failed to delete webhook:', webhookError);
                    }
                }
                // Delete webhook records
                await prisma.gitHubWebhook.deleteMany({
                    where: {
                        repositoryConnectionId: repoConnection.id
                    }
                });
            }
            // Delete repository connections
            await prisma.gitHubRepositoryConnection.deleteMany({
                where: {
                    githubConnection: {
                        userId
                    }
                }
            });
            // Delete GitHub connection
            await prisma.gitHubConnection.deleteMany({
                where: { userId }
            });
            (0, response_1.sendSuccess)(res, null, 'GitHub account disconnected successfully');
        }
        catch (error) {
            console.error('Error disconnecting account:', error);
            (0, response_1.sendError)(res, 'Failed to disconnect GitHub account', 500);
        }
    }
}
exports.GitHubController = GitHubController;
// Helper functions for webhook processing
async function handlePushEvent(payload) {
    console.log('Processing push event for repository:', payload.repository.full_name);
    // TODO: Implement repository scanning and documentation generation
    // This would involve:
    // 1. Finding the repository connection
    // 2. Queuing a scan job
    // 3. Processing the changes
}
async function handlePullRequestEvent(payload) {
    console.log('Processing pull request event for repository:', payload.repository.full_name);
    // TODO: Implement pull request analysis
    // This could involve:
    // 1. Analyzing code changes
    // 2. Generating documentation updates
    // 3. Providing feedback on the PR
}
//# sourceMappingURL=github.controller.js.map