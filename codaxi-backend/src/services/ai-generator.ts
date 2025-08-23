interface GenerateOptions {
  method?: string
  fullPath: string
  codeContexts: Array<{ filePath: string; snippet: string }>
}

export type GeneratedApiExamples = {
  params?: {
    path?: Record<string, any>
    query?: Record<string, any>
    headers?: Record<string, any>
  }
  requestSchema?: any
  requestExample?: any
  responses?: Record<string, { contentType?: string; schema?: any; example?: any }>
  errors?: Array<{ status: number; code?: string; message?: string; example?: any }>
}

/**
 * Placeholder generator. Later, swap with real LLM provider.
 */
export async function generateApiExamples(opts: GenerateOptions): Promise<GeneratedApiExamples> {
  // Naive path param inference
  const pathParams: Record<string, any> = {}
  const pathParamMatches = Array.from(opts.fullPath.matchAll(/\{(\w+)\}/g))
  for (const m of pathParamMatches) {
    pathParams[m[1]] = { type: 'string' }
  }

  // Very simple request body guess for POST/PUT/PATCH
  const isWrite = ['post', 'put', 'patch'].includes((opts.method || '').toLowerCase())
  const requestExample = isWrite ? { id: 'example-id', name: 'Example Name' } : null

  // Response example
  const okExample = isWrite
    ? { id: 'example-id', created: true }
    : { id: 'example-id', name: 'Example Name' }

  const responses: GeneratedApiExamples['responses'] = {
    '200': { contentType: 'application/json', example: okExample }
  }

  const errors: GeneratedApiExamples['errors'] = [
    { status: 400, code: 'BadRequest', message: 'Invalid input' },
    { status: 401, code: 'Unauthorized', message: 'Missing/invalid token' },
    { status: 404, code: 'NotFound', message: 'Resource not found' }
  ]

  return {
    params: { path: pathParams },
    requestSchema: undefined,
    requestExample: requestExample || undefined,
    responses,
    errors
  }
}

// --- LLM Integration (OpenAI-compatible) ---
import axios from 'axios'
import { z } from 'zod'
import { clampJsonSize } from '../utils/sanitize'
import { ContextPack } from '../types/context'

// --- Debug logging helpers (controlled by env) ---
const LLM_DEBUG = String(process.env.LLM_DEBUG || '').toLowerCase() === 'true' || process.env.LLM_DEBUG === '1'
const LLM_LOG_FULL_CONTEXT = String(process.env.LLM_LOG_FULL_CONTEXT || '').toLowerCase() === 'true' || process.env.LLM_LOG_FULL_CONTEXT === '1'
const LLM_LOG_FINAL_JSON = String(process.env.LLM_LOG_FINAL_JSON || '').toLowerCase() === 'true' || process.env.LLM_LOG_FINAL_JSON === '1'
const LLM_LOG_CONTEXT_MAX = Number(process.env.LLM_LOG_CONTEXT_MAX || 4000)
function dbg(...args: any[]) { if (LLM_DEBUG) console.log('[LLM][debug]', ...args) }
function clampText(s: string, max = LLM_LOG_CONTEXT_MAX) { return !s ? s : (s.length > max ? (s.slice(0, max) + `\n... <clipped ${s.length - max} chars>`) : s) }

type LlmProviderOptions = {
  apiUrl?: string
  apiKey?: string
  model?: string
  timeoutMs?: number
  maxRetries?: number
}

async function callOpenAICompatible(messages: any[], opts: LlmProviderOptions): Promise<any> {
  const apiUrl = opts.apiUrl || process.env.OPENAI_API_URL || 'https://api.openai.com/v1/chat/completions'
  const model = opts.model || process.env.OPENAI_MODEL || 'gpt-4o-mini'
  const apiKey = opts.apiKey || process.env.OPENAI_API_KEY
  const timeoutMs = opts.timeoutMs || Number(process.env.LLM_TIMEOUT_MS || 15000)
  const maxRetries = opts.maxRetries ?? Number(process.env.LLM_MAX_RETRIES || 2)

  if (!apiKey) throw new Error('Missing LLM API key')
  if (LLM_DEBUG) {
    const masked = apiKey ? `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}` : 'missing'
    dbg('provider.config', { apiUrl, model, apiKey: masked, timeoutMs, maxRetries })
  }

  let lastError: any
  dbg('provider.call', { apiUrl, model, timeoutMs, maxRetries, messagesCount: messages?.length })
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const resp = await axios.post(
        apiUrl,
        { model, messages, temperature: 0.2, response_format: { type: 'json_object' } },
        { headers: { Authorization: `Bearer ${apiKey}` }, timeout: timeoutMs }
      )
      dbg('provider.response.ok', { status: resp.status, contentLength: (resp.data?.choices?.[0]?.message?.content || '').length, usage: resp.data?.usage })
      return resp.data
    } catch (e) {
      lastError = e
      // basic backoff
      const delay = Math.min(2000 * (attempt + 1), 8000)
      const err: any = e
      const errStatus = err?.response?.status
      const errData = err?.response?.data
      dbg('provider.response.error', { attempt, status: errStatus, hasData: !!errData, dataPreview: clampText(typeof errData === 'string' ? errData : JSON.stringify(errData || {})) })
      await new Promise(r => setTimeout(r, delay))
      continue
    }
  }
  throw lastError
}

