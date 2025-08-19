import { Router } from 'express'
import { DocsController } from '../controllers/docs.controller'
import { authenticate, requireRole } from '../middleware/auth'
import { requestSizeLimit } from '../middleware/security'

const router = Router()

router.get('/repos/:repoId/docs', authenticate, DocsController.listDocs)
router.get('/repos/:repoId/docs/:docId', authenticate, DocsController.getDoc)
router.get('/repos/:repoId/docs/:docId/schema', authenticate, DocsController.getDocSchema)
router.put('/repos/:repoId/docs/:docId/schema', requestSizeLimit(512 * 1024), authenticate, requireRole(['ADMIN','EDITOR']), DocsController.updateDocSchema)
router.post('/repos/:repoId/docs/:docId/schema:generate', authenticate, DocsController.generateDocSchema)
router.get('/repos/:repoId/docs/:docId/schema/versions', authenticate, DocsController.listDocSchemaVersions)
router.post('/repos/:repoId/docs/:docId/schema:rollback', authenticate, requireRole(['ADMIN','EDITOR']), DocsController.rollbackDocSchema)

export default router


