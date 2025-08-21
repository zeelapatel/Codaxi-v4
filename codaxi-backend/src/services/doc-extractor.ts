import { parse } from '@babel/parser'
import traverse, { NodePath } from '@babel/traverse'

export type ExtractedDoc = {
	kind: 'route' | 'event' | 'type' | 'module' | 'function' | 'class'
	path: string
	title: string
	summary?: string
	citations?: Array<{ filePath: string; startLine: number; endLine: number; sha?: string }>
	metadata?: Record<string, any>
}

export function extractFromSource(filePath: string, code: string): ExtractedDoc[] {
	const docs: ExtractedDoc[] = []
	let ast: any
	try {
		ast = parse(code, {
			sourceType: 'unambiguous',
			plugins: ['typescript', 'jsx', 'decorators-legacy', 'classProperties'] as any
		})
	} catch {
		return docs
	}

	traverse(ast, {
		CallExpression(path: NodePath<any>) {
			const callee = path.node.callee as any
			// Express/Koa/Fastify style: app.get('/path', ...)
			if (
				callee && callee.type === 'MemberExpression' &&
				['get','post','put','delete','patch','options','head'].includes((callee.property as any)?.name || '')
			) {
				const args = (path.node.arguments || []) as any[]
				if (args?.length && args[0]?.type === 'StringLiteral') {
					docs.push({
						kind: 'route',
						path: args[0].value,
						title: `${(callee.property as any).name.toUpperCase()} ${args[0].value}`,
						citations: [{ filePath, startLine: (path.node as any).loc?.start.line || 1, endLine: (path.node as any).loc?.end.line || 1 }],
						metadata: { method: (callee.property as any).name }
					})
				}
			}
		},
		TSTypeAliasDeclaration(path: NodePath<any>) {
			docs.push({
				kind: 'type',
				path: filePath,
				title: (path.node.id as any).name,
				citations: [{ filePath, startLine: (path.node as any).loc?.start.line || 1, endLine: (path.node as any).loc?.end.line || 1 }]
			})
		},
		TSInterfaceDeclaration(path: NodePath<any>) {
			docs.push({
				kind: 'type',
				path: filePath,
				title: (path.node.id as any).name,
				citations: [{ filePath, startLine: (path.node as any).loc?.start.line || 1, endLine: (path.node as any).loc?.end.line || 1 }]
			})
		},
		ClassDeclaration(path: NodePath<any>) {
			if ((path.node.id as any)?.name) {
				docs.push({
					kind: 'class',
					path: filePath,
					title: (path.node.id as any).name,
					citations: [{ filePath, startLine: (path.node as any).loc?.start.line || 1, endLine: (path.node as any).loc?.end.line || 1 }]
				})
			}
		},
		FunctionDeclaration(path: NodePath<any>) {
			if ((path.node.id as any)?.name) {
				docs.push({
					kind: 'function',
					path: filePath,
					title: (path.node.id as any).name,
					citations: [{ filePath, startLine: (path.node as any).loc?.start.line || 1, endLine: (path.node as any).loc?.end.line || 1 }]
				})
			}
		}
	})

	return docs
}


