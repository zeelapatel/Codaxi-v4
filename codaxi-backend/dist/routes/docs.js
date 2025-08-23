"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const docs_controller_1 = require("../controllers/docs.controller");
const auth_1 = require("../middleware/auth");
const security_1 = require("../middleware/security");
const router = (0, express_1.Router)();
router.get('/repos/:repoId/docs', auth_1.authenticate, docs_controller_1.DocsController.listDocs);
router.get('/repos/:repoId/docs/:docId', auth_1.authenticate, docs_controller_1.DocsController.getDoc);
router.get('/repos/:repoId/docs/:docId/schema', auth_1.authenticate, docs_controller_1.DocsController.getDocSchema);
router.put('/repos/:repoId/docs/:docId/schema', (0, security_1.requestSizeLimit)(512 * 1024), auth_1.authenticate, (0, auth_1.requireRole)(['ADMIN', 'EDITOR']), docs_controller_1.DocsController.updateDocSchema);
router.post('/repos/:repoId/docs/:docId/schema:generate', auth_1.authenticate, docs_controller_1.DocsController.generateDocSchema);
router.get('/repos/:repoId/docs/:docId/schema/versions', auth_1.authenticate, docs_controller_1.DocsController.listDocSchemaVersions);
router.post('/repos/:repoId/docs/:docId/schema:rollback', auth_1.authenticate, (0, auth_1.requireRole)(['ADMIN', 'EDITOR']), docs_controller_1.DocsController.rollbackDocSchema);
exports.default = router;
//# sourceMappingURL=docs.js.map