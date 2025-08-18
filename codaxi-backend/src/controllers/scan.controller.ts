import { Request, Response } from 'express'
import { sendSuccess, sendError } from '../utils/response'
import { AuthenticatedRequest } from '../types'
import { GitHubService } from '../services/github.service'
import { config } from '../config'
import { db } from '../utils/database'

// Scan status union to align with frontend expectations
type ScanStatus = 'queued' | 'parsing' | 'embedding' | 'generating' | 'completed' | 'error'

interface ScanMetrics {
	filesParsed: number
	endpointsDetected: number
	eventsDetected: number
	typesDetected: number
	tokensUsed: number
	durationSec: number
}

interface ScanRecord {
	id: string
	repoId: string
	branch: string
	status: ScanStatus
	startedAt: string
	completedAt?: string
	metrics: ScanMetrics
	errors?: Array<{ stage: string; message: string }>
}

/**
 * A very simple in-memory scan manager that simulates progressive metrics updates.
 * This replaces a real job queue for now.
 */
class InMemoryScanManager {
	private scans: Map<string, ScanRecord> = new Map()
	// Use prisma via shared db client; cast to any for the new Scan model until prisma generate runs
	private get scanModel() { return (db as unknown as { scan: any }).scan }
	private githubService = new GitHubService({
		clientId: config.github.clientId,
		clientSecret: config.github.clientSecret,
		redirectUri: config.github.redirectUri,
		scope: 'repo user'
	})

	async createScan(repoId: string, branch: string = 'main'): Promise<ScanRecord> {
		// Persist initial row first to get DB-generated id
		let createdId: string | null = null
		try {
			const created = await this.scanModel?.create?.({
				data: {
					repositoryId: repoId,
					branch,
					status: 'queued',
					startedAt: new Date()
				}
			})
			createdId = created?.id || null
		} catch {}

		const scanId = createdId || `scan-${Date.now()}`
		const scan: ScanRecord = {
			id: scanId,
			repoId,
			branch,
			status: 'queued',
			startedAt: new Date().toISOString(),
			metrics: {
				filesParsed: 0,
				endpointsDetected: 0,
				eventsDetected: 0,
				typesDetected: 0,
				tokensUsed: 0,
				durationSec: 0
			}
		}

		this.scans.set(scan.id, scan)

		this.runScan(scan.id).catch((error) => {
			this.updateScan(scan.id, {
				status: 'error',
				errors: [{ stage: 'parsing', message: (error as Error).message }]
			})
		})
		return scan
	}

	getScan(scanId: string): ScanRecord | undefined {
		const inMemory = this.scans.get(scanId)
		return inMemory
	}

	getLatestScanForRepo(repoId: string): ScanRecord | undefined {
		let latest: ScanRecord | undefined
		for (const scan of this.scans.values()) {
			if (scan.repoId !== repoId) continue
			if (!latest) {
				latest = scan
				continue
			}
			if (new Date(scan.startedAt).getTime() > new Date(latest.startedAt).getTime()) {
				latest = scan
			}
		}
		return latest
	}

	private updateScan(
		scanId: string,
		update: Omit<Partial<ScanRecord>, 'metrics'> & { metrics?: Partial<ScanMetrics> }
	) {
		const current = this.scans.get(scanId)
		if (!current) return

		if (update.status) {
			current.status = update.status
		}
		if (update.metrics) {
			current.metrics = { ...current.metrics, ...update.metrics }
		}
		if (update.errors) {
			current.errors = update.errors
		}
		if (update.completedAt) {
			current.completedAt = update.completedAt
		}

		// Update duration when completed
		if (current.status === 'completed') {
			current.completedAt = current.completedAt || new Date().toISOString()
			current.metrics.durationSec = Math.floor(
				(Date.now() - new Date(current.startedAt).getTime()) / 1000
			)
		}


		// Persist to DB if model is available
		try {
			this.scanModel?.update?.({
				where: { id: current.id },
				data: {
					repositoryId: current.repoId,
					branch: current.branch,
					status: current.status,
					startedAt: new Date(current.startedAt),
					completedAt: current.completedAt ? new Date(current.completedAt) : null,
					filesParsed: current.metrics.filesParsed,
					endpointsDetected: current.metrics.endpointsDetected,
					eventsDetected: current.metrics.eventsDetected,
					typesDetected: current.metrics.typesDetected,
					tokensUsed: current.metrics.tokensUsed,
					durationSec: current.metrics.durationSec,
					errors: current.errors ? current.errors : null
				}
			}).catch(() => {})
		} catch {}

		this.scans.set(scanId, current)
	}

