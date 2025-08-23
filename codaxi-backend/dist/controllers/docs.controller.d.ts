import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
export declare class DocsController {
    static listDocs(req: AuthenticatedRequest, res: Response): Promise<void>;
    static getDoc(req: AuthenticatedRequest, res: Response): Promise<void>;
    static getDocSchema(req: AuthenticatedRequest, res: Response): Promise<void>;
    static updateDocSchema(req: AuthenticatedRequest, res: Response): Promise<void>;
    static generateDocSchema(req: AuthenticatedRequest, res: Response): Promise<void>;
    static listDocSchemaVersions(req: AuthenticatedRequest, res: Response): Promise<void>;
    static rollbackDocSchema(req: AuthenticatedRequest, res: Response): Promise<void>;
}
//# sourceMappingURL=docs.controller.d.ts.map