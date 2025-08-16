import { Router } from 'express'
import { GitHubController } from '../controllers/github.controller'
import { authenticate } from '../middleware/auth'

const router = Router()

// OAuth routes
router.post('/auth/url', authenticate, GitHubController.generateAuthUrl)
router.get('/auth/callback', GitHubController.handleOAuthCallback)
router.post('/auth/callback', GitHubController.handleOAuthCallback)

// Repository management routes (require authentication)
router.get('/repositories', authenticate, GitHubController.getUserRepositories)
router.post('/repositories/connect', authenticate, GitHubController.connectRepository)
router.delete('/repositories/:connectionId', authenticate, GitHubController.disconnectRepository)
router.get('/repositories/connected', authenticate, GitHubController.getConnectedRepositories)
router.get('/repositories/:repoId/details', authenticate, GitHubController.getRepositoryDetails)

// Account management
router.delete('/account', authenticate, GitHubController.disconnectAccount)

// Webhook endpoint (no authentication required - GitHub sends the request)
router.post('/webhook', GitHubController.handleWebhook)

export default router
