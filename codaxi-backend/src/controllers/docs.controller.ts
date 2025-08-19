import { Response } from 'express'
import { AuthenticatedRequest } from '../types'
import { sendError, sendSuccess, sendForbidden } from '../utils/response'
import { db } from '../utils/database'
import { generateApiExamples, generateApiExamplesWithLLM } from '../services/ai-generator'
import { z } from 'zod'
import { sanitizeHtml, isJsonSerializable, clampJsonSize } from '../utils/sanitize'

export class DocsController {
	static async listDocs(req: AuthenticatedRequest, res: Response) {
		try {
			const { repoId } = req.params
			const query = String(req.query.q || '').trim().toLowerCase()
			const kinds = String(req.query.kinds || '').split(',').filter(Boolean)
			const page = Math.max(1, parseInt(String(req.query.page || '1'), 10) || 1)
			const pageSize = Math.max(1, Math.min(100, parseInt(String(req.query.pageSize || '50'), 10) || 50))

			const where: any = { repositoryId: repoId }
			if (kinds.length) where.kind = { in: kinds }
			if (query) {
				where.OR = [
					{ title: { contains: query, mode: 'insensitive' } },
					{ summary: { contains: query, mode: 'insensitive' } },
					{ path: { contains: query, mode: 'insensitive' } }
				]
			}

			const [total, docs] = await Promise.all([
				(db as any).docNode.count({ where }),
				(db as any).docNode.findMany({
					where,
					orderBy: { updatedAt: 'desc' },
					select: { id: true, kind: true, path: true, title: true, summary: true, citations: true, metadata: true },
					skip: (page - 1) * pageSize,
					take: pageSize
				})
			])

			return sendSuccess(res, { items: docs, total, page, pageSize }, 'Docs retrieved')
		} catch (error) {
			console.error('Error listing docs:', error)
			return sendError(res, 'Failed to retrieve docs', 500)
		}
	}

	static async getDoc(req: AuthenticatedRequest, res: Response) {
		try {
			const { repoId, docId } = req.params
			const doc = await (db as any).docNode.findFirst({
				where: { id: docId, repositoryId: repoId }
			})
			if (!doc) return sendError(res, 'Doc not found', 404)
			return sendSuccess(res, doc, 'Doc retrieved')
		} catch (error) {
			console.error('Error getting doc:', error)
			return sendError(res, 'Failed to retrieve doc', 500)
		}
	}

	static async getDocSchema(req: AuthenticatedRequest, res: Response) {
		try {
			const { repoId, docId } = req.params
			const doc = await (db as any).docNode.findFirst({
				where: { id: docId, repositoryId: repoId },
				select: { id: true, metadata: true, params: true, requestSchema: true, requestExample: true, responses: true, errors: true }
			})
			if (!doc) return sendError(res, 'Doc not found', 404)
			return sendSuccess(res, doc, 'Doc schema retrieved')
		} catch (error) {
			console.error('Error getting doc schema:', error)
			return sendError(res, 'Failed to retrieve doc schema', 500)
		}
	}

