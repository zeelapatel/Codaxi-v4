import { Request, Response } from 'express'
import { sendSuccess, sendError } from '../utils/response'
import { AuthenticatedRequest } from '../types'
import { GitHubService } from '../services/github.service'
import { config } from '../config'
import { db } from '../utils/database'
import { extractFromSource } from '../services/doc-extractor'
import { detectExpress } from '../services/detectors/express'
import { detectNest } from '../services/detectors/nest'
import { detectNext } from '../services/detectors/next'
import { detectFastify } from '../services/detectors/fastify'
import { detectKoa } from '../services/detectors/koa'
import { detectReactRouter } from '../services/detectors/react-router'
import { appEvents } from '../utils/events'
import fs from 'fs'
import os from 'os'
import path from 'path'
import tar from 'tar'
import { extractFromJavaSource } from '../services/doc-extractor-java'
import { detectSpring } from '../services/detectors/spring'
function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

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
    parsedFiles?: string[]
}

/**
 * A very simple in-memory scan manager that simulates progressive metrics updates.
 * This replaces a real job queue for now.
 */
class InMemoryScanManager {
	private scans: Map<string, ScanRecord> = new Map()
	private canceled: Set<string> = new Set()
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
			},
            parsedFiles: []
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

	cancelScan(scanId: string) {
		this.canceled.add(scanId)
		// Immediately publish error status so UI updates right away
		this.updateScan(scanId, {
			status: 'error',
			errors: [{ stage: 'cancel', message: 'Canceled by user' }],
			completedAt: new Date().toISOString() as any
		})
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
		// If canceled, only allow final error status updates
		if (this.canceled.has(scanId)) {
			if (!update.status || update.status !== 'error') {
				return
			}
		}
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

		// Emit progress event
		try {
			appEvents.emit('scan-progress', { scanId, scan: current })
		} catch {}
	}

	private async runScan(scanId: string) {
		const scan = this.scans.get(scanId)
		if (!scan) return
		if (this.canceled.has(scanId)) {
			this.updateScan(scanId, { status: 'error', errors: [{ stage: 'cancel', message: 'Canceled by user' }] })
			return
		}

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

		// Prepare local extraction dir
		const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), `codaxi-${scan.repoId}-`))

		// Prefer cached tarball if available to avoid GitHub API
		let tarStream: NodeJS.ReadableStream
		if ((connection as any).tarballFilePath && fs.existsSync((connection as any).tarballFilePath)) {
			tarStream = fs.createReadStream((connection as any).tarballFilePath)
		} else {
			// Fallback: one-time download
			const repoDetails = await this.githubService.getRepository(accessToken, owner, repo)
			const targetBranch = scan.branch || (repoDetails as any).default_branch || 'main'
			tarStream = await this.githubService.downloadTarball(accessToken, owner, repo, targetBranch)
		}
		await new Promise<void>((resolve, reject) => {
			tarStream
				.pipe(tar.x({ cwd: tmpDir }))
				.on('finish', () => resolve())
				.on('error', reject)
		})

		if (this.canceled.has(scanId)) {
			this.updateScan(scanId, { status: 'error', errors: [{ stage: 'cancel', message: 'Canceled by user' }], completedAt: new Date().toISOString() as any })
			return
		}

		// Find single top-level folder created by GitHub tarball
		const [rootFolder] = fs.readdirSync(tmpDir)
		const repoRoot = path.join(tmpDir, rootFolder)

		const codeExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.java'])
		const isCodeFile = (p: string) => Array.from(codeExtensions).some(ext => p.toLowerCase().endsWith(ext))

		// Walk files
		const allFiles: string[] = []
		const stack: string[] = [repoRoot]
		while (stack.length) {
			const dir = stack.pop()!
			for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
				const full = path.join(dir, entry.name)
				if (entry.isDirectory()) stack.push(full)
				else allFiles.push(full)
			}
		}
		const codeFiles = allFiles.filter(isCodeFile)

		this.updateScan(scanId, { status: 'parsing', metrics: { filesParsed: codeFiles.length } })

		// Phase 2: embedding (fetch contents and compute primary metrics)
		this.updateScan(scanId, { status: 'embedding' })

		let tokensUsed = 0

		const MAX_FILES = 400
		const extractedDocs: any[] = []
        const parsedRelPaths = new Set<string>()
		for (let i = 0; i < Math.min(codeFiles.length, MAX_FILES); i++) {
			if (this.canceled.has(scanId)) {
				this.updateScan(scanId, { status: 'error', errors: [{ stage: 'cancel', message: 'Canceled by user' }], completedAt: new Date().toISOString() as any })
				return
			}
			const filePath = codeFiles[i]
			try {
				const text = fs.readFileSync(filePath, 'utf-8')

				tokensUsed += Math.ceil(text.length / 4)

				if (i % 50 === 0) {
					this.updateScan(scanId, {
						status: 'embedding',
						metrics: {
							filesParsed: codeFiles.length,
							tokensUsed
						}
					})
				}

				// Extract docs from source and enrich with summary/html
				if (text) {
					const rel = path.relative(repoRoot, filePath).replace(/\\/g, '/')
                    parsedRelPaths.add(rel)
					let found: any[] = []
					if (/\.(ts|tsx|js|jsx)$/i.test(filePath)) {
						found = [
							...extractFromSource(rel, text),
							...detectExpress(rel, text).map(d => ({ kind: 'route', path: d.path, title: `${d.method.toUpperCase()} ${d.path}`, citations: d.citations, metadata: { method: d.method, framework: d.metadata?.framework } })),
							...detectNest(rel, text).map(d => ({ kind: 'route', path: d.path, title: `${d.method.toUpperCase()} ${d.path}`, citations: d.citations, metadata: { method: d.method, framework: d.metadata?.framework } })),
							...detectNext(rel, text).map(d => ({ kind: 'route', path: d.path, title: `${d.method.toUpperCase()} ${d.path}`, citations: d.citations, metadata: { method: d.method, framework: d.metadata?.framework } })),
							...detectFastify(rel, text).map(d => ({ kind: 'route', path: d.path, title: `${d.method.toUpperCase()} ${d.path}`, citations: d.citations, metadata: { method: d.method, framework: d.metadata?.framework } })),
							...detectKoa(rel, text).map(d => ({ kind: 'route', path: d.path, title: `${d.method.toUpperCase()} ${d.path}`, citations: d.citations, metadata: { method: d.method, framework: d.metadata?.framework } })),
							...detectReactRouter(rel, text).map(d => ({ kind: 'route', path: d.path, title: d.path, citations: d.citations, metadata: { framework: d.metadata?.framework } })),
						]
					} else if (/\.java$/i.test(filePath)) {
						found = [
							...extractFromJavaSource(rel, text),
							...detectSpring(rel, text).map(d => ({ kind: 'route', path: d.path, title: `${d.method.toUpperCase()} ${d.path}`, citations: d.citations, metadata: { method: d.method, framework: d.metadata?.framework } }))
						]
					}
					found = found.map((d) => {
						let html: string | undefined
						let summary: string | undefined
						try {
							if (d.citations && d.citations[0]) {
								const { startLine, endLine } = d.citations[0]
								const lines = text.split(/\r?\n/)
								const snippet = lines.slice(Math.max(0, startLine - 1), Math.min(lines.length, endLine)).join('\n')
								html = `<div><p><strong>${(d.metadata?.method || '').toString().toUpperCase()}</strong> ${d.path}</p><pre><code>${escapeHtml(snippet)}</code></pre></div>`
								// attach snippet to first citation for LLM context
								d.citations = (d.citations as any[]).map((c: any, idx: number) => idx === 0 ? { ...c, snippet } : c)
							}
						} catch {}
						if (d.kind === 'route') {
							summary = `${(d.metadata?.method || '').toString().toUpperCase()} ${d.path}`.trim()
						}
						return { ...d, summary, html }
					})
					extractedDocs.push(...found)
				}
			} catch (e) {
				continue
			}
		}

		// Phase 3: generating (finalize)
		// attach parsed files list in-memory
		const currentScan = this.scans.get(scanId)
		if (currentScan) {
			currentScan.parsedFiles = Array.from(parsedRelPaths)
			this.scans.set(scanId, currentScan)
		}
		// Compute metrics from aggregated docs to avoid mismatch
		const serverFrameworks = new Set(['express','nest','fastify','koa','spring','next'])
		const uniqueServer = new Set<string>()
		const uniqueClient = new Set<string>()
		for (const d of extractedDocs) {
			if (d.kind !== 'route') continue
			const fw = (d.metadata?.framework || '').toString().toLowerCase()
			const method = (d.metadata?.method || 'get').toString().toLowerCase()
			const key = `${method}|${d.path}|${fw}`
			if (serverFrameworks.has(fw)) uniqueServer.add(key)
			else uniqueClient.add(`${d.path}|${fw}`)
		}
		this.updateScan(scanId, {
			status: 'generating',
			metrics: {
				filesParsed: codeFiles.length,
				endpointsDetected: uniqueServer.size as any,
				eventsDetected: 0 as any,
				typesDetected: 0 as any,
				tokensUsed
			}
		})

		// Persist extracted docs
		try {
			if (extractedDocs.length > 0) {
				// Deduplicate by kind+title+path
				const seen = new Set<string>()
				const unique = extractedDocs.filter(d => {
					const key = `${d.kind}|${d.title}|${d.path}`
					if (seen.has(key)) return false
					seen.add(key)
					return true
				})
				await (db as any).docNode.createMany({
					data: unique.map(d => ({
						repositoryId: scan.repoId,
						scanId: scan.id,
						kind: d.kind,
						path: d.path,
						title: d.title,
						summary: d.summary || null,
						citations: d.citations || null,
						html: d.html || null,
						metadata: d.metadata || null
					}))
				})
			}
		} catch (e) {
			console.warn('Failed to persist extracted doc nodes', e)
		}

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
	 * Cancel an in-progress scan
	 * POST /api/scans/:id/cancel
	 */
	static async cancelScan(req: AuthenticatedRequest, res: Response) {
		try {
			const { id } = req.params
			scanManager.cancelScan(id)
			return sendSuccess(res, { id }, 'Scan cancel requested')
		} catch (error) {
			return sendError(res, 'Failed to cancel scan', 500)
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
							errors: row.errors || undefined,
							parsedFiles: []
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
	 * SSE: stream scan progress
	 */
	static async streamScan(req: AuthenticatedRequest, res: Response) {
		try {
			const { id } = req.params
			res.setHeader('Content-Type', 'text/event-stream')
			res.setHeader('Cache-Control', 'no-cache')
			res.setHeader('Connection', 'keep-alive')
			res.flushHeaders?.()

			const send = (data: any) => {
				res.write(`data: ${JSON.stringify(data)}\n\n`)
			}

			const listener = (evt: any) => {
				if (evt.scanId === id) send(evt)
			}
			appEvents.on('scan-progress', listener)

			// Send initial state
			const init = scanManager.getScan(id)
			if (init) send({ scanId: id, scan: init })

			req.on('close', () => {
				appEvents.off('scan-progress', listener)
				res.end()
			})
		} catch (e) {
			return sendError(res as any, 'Failed to stream scan', 500)
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

