"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const scan_controller_1 = require("../controllers/scan.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.post('/scans', auth_1.authenticate, scan_controller_1.ScanController.startScan);
router.get('/scans/:id', auth_1.authenticate, scan_controller_1.ScanController.getScan);
router.get('/scans/active', auth_1.authenticate, scan_controller_1.ScanController.activeScans);
router.get('/repos/:repoId/scans', auth_1.authenticate, scan_controller_1.ScanController.listScans);
exports.default = router;
//# sourceMappingURL=scan.js.map