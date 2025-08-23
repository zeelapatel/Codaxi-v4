import { parse } from '@babel/parser'
import traverse from '@babel/traverse'

export type FastifyDoc = {
  method: string
  path: string
  citations: Array<{ filePath: string; startLine: number; endLine: number }>
  metadata?: Record<string, any>
}

export function detectFastify(filePath: string, code: string): FastifyDoc[] {
  const out: FastifyDoc[] = []
  let ast: any
  try {
    ast = parse(code, { sourceType: 'unambiguous', plugins: ['typescript', 'jsx'] as any })
  } catch {
    return out
  }

  traverse(ast, {
    CallExpression(path) {
      const callee: any = path.node.callee
      // fastify.route({...})
      if (callee?.type === 'MemberExpression' && (callee.property as any)?.name === 'route') {
        const arg: any = (path.node.arguments as any[])?.[0]
        if (arg?.type === 'ObjectExpression') {
          const props: Record<string, any> = {}
          for (const p of arg.properties as any[]) {
            if (p?.key?.name) props[p.key.name] = p.value
          }
          const method = (props['method']?.value || props['method']?.name || 'get').toString().toLowerCase()
          const url = (props['url']?.value || '').toString()
          if (url) {
            out.push({
              method,
              path: url,
              citations: [{ filePath, startLine: (path.node as any).loc?.start.line || 1, endLine: (path.node as any).loc?.end.line || 1 }],
              metadata: { framework: 'fastify' }
            })
          }
        }
      }
    }
  })
  return out
}


