"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectFastify = detectFastify;
const parser_1 = require("@babel/parser");
const traverse_1 = __importDefault(require("@babel/traverse"));
function detectFastify(filePath, code) {
    const out = [];
    let ast;
    try {
        ast = (0, parser_1.parse)(code, { sourceType: 'unambiguous', plugins: ['typescript', 'jsx'] });
    }
    catch {
        return out;
    }
    (0, traverse_1.default)(ast, {
        CallExpression(path) {
            const callee = path.node.callee;
            // fastify.route({...})
            if (callee?.type === 'MemberExpression' && callee.property?.name === 'route') {
                const arg = path.node.arguments?.[0];
                if (arg?.type === 'ObjectExpression') {
                    const props = {};
                    for (const p of arg.properties) {
                        if (p?.key?.name)
                            props[p.key.name] = p.value;
                    }
                    const method = (props['method']?.value || props['method']?.name || 'get').toString().toLowerCase();
                    const url = (props['url']?.value || '').toString();
                    if (url) {
                        out.push({
                            method,
                            path: url,
                            citations: [{ filePath, startLine: path.node.loc?.start.line || 1, endLine: path.node.loc?.end.line || 1 }],
                            metadata: { framework: 'fastify' }
                        });
                    }
                }
            }
        }
    });
    return out;
}
//# sourceMappingURL=fastify.js.map