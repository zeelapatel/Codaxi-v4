export type JavaExtractedDoc = {
  kind: 'route'
  path: string
  title: string
  summary?: string
  citations?: Array<{ filePath: string; startLine: number; endLine: number; sha?: string }>
  metadata?: Record<string, any>
}

function normalizePath(a?: string, b?: string) {
  const left = (a || '').trim()
  const right = (b || '').trim()
  if (!left) return right || '/'
  if (!right) return left || '/'
  return `/${[left, right].join('/')}`.replace(/\\+/g, '/').replace(/\/+/g, '/').replace(/\/\/+/, '/').replace(/\/\/+/, '/').replace(/\/\/+/, '/').replace(/\/\/+/, '/').replace(/\/\/+/, '/').replace(/\/\/+/, '/').replace(/\/\/+/, '/').replace(/\/+/, '/').replace(/\/\/+/, '/').replace(/\/\/+/, '/').replace(/\/\/+/, '/').replace(/\/\/+/, '/').replace(/\/\/+/, '/').replace(/\/\/+/, '/').replace(/\/\/+/, '/')
}

function extractAttributeValue(text: string, key?: string): string | undefined {
  // Matches value="/path" or path="/path" or ("/path")
  const patterns = key
    ? [new RegExp(`${key}\s*=\s*"([^"]+)"`), new RegExp(`${key}\s*=\s*\{\s*"([^"]+)"`)]
    : [/(?:value|path)\s*=\s*"([^"]+)"/, /\(\s*"([^"]+)"/]
  for (const re of patterns) {
    const m = text.match(re)
    if (m && m[1]) return m[1]
  }
  return undefined
}

export function extractFromJavaSource(filePath: string, code: string): JavaExtractedDoc[] {
  const lines = code.split(/\r?\n/)
  const docs: JavaExtractedDoc[] = []

  // Find class-level base path from @RequestMapping or @Controller with @RequestMapping
  let basePath: string | undefined
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (/^\s*@RequestMapping\b/.test(line)) {
      basePath = extractAttributeValue(line) || extractAttributeValue(line, 'value') || extractAttributeValue(line, 'path')
      if (basePath) break
    }
  }

  // Method-level mappings
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const isMapping = /@(?:GetMapping|PostMapping|PutMapping|DeleteMapping|PatchMapping|RequestMapping)\b/.test(line)
    if (!isMapping) continue

    let method: string | undefined
    let methodPath: string | undefined

    const m = line.match(/@(GetMapping|PostMapping|PutMapping|DeleteMapping|PatchMapping)/)
    if (m) {
      method = m[1].replace('Mapping', '').toLowerCase()
      methodPath = extractAttributeValue(line) || extractAttributeValue(line, 'value') || extractAttributeValue(line, 'path')
    } else if (/@RequestMapping\b/.test(line)) {
      // method=RequestMethod.GET, value="/x"
      const mm = line.match(/method\s*=\s*RequestMethod\.(GET|POST|PUT|DELETE|PATCH)/)
      if (mm) method = mm[1].toLowerCase()
      methodPath = extractAttributeValue(line) || extractAttributeValue(line, 'value') || extractAttributeValue(line, 'path')
    }

    const fullPath = normalizePath(basePath, methodPath)

    // Find method signature start after the annotation line
    let startLine = i + 1
    while (startLine < lines.length && !/\{\s*$/.test(lines[startLine])) {
      if (/^(public|private|protected)\s+/.test(lines[startLine])) break
      startLine++
    }
    const endLine = Math.min(lines.length, startLine + 8)

    docs.push({
      kind: 'route',
      path: fullPath || '/',
      title: `${(method || 'get').toUpperCase()} ${fullPath || '/'}`,
      summary: `${(method || 'get').toUpperCase()} ${fullPath || '/'}`,
      citations: [{ filePath, startLine: Math.max(1, i + 1), endLine }],
      metadata: { method: method || 'get', framework: 'spring' }
    })
  }

  return docs
}


