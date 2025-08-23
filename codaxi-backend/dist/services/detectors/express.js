"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectExpress = detectExpress;
const parser_1 = require("@babel/parser");
const traverse_1 = __importDefault(require("@babel/traverse"));
function detectExpress(filePath, code) {
    const out = [];
    let ast;
    try {
        ast = (0, parser_1.parse)(code, { sourceType: 'unambiguous', plugins: ['typescript', 'jsx', 'decorators-legacy', 'classProperties'] });
    }
    catch {
        return out;
    }
    const routerVars = new Set();
    (0, traverse_1.default)(ast, {
        CallExpression(path) {
            const callee = path.node.callee;
            // router = Router() or express.Router()
            if (callee?.type === 'Identifier' && callee.name === 'Router') {
                // Find assignment like const router = Router()
                const parent = path.parent;
                if (parent?.type === 'VariableDeclarator' && parent.id?.name) {
                    routerVars.add(parent.id.name);
                }
            }
            if (callee?.type === 'MemberExpression') {
                const objName = callee.object?.name;
                const method = callee.property?.name;
                if (!method)
                    return;
                if (['get', 'post', 'put', 'delete', 'patch', 'options', 'head'].includes(method)) {
                    const args = path.node.arguments || [];
                    const first = args[0];
                    if (first?.type === 'StringLiteral') {
                        out.push({
                            method,
                            path: first.value,
                            citations: [{ filePath, startLine: path.node.loc?.start.line || 1, endLine: path.node.loc?.end.line || 1 }],
                            metadata: { framework: 'express' }
                        });
                    }
                }
            }
        }
    });
    return out;
}
//# sourceMappingURL=express.js.map