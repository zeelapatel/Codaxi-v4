"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const github_controller_1 = require("../controllers/github.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// OAuth routes
router.post('/auth/url', auth_1.authenticate, github_controller_1.GitHubController.generateAuthUrl);
router.get('/auth/callback', github_controller_1.GitHubController.handleOAuthCallback);
router.post('/auth/callback', github_controller_1.GitHubController.handleOAuthCallback);
// Repository management routes (require authentication)
router.get('/repositories', auth_1.authenticate, github_controller_1.GitHubController.getUserRepositories);
router.post('/repositories/connect', auth_1.authenticate, github_controller_1.GitHubController.connectRepository);
router.delete('/repositories/:connectionId', auth_1.authenticate, github_controller_1.GitHubController.disconnectRepository);
router.get('/repositories/connected', auth_1.authenticate, github_controller_1.GitHubController.getConnectedRepositories);
router.get('/repositories/:repoId/details', auth_1.authenticate, github_controller_1.GitHubController.getRepositoryDetails);
// Account management
router.delete('/account', auth_1.authenticate, github_controller_1.GitHubController.disconnectAccount);
// Webhook endpoint (no authentication required - GitHub sends the request)
router.post('/webhook', github_controller_1.GitHubController.handleWebhook);
exports.default = router;
//# sourceMappingURL=github.js.map