	static async updateDocSchema(req: AuthenticatedRequest, res: Response) {
		try {
			const { repoId, docId } = req.params
			// RBAC
			if (!req.user || !['ADMIN', 'EDITOR'].includes(req.user.role as any)) {
				return sendForbidden(res, 'Insufficient permissions')
			}

			// Validation schema
			const responsesSchema = z.record(
				z.string().regex(/^\d{3}$/),
				z.object({
					contentType: z.string().min(1).max(200).optional(),
					schema: z.any().optional(),
					example: z.any().optional()
				})
			).optional()

			const errorsSchema = z.array(z.object({
				status: z.number().int().min(100).max(599),
				code: z.string().max(200).optional(),
				message: z.string().max(2000).optional(),
				example: z.any().optional()
			})).optional()

			const payloadSchema = z.object({
				params: z.any().optional(),
				requestSchema: z.any().optional(),
				requestExample: z.any().optional(),
				responses: responsesSchema,
				errors: errorsSchema
			})

			const parsed = payloadSchema.safeParse(req.body || {})
			if (!parsed.success) {
				return sendError(res, 'Invalid schema payload', 400)
			}

			const data = parsed.data as any

			// Size/serializability checks
			if (data.requestExample && !isJsonSerializable(data.requestExample)) {
				return sendError(res, 'requestExample too large or not serializable', 400)
			}
			if (data.params && !isJsonSerializable(data.params)) {
				return sendError(res, 'params too large or not serializable', 400)
			}
			if (data.responses && !isJsonSerializable(data.responses)) {
				return sendError(res, 'responses too large or not serializable', 400)
			}
			if (data.errors && !isJsonSerializable(data.errors)) {
				return sendError(res, 'errors too large or not serializable', 400)
			}

			// Normalize responses contentType
			const normalizedResponses = data.responses
				? Object.fromEntries(Object.entries(data.responses).map(([k, v]: any) => [k, { contentType: v.contentType || 'application/json', schema: v.schema, example: v.example }]))
				: undefined

			// Sanitize optional HTML if present
			const htmlSanitized = sanitizeHtml((req.body as any)?.html)

			// Load existing for versioning
			const existing = await (db as any).docNode.findFirst({
				where: { id: docId, repositoryId: repoId },
				select: { id: true, schemaVersion: true, params: true, requestSchema: true, requestExample: true, responses: true, errors: true }
			})
			if (!existing) return sendError(res, 'Doc not found', 404)

			const nextVersion = (existing.schemaVersion || 0) + 1

			await (db as any).$transaction([
				(db as any).docSchemaVersion.create({
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
				(db as any).docNode.update({
					where: { id: docId },
					data: {
						params: data.params ?? undefined,
						requestSchema: data.requestSchema ?? undefined,
						requestExample: data.requestExample ? clampJsonSize(data.requestExample) : undefined,
						responses: normalizedResponses ?? undefined,
						errors: data.errors ?? undefined,
						schemaVersion: nextVersion,
						...(htmlSanitized ? { html: htmlSanitized } : {})
					}
				}),
				(db as any).auditLog.create({
					data: {
						userId: req.user?.userId,
						action: 'DOC_SCHEMA_UPDATE',
						resource: `repo:${repoId}:doc:${docId}`,
						details: { docId, repoId, version: nextVersion },
						ipAddress: (req as any).ip,
						userAgent: (req as any).get?.('user-agent')
					}
				})
			])

			return sendSuccess(res, { id: docId, version: nextVersion }, 'Doc schema updated')
		} catch (error) {
			console.error('Error updating doc schema:', error)
			return sendError(res, 'Failed to update doc schema', 500)
		}
	}

	static async generateDocSchema(req: AuthenticatedRequest, res: Response) {
		try {
			const { repoId, docId } = req.params
			const doc = await (db as any).docNode.findFirst({ where: { id: docId, repositoryId: repoId } })
			if (!doc) return sendError(res, 'Doc not found', 404)

			const codeContexts: Array<{ filePath: string; snippet: string }> = []
			if (Array.isArray(doc.citations)) {
				for (const c of doc.citations as any[]) {
					codeContexts.push({ filePath: c.filePath, snippet: '' })
				}
			}

			const start = Date.now()
			const gen = await generateApiExamplesWithLLM({
				method: doc.metadata?.method,
				fullPath: doc.path,
				codeContexts
			})

			// structured log (no secrets)
			console.log('[LLM] generate examples', {
				repoId,
				docId,
				latencyMs: Date.now() - start,
				success: true
			})

			return sendSuccess(res, gen, 'Generated API examples')
		} catch (error) {
			console.error('Error generating doc schema:', error)
			console.log('[LLM] generate examples', { success: false, error: (error as any)?.message })
			return sendError(res, 'Failed to generate doc schema', 500)
		}
	}

	static async listDocSchemaVersions(req: AuthenticatedRequest, res: Response) {
		try {
			const { repoId, docId } = req.params
			const doc = await (db as any).docNode.findFirst({ where: { id: docId, repositoryId: repoId }, select: { id: true } })
			if (!doc) return sendError(res, 'Doc not found', 404)
			const versions = await (db as any).docSchemaVersion.findMany({
				where: { docNodeId: docId },
				orderBy: { version: 'desc' },
				select: { version: true, createdAt: true, createdByUserId: true }
			})
			return sendSuccess(res, { versions }, 'Doc schema versions')
		} catch (e) {
			return sendError(res, 'Failed to list versions', 500)
		}
	}

	static async rollbackDocSchema(req: AuthenticatedRequest, res: Response) {
		try {
			const { repoId, docId } = req.params
			const { version } = req.body || {}
			if (!req.user || !['ADMIN', 'EDITOR'].includes(req.user.role as any)) {
				return sendForbidden(res, 'Insufficient permissions')
			}
			if (typeof version !== 'number' || version <= 0) return sendError(res, 'Invalid version', 400)
			const snap = await (db as any).docSchemaVersion.findFirst({ where: { docNodeId: docId, version } })
			if (!snap) return sendError(res, 'Version not found', 404)
			await (db as any).$transaction([
				(db as any).docNode.update({
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
				(db as any).auditLog.create({
					data: {
						userId: req.user?.userId,
						action: 'DOC_SCHEMA_ROLLBACK',
						resource: `repo:${repoId}:doc:${docId}`,
						details: { docId, repoId, version },
						ipAddress: (req as any).ip,
						userAgent: (req as any).get?.('user-agent')
					}
				})
			])
			return sendSuccess(res, { id: docId, version }, 'Rolled back doc schema')
		} catch (e) {
			return sendError(res, 'Failed to rollback doc schema', 500)
		}
	}
}


