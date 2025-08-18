import { Router } from 'express'
import { ScanController } from '../controllers/scan.controller'
import { authenticate } from '../middleware/auth'

const router = Router()

router.post('/scans', authenticate, ScanController.startScan)
router.get('/scans/:id', authenticate, ScanController.getScan)
router.get('/scans/active', authenticate, ScanController.activeScans)
router.get('/repos/:repoId/scans', authenticate, ScanController.listScans)

export default router
