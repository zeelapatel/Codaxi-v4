import { Router } from 'express'
import { GoogleController } from '../controllers/google.controller'

const router = Router()

// OAuth routes
router.post('/auth/url', GoogleController.generateAuthUrl)
router.get('/auth/callback', GoogleController.handleOAuthCallback)
router.post('/auth/callback', GoogleController.handleOAuthCallback)

export default router


