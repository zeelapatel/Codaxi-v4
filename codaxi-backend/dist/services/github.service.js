"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitHubService = void 0;
const axios_1 = __importDefault(require("axios"));
class GitHubService {
    constructor(oauthConfig) {
        this.oauthConfig = oauthConfig;
        this.apiClient = axios_1.default.create({
            baseURL: 'https://api.github.com',
            headers: {
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'Codaxi-Documentation-Generator'
            }
        });
    }
    /** Download repository tarball for a given ref (branch or commit SHA) */
    async downloadTarball(accessToken, owner, repo, ref) {
        try {
            const response = await this.apiClient.get(`/repos/${owner}/${repo}/tarball/${encodeURIComponent(ref)}`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                },
                responseType: 'stream'
            });
            return response.data;
        }
        catch (error) {
            throw new Error(`Failed to download tarball: ${this.getErrorMessage(error)}`);
        }
    }
    /**
     * Generate OAuth authorization URL
     */
    generateAuthUrl(state) {
        const params = new URLSearchParams({
            client_id: this.oauthConfig.clientId,
            redirect_uri: this.oauthConfig.redirectUri,
            scope: this.oauthConfig.scope,
            response_type: 'code'
        });
        if (state) {
            params.append('state', state);
        }
        return `https://github.com/login/oauth/authorize?${params.toString()}`;
    }
    /**
     * Exchange authorization code for access token
     */
    async exchangeCodeForToken(code) {
        try {
            const response = await axios_1.default.post('https://github.com/login/oauth/access_token', {
                client_id: this.oauthConfig.clientId,
                client_secret: this.oauthConfig.clientSecret,
                code,
                redirect_uri: this.oauthConfig.redirectUri
            }, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });
            if (response.data.error) {
                throw new Error(`GitHub OAuth error: ${response.data.error_description || response.data.error}`);
            }
            return response.data;
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                throw new Error(`Failed to exchange code for token: ${error.message}`);
            }
            throw error;
        }
    }
    /**
     * Get authenticated user information
     */
    async getAuthenticatedUser(accessToken) {
        try {
            const response = await this.apiClient.get('/user', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });
            return response.data;
        }
        catch (error) {
            throw new Error(`Failed to get authenticated user: ${this.getErrorMessage(error)}`);
        }
    }
    /**
     * Get user's repositories
     */
    async getUserRepositories(accessToken, username) {
        try {
            console.log('[GitHubService] Getting user repositories', { username });
            const endpoint = username ? `/users/${username}/repos` : '/user/repos';
            console.log('[GitHubService] Using endpoint:', endpoint);
            const params = {
                sort: 'updated',
                per_page: 100,
                affiliation: 'owner,collaborator,organization_member'
            };
            console.log('[GitHubService] Request params:', params);
            const response = await this.apiClient.get(endpoint, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                },
                params
            });
            console.log('[GitHubService] GitHub API response:', {
                status: response.status,
                repoCount: response.data.length,
                firstRepo: response.data[0] ? {
                    id: response.data[0].id,
                    full_name: response.data[0].full_name
                } : null
            });
            return response.data;
        }
        catch (error) {
            // On 429 or rate limit errors, surface a friendly error
            if (axios_1.default.isAxiosError(error) && (error.response?.status === 429)) {
                throw new Error('GitHub API rate limit reached. Please wait and try again.');
            }
            console.error('[GitHubService] Error getting repositories:', {
                error: this.getErrorMessage(error),
                fullError: error
            });
            throw new Error(`Failed to get repositories: ${this.getErrorMessage(error)}`);
        }
    }
    /**
     * Get repository details
     */
    async getRepository(accessToken, owner, repo) {
        try {
            const response = await this.apiClient.get(`/repos/${owner}/${repo}`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });
            return response.data;
        }
        catch (error) {
            throw new Error(`Failed to get repository: ${this.getErrorMessage(error)}`);
        }
    }
    /**
     * Get repository branches
     */
    async getRepositoryBranches(accessToken, owner, repo) {
        try {
            const response = await this.apiClient.get(`/repos/${owner}/${repo}/branches`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                },
                params: {
                    per_page: 100
                }
            });
            return response.data;
        }
        catch (error) {
            throw new Error(`Failed to get repository branches: ${this.getErrorMessage(error)}`);
        }
    }
    /**
     * Get repository commits
     */
    async getRepositoryCommits(accessToken, owner, repo, branch, since) {
        try {
            const params = {
                per_page: 100
            };
            if (branch)
                params.sha = branch;
            if (since)
                params.since = since;
            const response = await this.apiClient.get(`/repos/${owner}/${repo}/commits`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                },
                params
            });
            return response.data;
        }
        catch (error) {
            throw new Error(`Failed to get repository commits: ${this.getErrorMessage(error)}`);
        }
    }
    /**
     * Get file content
     */
    async getFileContent(accessToken, owner, repo, path, ref) {
        try {
            const params = {};
            if (ref)
                params.ref = ref;
            const response = await this.apiClient.get(`/repos/${owner}/${repo}/contents/${path}`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                },
                params
            });
            return response.data;
        }
        catch (error) {
            throw new Error(`Failed to get file content: ${this.getErrorMessage(error)}`);
        }
    }
    /**
     * Get repository tree
     */
    async getRepositoryTree(accessToken, owner, repo, treeSha, recursive = false) {
        try {
            const response = await this.apiClient.get(`/repos/${owner}/${repo}/git/trees/${treeSha}`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                },
                params: {
                    recursive: recursive ? 1 : 0
                }
            });
            return response.data;
        }
        catch (error) {
            throw new Error(`Failed to get repository tree: ${this.getErrorMessage(error)}`);
        }
    }
    /**
     * Create webhook for repository
     */
    async createWebhook(accessToken, owner, repo, webhookUrl, secret) {
        try {
            const webhookData = {
                name: 'web',
                active: true,
                events: ['push', 'pull_request'],
                config: {
                    url: webhookUrl,
                    content_type: 'json',
                    ...(secret && { secret })
                }
            };
            const response = await this.apiClient.post(`/repos/${owner}/${repo}/hooks`, webhookData, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });
            return response.data;
        }
        catch (error) {
            throw new Error(`Failed to create webhook: ${this.getErrorMessage(error)}`);
        }
    }
    /**
     * List webhooks for repository
     */
    async listWebhooks(accessToken, owner, repo) {
        try {
            const response = await this.apiClient.get(`/repos/${owner}/${repo}/hooks`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });
            return response.data;
        }
        catch (error) {
            throw new Error(`Failed to list webhooks: ${this.getErrorMessage(error)}`);
        }
    }
    /**
     * Delete webhook
     */
    async deleteWebhook(accessToken, owner, repo, hookId) {
        try {
            await this.apiClient.delete(`/repos/${owner}/${repo}/hooks/${hookId}`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });
        }
        catch (error) {
            throw new Error(`Failed to delete webhook: ${this.getErrorMessage(error)}`);
        }
    }
    /**
     * Check if user has access to repository
     */
    async checkRepositoryAccess(accessToken, owner, repo) {
        try {
            await this.getRepository(accessToken, owner, repo);
            return true;
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error) && error.response?.status === 404) {
                return false;
            }
            throw error;
        }
    }
    /**
     * Get repository languages
     */
    async getRepositoryLanguages(accessToken, owner, repo) {
        try {
            const response = await this.apiClient.get(`/repos/${owner}/${repo}/languages`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });
            return response.data;
        }
        catch (error) {
            throw new Error(`Failed to get repository languages: ${this.getErrorMessage(error)}`);
        }
    }
    /**
     * Get repository contributors
     */
    async getRepositoryContributors(accessToken, owner, repo) {
        try {
            const response = await this.apiClient.get(`/repos/${owner}/${repo}/contributors`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                },
                params: {
                    per_page: 100
                }
            });
            return response.data;
        }
        catch (error) {
            throw new Error(`Failed to get repository contributors: ${this.getErrorMessage(error)}`);
        }
    }
    /**
     * Extract error message from various error types
     */
    getErrorMessage(error) {
        if (axios_1.default.isAxiosError(error)) {
            if (error.response?.data?.message) {
                return error.response.data.message;
            }
            if (error.response?.status === 401) {
                return 'Unauthorized - Invalid or expired token';
            }
            if (error.response?.status === 403) {
                return 'Forbidden - Insufficient permissions';
            }
            if (error.response?.status === 404) {
                return 'Not found';
            }
            if (error.response?.status === 422) {
                return 'Validation failed';
            }
            return error.message;
        }
        return error.message || 'Unknown error occurred';
    }
}
exports.GitHubService = GitHubService;
//# sourceMappingURL=github.service.js.map