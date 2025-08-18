import { GitHubOAuthConfig, GitHubUser, GitHubRepository, GitHubBranch, GitHubCommit, GitHubFile, GitHubOAuthResponse } from '../types/github';
export declare class GitHubService {
    private apiClient;
    private oauthConfig;
    constructor(oauthConfig: GitHubOAuthConfig);
    /**
     * Generate OAuth authorization URL
     */
    generateAuthUrl(state?: string): string;
    /**
     * Exchange authorization code for access token
     */
    exchangeCodeForToken(code: string): Promise<GitHubOAuthResponse>;
    /**
     * Get authenticated user information
     */
    getAuthenticatedUser(accessToken: string): Promise<GitHubUser>;
    /**
     * Get user's repositories
     */
    getUserRepositories(accessToken: string, username?: string): Promise<GitHubRepository[]>;
    /**
     * Get repository details
     */
    getRepository(accessToken: string, owner: string, repo: string): Promise<GitHubRepository>;
    /**
     * Get repository branches
     */
    getRepositoryBranches(accessToken: string, owner: string, repo: string): Promise<GitHubBranch[]>;
    /**
     * Get repository commits
     */
    getRepositoryCommits(accessToken: string, owner: string, repo: string, branch?: string, since?: string): Promise<GitHubCommit[]>;
    /**
     * Get file content
     */
    getFileContent(accessToken: string, owner: string, repo: string, path: string, ref?: string): Promise<GitHubFile>;
    /**
     * Get repository tree
     */
    getRepositoryTree(accessToken: string, owner: string, repo: string, treeSha: string, recursive?: boolean): Promise<any>;
    /**
     * Create webhook for repository
     */
    createWebhook(accessToken: string, owner: string, repo: string, webhookUrl: string, secret?: string): Promise<any>;
    /**
     * List webhooks for repository
     */
    listWebhooks(accessToken: string, owner: string, repo: string): Promise<any[]>;
    /**
     * Delete webhook
     */
    deleteWebhook(accessToken: string, owner: string, repo: string, hookId: number): Promise<void>;
    /**
     * Check if user has access to repository
     */
    checkRepositoryAccess(accessToken: string, owner: string, repo: string): Promise<boolean>;
    /**
     * Get repository languages
     */
    getRepositoryLanguages(accessToken: string, owner: string, repo: string): Promise<Record<string, number>>;
    /**
     * Get repository contributors
     */
    getRepositoryContributors(accessToken: string, owner: string, repo: string): Promise<GitHubUser[]>;
    /**
     * Extract error message from various error types
     */
    private getErrorMessage;
}
//# sourceMappingURL=github.service.d.ts.map