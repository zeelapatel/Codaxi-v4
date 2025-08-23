"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractFromSource = extractFromSource;
exports.enumerateSourceFiles = enumerateSourceFiles;
const parser_1 = require("@babel/parser");
const traverse_1 = __importDefault(require("@babel/traverse"));
const fast_glob_1 = __importDefault(require("fast-glob"));
function extractFromSource(filePath, code) {
    const docs = [];
    let ast;
    try {
        ast = (0, parser_1.parse)(code, {
            sourceType: 'unambiguous',
            plugins: ['typescript', 'jsx', 'decorators-legacy', 'classProperties']
        });
    }
    catch {
        return docs;
    }
    (0, traverse_1.default)(ast, {
        CallExpression(path) {
            const callee = path.node.callee;
            // Express/Koa/Fastify style: app.get('/path', ...)
            if (callee && callee.type === 'MemberExpression' &&
                ['get', 'post', 'put', 'delete', 'patch', 'options', 'head'].includes(callee.property?.name || '')) {
                const args = (path.node.arguments || []);
                if (args?.length && args[0]?.type === 'StringLiteral') {
                    docs.push({
                        kind: 'route',
                        path: args[0].value,
                        title: `${callee.property.name.toUpperCase()} ${args[0].value}`,
                        citations: [{ filePath, startLine: path.node.loc?.start.line || 1, endLine: path.node.loc?.end.line || 1 }],
                        metadata: { method: callee.property.name }
                    });
                }
            }
        },
        TSTypeAliasDeclaration(path) {
            docs.push({
                kind: 'type',
                path: filePath,
                title: path.node.id.name,
                citations: [{ filePath, startLine: path.node.loc?.start.line || 1, endLine: path.node.loc?.end.line || 1 }]
            });
        },
        TSInterfaceDeclaration(path) {
            docs.push({
                kind: 'type',
                path: filePath,
                title: path.node.id.name,
                citations: [{ filePath, startLine: path.node.loc?.start.line || 1, endLine: path.node.loc?.end.line || 1 }]
            });
        },
        ClassDeclaration(path) {
            if (path.node.id?.name) {
                docs.push({
                    kind: 'class',
                    path: filePath,
                    title: path.node.id.name,
                    citations: [{ filePath, startLine: path.node.loc?.start.line || 1, endLine: path.node.loc?.end.line || 1 }]
                });
            }
        },
        FunctionDeclaration(path) {
            if (path.node.id?.name) {
                docs.push({
                    kind: 'function',
                    path: filePath,
                    title: path.node.id.name,
                    citations: [{ filePath, startLine: path.node.loc?.start.line || 1, endLine: path.node.loc?.end.line || 1 }]
                });
            }
        }
    });
    return docs;
}
async function enumerateSourceFiles(rootDir) {
    const patterns = [
        '**/*.{ts,tsx,js,jsx,java}'
    ];
    const ignore = [
        '**/node_modules/**',
        '**/.next/**',
        '**/dist/**',
        '**/build/**',
        '**/coverage/**',
        '**/.turbo/**',
        '**/.cache/**',
        '**/target/**',
        '**/out/**',
        '**/tmp/**'
    ];
    const files = await (0, fast_glob_1.default)(patterns, { cwd: rootDir, ignore, followSymbolicLinks: false, dot: false });
    return files;
}
//# sourceMappingURL=doc-extractor.js.map