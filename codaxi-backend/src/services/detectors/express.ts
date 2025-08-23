import { parse } from '@babel/parser'
import traverse from '@babel/traverse'

export type ExpressDoc = {
  method: string
  path: string
  citations: Array<{ filePath: string; startLine: number; endLine: number }>
  metadata?: Record<string, any>
}

export function detectExpress(filePath: string, code: string): ExpressDoc[] {
  const out: ExpressDoc[] = []
  let ast: any
  try {
    ast = parse(code, { sourceType: 'unambiguous', plugins: ['typescript', 'jsx', 'decorators-legacy', 'classProperties'] as any })
  } catch {
    return out
  }

  const routerVars = new Set<string>()
  traverse(ast, {
    CallExpression(path) {
      const callee: any = path.node.callee
      // router = Router() or express.Router()
      if (callee?.type === 'Identifier' && callee.name === 'Router') {
        // Find assignment like const router = Router()
        const parent: any = path.parent
        if (parent?.type === 'VariableDeclarator' && parent.id?.name) {
          routerVars.add(parent.id.name)
        }
      }
      if (callee?.type === 'MemberExpression') {
        const objName = (callee.object as any)?.name
        const method = (callee.property as any)?.name
        if (!method) return
        if (['get','post','put','delete','patch','options','head'].includes(method)) {
          const args: any[] = (path.node.arguments as any[]) || []
          const first = args[0]
          if (first?.type === 'StringLiteral') {
            out.push({
              method,
              path: first.value,
              citations: [{ filePath, startLine: (path.node as any).loc?.start.line || 1, endLine: (path.node as any).loc?.end.line || 1 }],
              metadata: { framework: 'express' }
            })
          }
        }
      }
    }
  })
  return out
}


