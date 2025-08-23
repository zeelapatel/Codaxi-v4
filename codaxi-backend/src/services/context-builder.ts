import fs from 'fs'
import path from 'path'
import { parse } from '@babel/parser'
import traverse, { NodePath } from '@babel/traverse'
import * as t from '@babel/types'
import { ContextPack, CodeContext, CodeContextKind } from '../types/context'

type DocNode = {
	path: string
	metadata?: { method?: string; framework?: string }
	citations?: Array<{ filePath: string; startLine: number; endLine: number }>
}

type BuildOptions = {
	budgetChars?: number
	maxFiles?: number
	resolveDepth?: number
}

function readFileSafe(file: string): string | null {
	try {
		return fs.readFileSync(file, 'utf-8')
	} catch {
		return null
	}
}

function detectLanguageByExt(filePath: string): 'js' | 'ts' | 'java' | 'python' | 'other' {
	const lower = filePath.toLowerCase()
	if (/(\.tsx?|\.jsx?)$/.test(lower)) return lower.endsWith('.ts') || lower.endsWith('.tsx') ? 'ts' : 'js'
	if (lower.endsWith('.java')) return 'java'
	if (lower.endsWith('.py')) return 'python'
	return 'other'
}

function sliceWithHeader(code: string, startLineZeroBased: number, endLineExclusive: number): string {
	const lines = code.split(/\r?\n/)
	const header = lines.slice(0, Math.min(lines.length, 20)).join('\n')
	const body = lines.slice(Math.max(0, startLineZeroBased), Math.min(lines.length, endLineExclusive)).join('\n')
	return `${header}\n\n${body}`
}

function extractHandlerJsTs(code: string, citationStart: number, citationEnd: number): { start: number; end: number; snippet: string } | null {
	let ast: t.File
	try {
		ast = parse(code, { sourceType: 'unambiguous', plugins: ['typescript', 'jsx', 'decorators-legacy', 'classProperties'] as any })
	} catch {
		return null
	}
	let best: { start: number; end: number } | null = null
	traverse(ast, {
		Function(path: NodePath<t.Function>) {
			const loc = path.node.loc
			if (!loc) return
			if (loc.start.line <= citationStart && loc.end.line >= citationEnd) {
				const size = loc.end.line - loc.start.line
				if (!best || size < (best.end - best.start)) best = { start: loc.start.line, end: loc.end.line }
			}
		},
		ClassMethod(path: NodePath<t.ClassMethod>) {
			const loc = path.node.loc
			if (!loc) return
			if (loc.start.line <= citationStart && loc.end.line >= citationEnd) {
				const size = loc.end.line - loc.start.line
				if (!best || size < (best.end - best.start)) best = { start: loc.start.line, end: loc.end.line }
			}
		}
	})
	if (!best) return null
	const b = best as { start: number; end: number }
	const snippet = sliceWithHeader(code, b.start - 1, b.end)
	return { start: b.start, end: b.end, snippet }
}

function findImportsForIdentifiersJsTs(code: string, typeNames: string[]): Array<{ name: string; from: string }> {
	let ast: t.File
	try {
		ast = parse(code, { sourceType: 'unambiguous', plugins: ['typescript', 'jsx', 'decorators-legacy', 'classProperties'] as any })
	} catch {
		return []
	}
	const imports: Array<{ name: string; from: string }> = []
	const target = new Set(typeNames)
	traverse(ast, {
		ImportDeclaration(path: NodePath<t.ImportDeclaration>) {
			for (const sp of path.node.specifiers) {
				if (sp.type === 'ImportSpecifier') {
					const imported = (sp.imported as any)?.name
					const local = (sp.local as any)?.name
					if (target.has(local || imported)) {
						imports.push({ name: local || imported, from: (path.node.source as any)?.value })
					}
				}
			}
		}
	})
	return imports
}

