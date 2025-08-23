// Lightweight Spring detector that improves on regex by scanning annotations lines
// For production, replace with JavaParser/Tree-sitter integration.

export type SpringDoc = {
  method: string
  path: string
  citations: Array<{ filePath: string; startLine: number; endLine: number }>
  metadata?: Record<string, any>
}

function normalizePath(a?: string, b?: string) {
  const left = (a || '').trim().replace(/^\/+|\/+$/g, '')
  const right = (b || '').trim().replace(/^\/+|\/+$/g, '')
  if (!left && !right) return '/'
  return '/' + [left, right].filter(Boolean).join('/')
}

export function detectSpring(filePath: string, code: string): SpringDoc[] {
  const out: SpringDoc[] = []
  const lines = code.split(/\r?\n/)
  let classBase: string | undefined
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (/^\s*@RequestMapping\b/.test(line)) {
      const m = line.match(/(?:value|path)\s*=\s*"([^"]+)"/) || line.match(/\(\s*"([^"]+)"/)
      if (m && m[1]) classBase = m[1]
      break
    }
  }
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const map = line.match(/@(Get|Post|Put|Delete|Patch)Mapping\b/) || line.match(/@RequestMapping\b.*method\s*=\s*RequestMethod\.(GET|POST|PUT|DELETE|PATCH)/)
    if (!map) continue
    const method = (map[1] || map[2] || 'get').toLowerCase()
    const m = line.match(/(?:value|path)\s*=\s*"([^"]+)"/) || line.match(/\(\s*"([^"]+)"/)
    const methodPath = m?.[1] || ''
    const full = normalizePath(classBase, methodPath)
    out.push({ method, path: full, citations: [{ filePath, startLine: Math.max(1, i+1), endLine: Math.min(lines.length, i+8) }], metadata: { framework: 'spring' } })
  }
  return out
}