export async function generateApiExamplesWithLLM(opts: GenerateOptions): Promise<GeneratedApiExamples> {
  const systemPrompt = `You are an API documentation assistant.
Return ONLY a single valid JSON object with keys exactly: params, requestSchema, requestExample, responses, errors.
- params: { path?: object, query?: object, headers?: object }
- requestSchema: object or null
- requestExample: object or null
- responses: { "200"?: { contentType?: string, schema?: object, example?: object }, ... }
- errors: Array<{ status: number, code?: string, message?: string, example?: object }>
No comments or markdown.`

  const userPayload = {
    method: opts.method?.toUpperCase() || 'GET',
    path: opts.fullPath,
    contexts: opts.codeContexts?.slice(0, 5) || []
  }

  const contexts = (userPayload.contexts || []).map((c) => `// ${c.filePath}\n${(c.snippet || '').slice(0, 2000)}`).join('\n\n')
  const userContent = `Endpoint: ${userPayload.method} ${userPayload.path}\n\nContexts (trimmed):\n${contexts}`
  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userContent }
  ]

  try {
    dbg('generate.withLLM.messages', { system: clampText(systemPrompt, 800), user: clampText(userContent) })
    const data = await callOpenAICompatible(messages, {})
    let content = data?.choices?.[0]?.message?.content
    dbg('generate.withLLM.rawContent', clampText(content || ''))
    if (!content) return generateApiExamples(opts)
    let json: any
    try {
      json = JSON.parse(content)
    } catch (_) {
      // one repair attempt
      const repair = await callOpenAICompatible([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
        { role: 'system', content: 'Your last output was not valid JSON. Return ONLY the JSON object as specified.' }
      ], {})
      content = repair?.choices?.[0]?.message?.content
      dbg('generate.withLLM.repairContent', clampText(content || ''))
      json = content ? JSON.parse(content) : null
      if (!json) return generateApiExamples(opts)
    }
    const out = normalizeOutput(json)
    if (LLM_LOG_FINAL_JSON) dbg('generate.withLLM.finalJson', clampText(JSON.stringify(out)))
    return out
  } catch (e) {
    return generateApiExamples(opts)
  }
}

// ---- Deterministic JSON Contract Generation from ContextPack ----

// More permissive normalization: coerce common shapes from LLM output
function normalizeOutput(json: any): GeneratedApiExamples {
	const raw = (json || {}) as any

	// Params
	let params: any = undefined
	if (raw && typeof raw.params === 'object' && raw.params !== null) {
		const p = raw.params
		const hasKnown = 'path' in p || 'query' in p || 'headers' in p
		if (hasKnown) {
			params = {
				path: typeof p.path === 'object' ? p.path : undefined,
				query: typeof p.query === 'object' ? p.query : undefined,
				headers: typeof p.headers === 'object' ? p.headers : undefined
			}
		} else {
			// Coerce flat object into query params
			params = { query: p }
		}
	}

	// Responses
	let responses: any = undefined
	if (raw && typeof raw.responses === 'object' && raw.responses !== null) {
		responses = {}
		for (const [k, v] of Object.entries(raw.responses)) {
			if (v && typeof v === 'object') {
				responses[String(k)] = {
					contentType: (v as any).contentType || 'application/json',
					schema: (v as any).schema,
					example: (v as any).example
				}
			}
		}
	}

	// Errors
	let errors: any[] | undefined
	if (Array.isArray(raw?.errors)) {
		errors = raw.errors.filter((e: any) => e && typeof e === 'object').map((e: any) => ({
			status: Number(e.status) || 400,
			code: e.code,
			message: e.message,
			example: e.example
		}))
	} else if (raw?.errors && typeof raw.errors === 'object') {
		// Some models output {} or a map; coerce to empty array
		errors = []
	}

	const out: GeneratedApiExamples = {
		params,
		requestSchema: raw.requestSchema,
		requestExample: raw.requestExample ? clampJsonSize(raw.requestExample) : undefined,
		responses,
		errors
	}
	return out
}

