"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectNest = detectNest;
const parser_1 = require("@babel/parser");
const traverse_1 = __importDefault(require("@babel/traverse"));
function detectNest(filePath, code) {
    const out = [];
    let ast;
    try {
        ast = (0, parser_1.parse)(code, { sourceType: 'module', plugins: ['typescript', 'decorators-legacy', 'classProperties'] });
    }
    catch {
        return out;
    }
    let classPrefix;
    (0, traverse_1.default)(ast, {
        ClassDeclaration(path) {
            const decos = path.node.decorators || [];
            for (const d of decos) {
                const name = d.expression?.callee?.name;
                if (name === 'Controller') {
                    const arg = d.expression?.arguments?.[0];
                    if (arg?.type === 'StringLiteral')
                        classPrefix = arg.value;
                }
            }
        },
        ClassMethod(path) {
            const decos = path.node.decorators || [];
            for (const d of decos) {
                const name = d.expression?.callee?.name;
                const arg = d.expression?.arguments?.[0];
                const route = arg?.type === 'StringLiteral' ? arg.value : '';
                if (['Get', 'Post', 'Put', 'Delete', 'Patch'].includes(name)) {
                    const method = name.toLowerCase();
                    const full = `/${[classPrefix || '', route || ''].filter(Boolean).join('/')}`.replace(/\/+/g, '/').replace(/\/+/g, '/').replace(/\/+/g, '/');
                    out.push({
                        method,
                        path: full,
                        citations: [{ filePath, startLine: path.node.loc?.start.line || 1, endLine: path.node.loc?.end.line || 1 }],
                        metadata: { framework: 'nest' }
                    });
                }
            }
        }
    });
    return out;
}
//# sourceMappingURL=nest.js.map