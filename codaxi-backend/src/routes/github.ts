import { Router } from 'express'
import { GitHubController } from '../controllers/github.controller'
import { generalRateLimit } from '../middleware/security'
import { authenticate } from '../middleware/auth'

const router = Router()

// OAuth routes
router.post('/auth/url', authenticate, GitHubController.generateAuthUrl)
router.get('/auth/callback', GitHubController.handleOAuthCallback)
router.post('/auth/callback', GitHubController.handleOAuthCallback)

// Repository management routes (require authentication)
// Apply rate limit only to GitHub routes to avoid throttling internal endpoints
router.get('/repositories', authenticate, generalRateLimit, GitHubController.getUserRepositories)
router.post('/repositories/connect', authenticate, generalRateLimit, GitHubController.connectRepository)
router.delete('/repositories/:connectionId', authenticate, generalRateLimit, GitHubController.disconnectRepository)
router.get('/repositories/connected', authenticate, generalRateLimit, GitHubController.getConnectedRepositories)
router.get('/repositories/:repoId/details', authenticate, generalRateLimit, GitHubController.getRepositoryDetails)

// Account management
router.delete('/account', authenticate, GitHubController.disconnectAccount)

// Webhook endpoint (no authentication required - GitHub sends the request)
router.post('/webhook', GitHubController.handleWebhook)

export default router