export async function generateFromContextPack(pack: ContextPack): Promise<GeneratedApiExamples> {
	const system = `You are an API documentation assistant.
Return ONLY a valid JSON object with keys exactly: params, requestSchema, requestExample, responses, errors.
No comments or markdown. If unsure, leave fields empty rather than guessing.`

	const headerLines: string[] = []
	headerLines.push(`Endpoint: ${pack.endpoint.method} ${pack.endpoint.path}`)
	if (pack.endpoint.consumes) headerLines.push(`Consumes: ${pack.endpoint.consumes}`)
	if (pack.endpoint.produces) headerLines.push(`Produces: ${pack.endpoint.produces}`)
	if (pack.endpoint.auth) headerLines.push(`Auth: ${pack.endpoint.auth}`)
	if (pack.facts?.length) headerLines.push(`Facts: ${pack.facts.join('; ')}`)

	const sections: string[] = []
	const byKind = (k: string) => pack.contexts.filter(c => c.kind === (k as any))
	const emit = (title: string, list: { filePath: string; snippet: string }[]) => {
		if (!list.length) return
		sections.push(`=== ${title} ===`)
		for (const c of list) sections.push(`// ${c.filePath}\n${c.snippet.slice(0, 3500)}`)
	}
	emit('Controller/Method', byKind('handler'))
	emit('DTOs/Schemas', byKind('dto'))
	emit('Controller', byKind('controller'))
	emit('Exceptions', byKind('exception'))
	emit('Middleware', byKind('middleware'))

	const userContent = `${headerLines.join('\n')}\n\n${sections.join('\n\n')}`

	// Debug summaries
	try {
		const ctxSummary = pack.contexts.map(c => ({ filePath: c.filePath, kind: c.kind, length: (c.snippet || '').length }))
		const approxTokensIn = Math.ceil(userContent.length / 4)
		dbg('generate.fromPack.contextSummary', { endpoint: pack.endpoint, contexts_count: pack.contexts.length, approxTokensIn, ctxSummary })
		if (LLM_LOG_FULL_CONTEXT) dbg('generate.fromPack.fullUserContent', clampText(userContent))
	} catch {}

	const messages = [
		{ role: 'system', content: system },
		{ role: 'user', content: userContent }
	]

	try {
		dbg('generate.fromPack.messages', { system: clampText(system, 800), userLen: userContent.length })
		const data = await callOpenAICompatible(messages as any, {})
		let content = data?.choices?.[0]?.message?.content
		dbg('generate.fromPack.rawContent', clampText(content || ''))
		if (!content) return { params: undefined, requestSchema: undefined, requestExample: undefined, responses: { '200': { contentType: 'application/json', example: {} } }, errors: [{ status: 400, message: 'Unknown' }] }
		let json: any
		try { json = JSON.parse(content) } catch (_) {
			const repair = await callOpenAICompatible([
				{ role: 'system', content: system },
				{ role: 'user', content: userContent },
				{ role: 'system', content: 'Return ONLY the JSON object. No commentary.' }
			] as any, {})
			content = repair?.choices?.[0]?.message?.content
			dbg('generate.fromPack.repairContent', clampText(content || ''))
			json = content ? JSON.parse(content) : null
		}
		let out = normalizeOutput(json || {})
		// Post rules
		const method = (pack.endpoint.method || 'GET').toUpperCase()
		if (['PUT','PATCH'].includes(method)) {
			out.responses = out.responses || {}
			if (!out.responses['200'] && !out.responses['204']) {
				out.responses['200'] = { contentType: 'application/json', example: {} }
			}
		}
		if (method === 'POST') {
			out.responses = out.responses || {}
			if (!out.responses['201'] && !out.responses['200']) {
				out.responses['201'] = { contentType: 'application/json', example: {} }
			}
		}
		if ((pack.facts || []).some(f => /Auth:|role required/i.test(f))) {
			out.errors = out.errors || []
			if (!out.errors.some(e => e.status === 403)) {
				out.errors.push({ status: 403, message: 'Forbidden' })
			}
		}
		dbg('generate.fromPack.normalized', { hasResponses: !!out.responses, responseKeys: out.responses ? Object.keys(out.responses) : [], errorsLen: (out.errors || []).length })
		if (LLM_LOG_FINAL_JSON) dbg('generate.fromPack.finalJson', clampText(JSON.stringify(out)))
		return out
	} catch (e) {
		dbg('generate.fromPack.error', { message: (e as any)?.message })
		return { params: undefined, requestSchema: undefined, requestExample: undefined, responses: { '200': { contentType: 'application/json', example: {} } }, errors: [{ status: 400, message: 'Unknown' }] }
	}
}


