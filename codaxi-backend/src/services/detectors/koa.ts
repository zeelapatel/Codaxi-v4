import { parse } from '@babel/parser'
import traverse from '@babel/traverse'

export type KoaDoc = {
  method: string
  path: string
  citations: Array<{ filePath: string; startLine: number; endLine: number }>
  metadata?: Record<string, any>
}

export function detectKoa(filePath: string, code: string): KoaDoc[] {
  const out: KoaDoc[] = []
  let ast: any
  try {
    ast = parse(code, { sourceType: 'unambiguous', plugins: ['typescript', 'jsx'] as any })
  } catch {
    return out
  }
  traverse(ast, {
    CallExpression(path) {
      const callee: any = path.node.callee
      if (callee?.type === 'MemberExpression') {
        const method = (callee.property as any)?.name
        if (['get','post','put','delete','patch','options','head'].includes(method)) {
          const args: any[] = (path.node.arguments as any[]) || []
          const first = args[0]
          if (first?.type === 'StringLiteral') {
            out.push({
              method,
              path: first.value,
              citations: [{ filePath, startLine: (path.node as any).loc?.start.line || 1, endLine: (path.node as any).loc?.end.line || 1 }],
              metadata: { framework: 'koa' }
            })
          }
        }
      }
    }
  })
  return out
}


