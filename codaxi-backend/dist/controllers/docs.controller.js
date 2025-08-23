"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocsController = void 0;
const response_1 = require("../utils/response");
const database_1 = require("../utils/database");
const ai_generator_1 = require("../services/ai-generator");
const zod_1 = require("zod");
const sanitize_1 = require("../utils/sanitize");
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
const tar_1 = __importDefault(require("tar"));
const path_1 = __importDefault(require("path"));
const context_builder_1 = require("../services/context-builder");
const config_1 = require("../config");
const github_service_1 = require("../services/github.service");
class DocsController {
    static async listDocs(req, res) {
        try {
            const { repoId } = req.params;
            const query = String(req.query.q || '').trim().toLowerCase();
            const kinds = String(req.query.kinds || '').split(',').filter(Boolean);
            const page = Math.max(1, parseInt(String(req.query.page || '1'), 10) || 1);
            const pageSize = Math.max(1, Math.min(100, parseInt(String(req.query.pageSize || '50'), 10) || 50));
            const where = { repositoryId: repoId };
            if (kinds.length)
                where.kind = { in: kinds };
            if (query) {
                where.OR = [
                    { title: { contains: query, mode: 'insensitive' } },
                    { summary: { contains: query, mode: 'insensitive' } },
                    { path: { contains: query, mode: 'insensitive' } }
                ];
            }
            const [total, docs] = await Promise.all([
                database_1.db.docNode.count({ where }),
                database_1.db.docNode.findMany({
                    where,
                    orderBy: { updatedAt: 'desc' },
                    select: { id: true, kind: true, path: true, title: true, summary: true, citations: true, metadata: true },
                    skip: (page - 1) * pageSize,
                    take: pageSize
                })
            ]);
            return (0, response_1.sendSuccess)(res, { items: docs, total, page, pageSize }, 'Docs retrieved');
        }
        catch (error) {
            console.error('Error listing docs:', error);
            return (0, response_1.sendError)(res, 'Failed to retrieve docs', 500);
        }
    }
    static async getDoc(req, res) {
        try {
            const { repoId, docId } = req.params;
            const doc = await database_1.db.docNode.findFirst({
                where: { id: docId, repositoryId: repoId }
            });
            if (!doc)
                return (0, response_1.sendError)(res, 'Doc not found', 404);
            return (0, response_1.sendSuccess)(res, doc, 'Doc retrieved');
        }
        catch (error) {
            console.error('Error getting doc:', error);
            return (0, response_1.sendError)(res, 'Failed to retrieve doc', 500);
        }
    }
    static async getDocSchema(req, res) {
        try {
            const { repoId, docId } = req.params;
            const doc = await database_1.db.docNode.findFirst({
                where: { id: docId, repositoryId: repoId },
                select: { id: true, metadata: true, params: true, requestSchema: true, requestExample: true, responses: true, errors: true }
            });
            if (!doc)
                return (0, response_1.sendError)(res, 'Doc not found', 404);
            return (0, response_1.sendSuccess)(res, doc, 'Doc schema retrieved');
        }
        catch (error) {
            console.error('Error getting doc schema:', error);
            return (0, response_1.sendError)(res, 'Failed to retrieve doc schema', 500);
        }
    }
    static async updateDocSchema(req, res) {
        try {
            const { repoId, docId } = req.params;
            // RBAC
            if (!req.user || !['ADMIN', 'EDITOR'].includes(req.user.role)) {
                return (0, response_1.sendForbidden)(res, 'Insufficient permissions');
            }
            // Validation schema
            const responsesSchema = zod_1.z.record(zod_1.z.string().regex(/^\d{3}$/), zod_1.z.object({
                contentType: zod_1.z.string().min(1).max(200).optional(),
                schema: zod_1.z.any().optional(),
                example: zod_1.z.any().optional()
            })).optional();
            const errorsSchema = zod_1.z.array(zod_1.z.object({
                status: zod_1.z.number().int().min(100).max(599),
                code: zod_1.z.string().max(200).optional(),
                message: zod_1.z.string().max(2000).optional(),
                example: zod_1.z.any().optional()
            })).optional();
            const payloadSchema = zod_1.z.object({
                params: zod_1.z.any().optional(),
                requestSchema: zod_1.z.any().optional(),
                requestExample: zod_1.z.any().optional(),
                responses: responsesSchema,
                errors: errorsSchema
            });
            const parsed = payloadSchema.safeParse(req.body || {});
            if (!parsed.success) {
                return (0, response_1.sendError)(res, 'Invalid schema payload', 400);
            }
            const data = parsed.data;
            // Size/serializability checks
            if (data.requestExample && !(0, sanitize_1.isJsonSerializable)(data.requestExample)) {
                return (0, response_1.sendError)(res, 'requestExample too large or not serializable', 400);
            }
            if (data.params && !(0, sanitize_1.isJsonSerializable)(data.params)) {
                return (0, response_1.sendError)(res, 'params too large or not serializable', 400);
            }
            if (data.responses && !(0, sanitize_1.isJsonSerializable)(data.responses)) {
                return (0, response_1.sendError)(res, 'responses too large or not serializable', 400);
            }
            if (data.errors && !(0, sanitize_1.isJsonSerializable)(data.errors)) {
                return (0, response_1.sendError)(res, 'errors too large or not serializable', 400);
            }
            // Normalize responses contentType
            const normalizedResponses = data.responses
                ? Object.fromEntries(Object.entries(data.responses).map(([k, v]) => [k, { contentType: v.contentType || 'application/json', schema: v.schema, example: v.example }]))
                : undefined;
            // Sanitize optional HTML if present
            const htmlSanitized = (0, sanitize_1.sanitizeHtml)(req.body?.html);
            // Load existing for versioning
            const existing = await database_1.db.docNode.findFirst({
                where: { id: docId, repositoryId: repoId },
                select: { id: true, schemaVersion: true, params: true, requestSchema: true, requestExample: true, responses: true, errors: true }
            });
            if (!existing)
                return (0, response_1.sendError)(res, 'Doc not found', 404);
            const nextVersion = (existing.schemaVersion || 0) + 1;
            await database_1.db.$transaction([
                database_1.db.docSchemaVersion.create({
                    data: {
                        docNodeId: docId,
                        version: nextVersion,
                        params: data.params ?? existing.params ?? undefined,
                        requestSchema: data.requestSchema ?? existing.requestSchema ?? undefined,
                        requestExample: data.requestExample ?? existing.requestExample ?? undefined,
                        responses: normalizedResponses ?? existing.responses ?? undefined,
                        errors: data.errors ?? existing.errors ?? undefined,
                        createdByUserId: req.user?.userId
                    }
                }),
                database_1.db.docNode.update({
                    where: { id: docId },
                    data: {
                        params: data.params ?? undefined,
                        requestSchema: data.requestSchema ?? undefined,
                        requestExample: data.requestExample ? (0, sanitize_1.clampJsonSize)(data.requestExample) : undefined,
                        responses: normalizedResponses ?? undefined,
                        errors: data.errors ?? undefined,
                        schemaVersion: nextVersion,
                        ...(htmlSanitized ? { html: htmlSanitized } : {})
                    }
                }),
                database_1.db.auditLog.create({
                    data: {
                        userId: req.user?.userId,
                        action: 'DOC_SCHEMA_UPDATE',
                        resource: `repo:${repoId}:doc:${docId}`,
                        details: { docId, repoId, version: nextVersion },
                        ipAddress: req.ip,
                        userAgent: req.get?.('user-agent')
                    }
                })
            ]);
            return (0, response_1.sendSuccess)(res, { id: docId, version: nextVersion }, 'Doc schema updated');
        }
        catch (error) {
            console.error('Error updating doc schema:', error);
            return (0, response_1.sendError)(res, 'Failed to update doc schema', 500);
        }
    }
    static async generateDocSchema(req, res) {
        try {
            const { repoId, docId } = req.params;
            const doc = await database_1.db.docNode.findFirst({ where: { id: docId, repositoryId: repoId } });
            if (!doc)
                return (0, response_1.sendError)(res, 'Doc not found', 404);
            // Build repo snapshot root for deterministic context
            const connection = await database_1.db.gitHubRepositoryConnection.findFirst({
                where: { repositoryId: repoId, isActive: true },
                include: { githubConnection: { select: { accessToken: true, githubUsername: true } } }
            });
            if (!connection)
                return (0, response_1.sendError)(res, 'Repository connection not found or inactive', 400);
            const [owner, repo] = connection.githubRepoFullName.split('/');
            const githubService = new github_service_1.GitHubService({
                clientId: config_1.config.github.clientId,
                clientSecret: config_1.config.github.clientSecret,
                redirectUri: config_1.config.github.redirectUri,
                scope: 'repo user'
            });
            const tmpDir = fs_1.default.mkdtempSync(path_1.default.join(os_1.default.tmpdir(), `codaxi-doc-${repoId}-`));
            let tarStream;
            if (connection.tarballFilePath && fs_1.default.existsSync(connection.tarballFilePath)) {
                tarStream = fs_1.default.createReadStream(connection.tarballFilePath);
            }
            else {
                const repoDetails = await githubService.getRepository(connection.githubConnection.accessToken, owner, repo);
                const targetBranch = repoDetails.default_branch || 'main';
                tarStream = await githubService.downloadTarball(connection.githubConnection.accessToken, owner, repo, targetBranch);
            }
            await new Promise((resolve, reject) => {
                tarStream.pipe(tar_1.default.x({ cwd: tmpDir })).on('finish', () => resolve()).on('error', reject);
            });
            const [rootFolder] = fs_1.default.readdirSync(tmpDir);
            const repoRoot = path_1.default.join(tmpDir, rootFolder);
            // Build deterministic ContextPack
            const pack = await (0, context_builder_1.buildContextPack)(repoRoot, {
                path: doc.path,
                metadata: { method: doc.metadata?.method },
                citations: Array.isArray(doc.citations) ? doc.citations.map(c => ({ filePath: c.filePath, startLine: c.startLine, endLine: c.endLine })) : []
            });
            const start = Date.now();
            const gen = await (0, ai_generator_1.generateFromContextPack)(pack);
            console.log('[LLM] generate examples (deterministic)', {
                repoId,
                docId,
                latencyMs: Date.now() - start,
                contexts_count: pack.contexts.length,
                endpoint: pack.endpoint,
                contextFiles: pack.contexts.map(c => `${c.kind}:${c.filePath}`)
            });
            return (0, response_1.sendSuccess)(res, gen, 'Generated API examples');
        }
        catch (error) {
            console.error('Error generating doc schema:', error);
            console.log('[LLM] generate examples', { success: false, error: error?.message });
            return (0, response_1.sendError)(res, 'Failed to generate doc schema', 500);
        }
    }
    static async listDocSchemaVersions(req, res) {
        try {
            const { repoId, docId } = req.params;
            const doc = await database_1.db.docNode.findFirst({ where: { id: docId, repositoryId: repoId }, select: { id: true } });
            if (!doc)
                return (0, response_1.sendError)(res, 'Doc not found', 404);
            const versions = await database_1.db.docSchemaVersion.findMany({
                where: { docNodeId: docId },
                orderBy: { version: 'desc' },
                select: { version: true, createdAt: true, createdByUserId: true }
            });
            return (0, response_1.sendSuccess)(res, { versions }, 'Doc schema versions');
        }
        catch (e) {
            return (0, response_1.sendError)(res, 'Failed to list versions', 500);
        }
    }
    static async rollbackDocSchema(req, res) {
        try {
            const { repoId, docId } = req.params;
            const { version } = req.body || {};
            if (!req.user || !['ADMIN', 'EDITOR'].includes(req.user.role)) {
                return (0, response_1.sendForbidden)(res, 'Insufficient permissions');
            }
            if (typeof version !== 'number' || version <= 0)
                return (0, response_1.sendError)(res, 'Invalid version', 400);
            const snap = await database_1.db.docSchemaVersion.findFirst({ where: { docNodeId: docId, version } });
            if (!snap)
                return (0, response_1.sendError)(res, 'Version not found', 404);
            await database_1.db.$transaction([
                database_1.db.docNode.update({
                    where: { id: docId },
                    data: {
                        params: snap.params ?? undefined,
                        requestSchema: snap.requestSchema ?? undefined,
                        requestExample: snap.requestExample ?? undefined,
                        responses: snap.responses ?? undefined,
                        errors: snap.errors ?? undefined,
                        schemaVersion: snap.version
                    }
                }),
                database_1.db.auditLog.create({
                    data: {
                        userId: req.user?.userId,
                        action: 'DOC_SCHEMA_ROLLBACK',
                        resource: `repo:${repoId}:doc:${docId}`,
                        details: { docId, repoId, version },
                        ipAddress: req.ip,
                        userAgent: req.get?.('user-agent')
                    }
                })
            ]);
            return (0, response_1.sendSuccess)(res, { id: docId, version }, 'Rolled back doc schema');
        }
        catch (e) {
            return (0, response_1.sendError)(res, 'Failed to rollback doc schema', 500);
        }
    }
}
exports.DocsController = DocsController;
//# sourceMappingURL=docs.controller.js.map