function getTypeNamesFromHandlerSignatureJsTs(code: string, startLine: number, endLine: number): string[] {
	const lines = code.split(/\r?\n/)
	const sig = lines.slice(Math.max(0, startLine - 2), Math.min(lines.length, startLine + 3)).join('\n')
	const names = new Set<string>()
	// Basic TS type annotation capture: param: TypeName, Array<TypeName>, Promise<TypeName>
	const regexes = [
		/:\s*([A-Z][A-Za-z0-9_]*)/g,
		/<\s*([A-Z][A-Za-z0-9_]*)\s*>/g
	]
	for (const re of regexes) {
		let m: RegExpExecArray | null
		while ((m = re.exec(sig))) {
			names.add(m[1])
		}
	}
	return Array.from(names)
}

function resolveLocalImportPath(fromFile: string, importSource: string, repoRoot: string): string | null {
	if (!importSource.startsWith('.') && !importSource.startsWith('/')) return null
	const candidates = [
		path.resolve(path.dirname(fromFile), importSource),
		path.resolve(path.dirname(fromFile), importSource + '.ts'),
		path.resolve(path.dirname(fromFile), importSource + '.tsx'),
		path.resolve(path.dirname(fromFile), importSource + '.js'),
		path.resolve(path.dirname(fromFile), importSource + '.jsx'),
		path.resolve(path.dirname(fromFile), importSource, 'index.ts'),
		path.resolve(path.dirname(fromFile), importSource, 'index.tsx'),
		path.resolve(path.dirname(fromFile), importSource, 'index.js'),
	]
	for (const c of candidates) {
		if (fs.existsSync(c)) return c
		// Also try relative to repo root when import path is absolute-like
		const relRoot = path.resolve(repoRoot, importSource.replace(/^\//, ''))
		if (fs.existsSync(relRoot)) return relRoot
	}
	return null
}

function extractTypeOrSchemaSnippetJsTs(code: string, typeName: string): string | null {
	// Simple extraction for interface/type/class named typeName, or zod schema const with same name
	const lines = code.split(/\r?\n/)
	const pattern = new RegExp(`^(export\s+)?(interface|type|class)\s+${typeName}[^\n]*`, 'i')
	let start = -1
	for (let i = 0; i < lines.length; i++) {
		if (pattern.test(lines[i])) { start = i; break }
	}
	if (start >= 0) {
		// naive block capture until matching closing brace count returns to zero
		let brace = 0
		let end = start
		for (let i = start; i < lines.length; i++) {
			brace += (lines[i].match(/\{/g) || []).length
			brace -= (lines[i].match(/\}/g) || []).length
			end = i
			if (brace === 0 && i > start) break
		}
		return lines.slice(Math.max(0, start - 1), Math.min(lines.length, end + 2)).join('\n')
	}
	// zod schema const Foo = z.object({...})
	const zodPattern = new RegExp(`^(export\s+)?const\s+${typeName}\s*=\s*z\.(object|array|union|string|number|boolean)`, 'i')
	for (let i = 0; i < lines.length; i++) {
		if (zodPattern.test(lines[i])) {
			let end = i
			let paren = 0
			for (let j = i; j < lines.length; j++) {
				paren += (lines[j].match(/\(/g) || []).length
				paren -= (lines[j].match(/\)/g) || []).length
				end = j
				if (paren === 0 && j > i) break
			}
			return lines.slice(Math.max(0, i - 1), Math.min(lines.length, end + 2)).join('\n')
		}
	}
	return null
}

function trimByBudget(contexts: CodeContext[], budgetChars: number): CodeContext[] {
	if (budgetChars <= 0) return []
	// Allocate: 50% handler, 30% dto, 20% rest
	const handler = contexts.filter(c => c.kind === 'handler')
	const dto = contexts.filter(c => c.kind === 'dto')
	const rest = contexts.filter(c => c.kind !== 'handler' && c.kind !== 'dto')
	const alloc = {
		handler: Math.floor(budgetChars * 0.5),
		dto: Math.floor(budgetChars * 0.3),
		rest: budgetChars - Math.floor(budgetChars * 0.5) - Math.floor(budgetChars * 0.3)
	}
	const trimSet = (items: CodeContext[], cap: number) => {
		const out: CodeContext[] = []
		let used = 0
		for (const it of items) {
			if (used >= cap) break
			const budgetLeft = cap - used
			let snippet = it.snippet
			if (snippet.length > budgetLeft) snippet = snippet.slice(0, Math.max(0, budgetLeft - 200))
			out.push({ ...it, snippet })
			used += snippet.length
		}
		return out
	}
	return [
		...trimSet(handler, alloc.handler),
		...trimSet(dto, alloc.dto),
		...trimSet(rest, alloc.rest)
	]
}

export async function buildContextPack(repoRoot: string, docNode: DocNode, options?: BuildOptions): Promise<ContextPack> {
	const budgetChars = options?.budgetChars ?? Number(process.env.CONTEXT_BUDGET_CHARS || 12000)
	const maxFiles = options?.maxFiles ?? 8
	const resolveDepth = options?.resolveDepth ?? 1

	const endpoint = {
		method: (docNode.metadata?.method || 'get').toUpperCase(),
		path: docNode.path,
		consumes: undefined as string | undefined,
		produces: 'application/json' as string | undefined,
		auth: undefined as string | undefined
	}

	const contexts: CodeContext[] = []
	const facts: string[] = []

	const primary = (docNode.citations?.[0])
	if (!primary) {
		return { endpoint, contexts: [], facts }
	}
	const primaryRel = primary.filePath.replace(/\\/g, '/')
	const primaryAbs = path.join(repoRoot, primaryRel)
	const code = readFileSafe(primaryAbs)
	if (!code) return { endpoint, contexts: [], facts }

	const lang = detectLanguageByExt(primaryAbs)
	if (lang === 'js' || lang === 'ts') {
		const handler = extractHandlerJsTs(code, primary.startLine, primary.endLine)
		if (handler) {
			contexts.push({ filePath: primaryRel, snippet: handler.snippet, kind: 'handler' })
			// type resolution
			const typeNames = getTypeNamesFromHandlerSignatureJsTs(code, handler.start, handler.end)
			const imports = findImportsForIdentifiersJsTs(code, typeNames)
			let added = 0
			for (const im of imports) {
				if (added >= maxFiles) break
				const resolved = resolveLocalImportPath(primaryAbs, im.from, repoRoot)
				if (!resolved) continue
				const importedCode = readFileSafe(resolved)
				if (!importedCode) continue
				const snippet = extractTypeOrSchemaSnippetJsTs(importedCode, im.name)
				if (snippet) {
					contexts.push({ filePath: resolved.replace(repoRoot + path.sep, '').replace(/\\/g, '/'), snippet, kind: 'dto' })
					added++
				}
			}
		}
		// heuristic facts
		if (/multer|form-data/i.test(code)) facts.push('Consumes: multipart/form-data')
		if (/urlencoded|application\/x-www-form-urlencoded/i.test(code)) facts.push('Consumes: application/x-www-form-urlencoded')
	}

	if (lang === 'java') {
		// Include surrounding lines around citation; simple handler capture
		const snippet = sliceWithHeader(code, Math.max(0, primary.startLine - 10), Math.min(code.split(/\r?\n/).length, primary.endLine + 10))
		contexts.push({ filePath: primaryRel, snippet, kind: 'handler' })
		// Facts from annotations
		if (/\b@PreAuthorize\(/.test(code)) facts.push('Auth: role required')
		if (/\b@ModelAttribute\b/.test(code)) facts.push('Consumes: multipart/form-data')
		if (/\b@RequestBody\b/.test(code)) facts.push('Consumes: application/json')
	}

	// De-duplicate by filePath+kind
	const seen = new Set<string>()
	const dedup: CodeContext[] = []
	for (const c of contexts) {
		const key = `${c.filePath}|${c.kind}`
		if (seen.has(key)) continue
		seen.add(key)
		dedup.push(c)
	}

	const trimmed = trimByBudget(dedup, budgetChars)

	return { endpoint, contexts: trimmed, facts }
}


