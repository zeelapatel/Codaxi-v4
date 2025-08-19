import { Router } from 'express'
import { ScanController } from '../controllers/scan.controller'
import { authenticate } from '../middleware/auth'

const router = Router()

router.post('/scans', authenticate, ScanController.startScan)
router.get('/scans/:id', authenticate, ScanController.getScan)
// SSE stream - consider exempting from strict rate limits in middleware
router.get('/scans/:id/stream', authenticate, ScanController.streamScan)
router.get('/scans/active', authenticate, ScanController.activeScans)
router.get('/repos/:repoId/scans', authenticate, ScanController.listScans)
router.post('/scans/:id/cancel', authenticate, ScanController.cancelScan)

export default router
