import { parse } from '@babel/parser'
import traverse from '@babel/traverse'

export type ReactRouteDoc = {
  path: string
  citations: Array<{ filePath: string; startLine: number; endLine: number }>
  metadata?: Record<string, any>
}

export function detectReactRouter(filePath: string, code: string): ReactRouteDoc[] {
  const out: ReactRouteDoc[] = []
  let ast: any
  try {
    ast = parse(code, { sourceType: 'module', plugins: ['typescript', 'jsx'] as any })
  } catch {
    return out
  }

  traverse(ast, {
    JSXOpeningElement(path) {
      const name: any = path.node.name
      if (name?.name === 'Route') {
        const pathAttr = (path.node.attributes as any[])?.find(a => a.name?.name === 'path')
        const value = pathAttr?.value
        const routePath = value?.type === 'StringLiteral' ? value.value : undefined
        if (routePath) {
          out.push({
            path: routePath,
            citations: [{ filePath, startLine: (path.node as any).loc?.start.line || 1, endLine: (path.node as any).loc?.end.line || (path.node as any).loc?.start.line || 1 }],
            metadata: { framework: 'react-router' }
          })
        }
      }
    },
    CallExpression(path) {
      const callee: any = path.node.callee
      if (callee?.name === 'createBrowserRouter') {
        // Not expanding full structure; at least record presence
        out.push({ path: '(react-router)', citations: [{ filePath, startLine: (path.node as any).loc?.start.line || 1, endLine: (path.node as any).loc?.end.line || 1 }], metadata: { framework: 'react-router' } })
      }
    }
  })
  return out
}