	private async runScan(scanId: string) {
		const scan = this.scans.get(scanId)
		if (!scan) return

		// Phase 1: parsing (list files)
		this.updateScan(scanId, { status: 'parsing' })

		// Resolve repo connection and access token
		const connection = await db.gitHubRepositoryConnection.findFirst({
			where: {
				repositoryId: scan.repoId,
				isActive: true
			},
			include: {
				githubConnection: { select: { accessToken: true, githubUsername: true } }
			}
		})

		if (!connection) {
			throw new Error('Repository connection not found or inactive')
		}

		const accessToken = connection.githubConnection.accessToken
		const [owner, repo] = connection.githubRepoFullName.split('/')

		// Determine target branch
		const repoDetails = await this.githubService.getRepository(accessToken, owner, repo)
		const targetBranch = scan.branch || repoDetails.default_branch || 'main'

		// Get head commit to obtain tree SHA
		const commits = await this.githubService.getRepositoryCommits(accessToken, owner, repo, targetBranch)
		if (!commits || commits.length === 0) {
			throw new Error('No commits found on target branch')
		}
		const treeSha = commits[0]?.commit?.tree?.sha
		if (!treeSha) {
			throw new Error('Unable to resolve tree SHA')
		}

		// Get repository tree recursively
		const tree = await this.githubService.getRepositoryTree(accessToken, owner, repo, treeSha, true)
		const entries: Array<{ path: string; type: string; size?: number; sha: string }> = tree?.tree || []
		const codeExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.java', '.rs', '.cpp', '.c', '.cs'])
		const isCodeFile = (path: string) => {
			const lower = path.toLowerCase()
			return Array.from(codeExtensions).some(ext => lower.endsWith(ext))
		}

		const codeFiles = entries.filter(e => e.type === 'blob' && isCodeFile(e.path))
		this.updateScan(scanId, {
			status: 'parsing',
			metrics: { filesParsed: codeFiles.length }
		})

		// Phase 2: embedding (fetch contents and compute primary metrics)
		this.updateScan(scanId, { status: 'embedding' })

		let endpointsDetected = 0
		let eventsDetected = 0
		let typesDetected = 0
		let tokensUsed = 0

		const MAX_FILES = 400
		for (let i = 0; i < Math.min(codeFiles.length, MAX_FILES); i++) {
			const file = codeFiles[i]
			try {
				const contentRes = await this.githubService.getFileContent(accessToken, owner, repo, file.path, targetBranch)
				let text = ''
				if (contentRes.content && contentRes.encoding === 'base64') {
					text = Buffer.from(contentRes.content, 'base64').toString('utf-8')
				}

				const routeRegex = /(router|app)\.(get|post|put|delete|patch|options|head)\(\s*['"`](.*?)['"`]/gi
				const eventRegex = /\.(emit|on)\(\s*['"`](.*?)['"`]/gi
				const tsTypeRegex = /export\s+(interface|type)\s+\w+/g
				const classRegex = /export\s+class\s+\w+/g

				endpointsDetected += (text.match(routeRegex) || []).length
				eventsDetected += (text.match(eventRegex) || []).length
				typesDetected += (text.match(tsTypeRegex) || []).length + (text.match(classRegex) || []).length
				tokensUsed += Math.ceil(text.length / 4)

				if (i % 50 === 0) {
					this.updateScan(scanId, {
						status: 'embedding',
						metrics: {
							filesParsed: codeFiles.length,
							endpointsDetected,
							eventsDetected,
							typesDetected,
							tokensUsed
						}
					})
				}
			} catch (e) {
				continue
			}
		}

		// Phase 3: generating (finalize)
		this.updateScan(scanId, {
			status: 'generating',
			metrics: {
				filesParsed: codeFiles.length,
				endpointsDetected,
				eventsDetected,
				typesDetected,
				tokensUsed
			}
		})

		// Complete
		this.updateScan(scanId, { status: 'completed' })
	}
}

const scanManager = new InMemoryScanManager()
export const getInMemoryScanForRepo = (repoId: string) => scanManager.getLatestScanForRepo(repoId)

export class ScanController {
	/**
	 * Start a scan for a repository
	 * POST /api/scans
	 */
	static async startScan(req: AuthenticatedRequest, res: Response) {
		try {
			const { repoId, branch } = req.body || {}
			if (!repoId) {
				return sendError(res, 'repoId is required', 400)
			}

			const scan = await scanManager.createScan(repoId, branch || 'main')
			return sendSuccess(res, scan, 'Scan started', 201)
		} catch (error) {
			console.error('Error starting scan:', error)
			return sendError(res, 'Failed to start scan', 500)
		}
	}

	/**
	 * Get scan status by id
	 * GET /api/scans/:id
	 */
	static async getScan(req: AuthenticatedRequest, res: Response) {
		try {
			const { id } = req.params
			let scan = scanManager.getScan(id)
			if (!scan) {
				// Fallback to DB if not in memory
				try {
					const row = await (db as any).scan.findUnique({ where: { id } })
					if (row) {
						scan = {
							id: row.id,
							repoId: row.repositoryId,
							branch: row.branch,
							status: row.status,
							startedAt: row.startedAt.toISOString(),
							completedAt: row.completedAt?.toISOString(),
							metrics: {
								filesParsed: row.filesParsed,
								endpointsDetected: row.endpointsDetected,
								eventsDetected: row.eventsDetected,
								typesDetected: row.typesDetected,
								tokensUsed: row.tokensUsed,
								durationSec: row.durationSec
							},
							errors: row.errors || undefined
						}
					}
				} catch {}
			}
			if (!scan) return sendError(res, 'Scan not found', 404)
			return sendSuccess(res, scan, 'Scan retrieved')
		} catch (error) {
			console.error('Error getting scan:', error)
			return sendError(res, 'Failed to get scan', 500)
		}
	}

	/**
	 * List scans by repository
	 * GET /api/repos/:repoId/scans?limit=1
	 */
	static async listScans(req: AuthenticatedRequest, res: Response) {
		try {
			const { repoId } = req.params
			const limit = Math.max(1, Math.min(100, parseInt(String(req.query.limit || '10'), 10) || 10))
			const rows = await (db as any).scan.findMany({
				where: { repositoryId: repoId },
				orderBy: { updatedAt: 'desc' },
				take: limit
			})
			return sendSuccess(res, rows || [], 'Scans retrieved')
		} catch (error) {
			console.error('Error listing scans:', error)
			return sendError(res, 'Failed to list scans', 500)
		}
	}

	/**
	 * Get active scans (lightweight)
	 * GET /api/scans/active
	 */
	static async activeScans(req: AuthenticatedRequest, res: Response) {
		try {
			const activeStatuses: ScanStatus[] = ['queued', 'parsing', 'embedding', 'generating']
			const rows = await (db as any).scan.findMany({
				where: { status: { in: activeStatuses } },
				select: { id: true, repositoryId: true, status: true, startedAt: true, updatedAt: true }
			})
			return sendSuccess(res, { count: rows?.length || 0, scans: rows || [] }, 'Active scans')
		} catch (error) {
			console.error('Error getting active scans:', error)
			return sendError(res, 'Failed to get active scans', 500)
		}
	}
}

