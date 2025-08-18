import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../types';
export declare class GitHubController {
    /**
     * Generate OAuth authorization URL
     */
    static generateAuthUrl(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * Handle OAuth callback
     */
    static handleOAuthCallback(req: Request, res: Response): Promise<void>;
    /**
     * Get user's GitHub repositories
     */
    static getUserRepositories(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * Connect a specific repository
     */
    static connectRepository(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * Disconnect a repository
     */
    static disconnectRepository(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * Get connected repositories
     */
    static getConnectedRepositories(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * Get repository details
     */
    static getRepositoryDetails(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * Handle GitHub webhook
     */
    static handleWebhook(req: Request, res: Response): Promise<void>;
    /**
     * Disconnect GitHub account
     */
    static disconnectAccount(req: AuthenticatedRequest, res: Response): Promise<void>;
}
//# sourceMappingURL=github.controller.d.ts.map