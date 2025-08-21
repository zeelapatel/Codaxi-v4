"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateApiExamples = generateApiExamples;
exports.generateApiExamplesWithLLM = generateApiExamplesWithLLM;
/**
 * Placeholder generator. Later, swap with real LLM provider.
 */
async function generateApiExamples(opts) {
    // Naive path param inference
    const pathParams = {};
    const pathParamMatches = Array.from(opts.fullPath.matchAll(/\{(\w+)\}/g));
    for (const m of pathParamMatches) {
        pathParams[m[1]] = { type: 'string' };
    }
    // Very simple request body guess for POST/PUT/PATCH
    const isWrite = ['post', 'put', 'patch'].includes((opts.method || '').toLowerCase());
    const requestExample = isWrite ? { id: 'example-id', name: 'Example Name' } : null;
    // Response example
    const okExample = isWrite
        ? { id: 'example-id', created: true }
        : { id: 'example-id', name: 'Example Name' };
    const responses = {
        '200': { contentType: 'application/json', example: okExample }
    };
    const errors = [
        { status: 400, code: 'BadRequest', message: 'Invalid input' },
        { status: 401, code: 'Unauthorized', message: 'Missing/invalid token' },
        { status: 404, code: 'NotFound', message: 'Resource not found' }
    ];
    return {
        params: { path: pathParams },
        requestSchema: undefined,
        requestExample: requestExample || undefined,
        responses,
        errors
    };
}
// --- LLM Integration (OpenAI-compatible) ---
const axios_1 = __importDefault(require("axios"));
async function callOpenAICompatible(messages, opts) {
    const apiUrl = opts.apiUrl || process.env.OPENAI_API_URL || 'https://api.openai.com/v1/chat/completions';
    const model = opts.model || process.env.OPENAI_MODEL || 'gpt-4o-mini';
    const apiKey = opts.apiKey || process.env.OPENAI_API_KEY;
    const timeoutMs = opts.timeoutMs || Number(process.env.LLM_TIMEOUT_MS || 15000);
    const maxRetries = opts.maxRetries ?? Number(process.env.LLM_MAX_RETRIES || 2);
    if (!apiKey)
        throw new Error('Missing LLM API key');
    let lastError;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const resp = await axios_1.default.post(apiUrl, { model, messages, temperature: 0.2, response_format: { type: 'json_object' } }, { headers: { Authorization: `Bearer ${apiKey}` }, timeout: timeoutMs });
            return resp.data;
        }
        catch (e) {
            lastError = e;
            // basic backoff
            const delay = Math.min(2000 * (attempt + 1), 8000);
            await new Promise(r => setTimeout(r, delay));
            continue;
        }
    }
    throw lastError;
}
async function generateApiExamplesWithLLM(opts) {
    const systemPrompt = `You are an API documentation assistant. Given an endpoint and related code snippets, infer request parameters, a sample request body, possible responses (with examples), and common error codes. Return ONLY a JSON object with keys: params, requestSchema, requestExample, responses, errors. Do not add commentary.`;
    const userPayload = {
        method: opts.method?.toUpperCase() || 'GET',
        path: opts.fullPath,
        contexts: opts.codeContexts?.slice(0, 5) || []
    };
    const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Endpoint: ${userPayload.method} ${userPayload.path}\n\nContexts:\n${userPayload.contexts.map(c => `// ${c.filePath}\n${c.snippet}`).join('\n\n')}` }
    ];
    try {
        const data = await callOpenAICompatible(messages, {});
        const content = data?.choices?.[0]?.message?.content;
        if (!content)
            return generateApiExamples(opts);
        const json = JSON.parse(content);
        const out = {
            params: json.params,
            requestSchema: json.requestSchema,
            requestExample: json.requestExample,
            responses: json.responses,
            errors: json.errors
        };
        return out;
    }
    catch (e) {
        return generateApiExamples(opts);
    }
}
//# sourceMappingURL=ai-generator.js.map