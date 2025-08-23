import { parse } from '@babel/parser'
import traverse from '@babel/traverse'

export type NestDoc = {
  method: string
  path: string
  citations: Array<{ filePath: string; startLine: number; endLine: number }>
  metadata?: Record<string, any>
}

export function detectNest(filePath: string, code: string): NestDoc[] {
  const out: NestDoc[] = []
  let ast: any
  try {
    ast = parse(code, { sourceType: 'module', plugins: ['typescript', 'decorators-legacy', 'classProperties'] as any })
  } catch {
    return out
  }

  let classPrefix: string | undefined
  traverse(ast, {
    ClassDeclaration(path) {
      const decos: any[] = (path.node as any).decorators || []
      for (const d of decos) {
        const name = (d.expression as any)?.callee?.name
        if (name === 'Controller') {
          const arg = (d.expression as any)?.arguments?.[0]
          if (arg?.type === 'StringLiteral') classPrefix = arg.value
        }
      }
    },
    ClassMethod(path) {
      const decos: any[] = (path.node as any).decorators || []
      for (const d of decos) {
        const name = (d.expression as any)?.callee?.name
        const arg = (d.expression as any)?.arguments?.[0]
        const route = arg?.type === 'StringLiteral' ? arg.value : ''
        if (['Get','Post','Put','Delete','Patch'].includes(name)) {
          const method = name.toLowerCase()
          const full = `/${[classPrefix || '', route || ''].filter(Boolean).join('/')}`.replace(/\/+/g, '/').replace(/\/+/g, '/').replace(/\/+/g, '/')
          out.push({
            method,
            path: full,
            citations: [{ filePath, startLine: (path.node as any).loc?.start.line || 1, endLine: (path.node as any).loc?.end.line || 1 }],
            metadata: { framework: 'nest' }
          })
        }
      }
    }
  })
  return out
}


