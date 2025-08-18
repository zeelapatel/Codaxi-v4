import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
type ScanStatus = 'queued' | 'parsing' | 'embedding' | 'generating' | 'completed' | 'error';
interface ScanMetrics {
    filesParsed: number;
    endpointsDetected: number;
    eventsDetected: number;
    typesDetected: number;
    tokensUsed: number;
    durationSec: number;
}
interface ScanRecord {
    id: string;
    repoId: string;
    branch: string;
    status: ScanStatus;
    startedAt: string;
    completedAt?: string;
    metrics: ScanMetrics;
    errors?: Array<{
        stage: string;
        message: string;
    }>;
}
export declare const getInMemoryScanForRepo: (repoId: string) => ScanRecord | undefined;
export declare class ScanController {
    /**
     * Start a scan for a repository
     * POST /api/scans
     */
    static startScan(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * Get scan status by id
     * GET /api/scans/:id
     */
    static getScan(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * List scans by repository
     * GET /api/repos/:repoId/scans?limit=1
     */
    static listScans(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * Get active scans (lightweight)
     * GET /api/scans/active
     */
    static activeScans(req: AuthenticatedRequest, res: Response): Promise<void>;
}
export {};
//# sourceMappingURL=scan.controller.d.ts.map