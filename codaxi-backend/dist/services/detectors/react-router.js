"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectReactRouter = detectReactRouter;
const parser_1 = require("@babel/parser");
const traverse_1 = __importDefault(require("@babel/traverse"));
function detectReactRouter(filePath, code) {
    const out = [];
    let ast;
    try {
        ast = (0, parser_1.parse)(code, { sourceType: 'module', plugins: ['typescript', 'jsx'] });
    }
    catch {
        return out;
    }
    (0, traverse_1.default)(ast, {
        JSXOpeningElement(path) {
            const name = path.node.name;
            if (name?.name === 'Route') {
                const pathAttr = path.node.attributes?.find(a => a.name?.name === 'path');
                const value = pathAttr?.value;
                const routePath = value?.type === 'StringLiteral' ? value.value : undefined;
                if (routePath) {
                    out.push({
                        path: routePath,
                        citations: [{ filePath, startLine: path.node.loc?.start.line || 1, endLine: path.node.loc?.end.line || path.node.loc?.start.line || 1 }],
                        metadata: { framework: 'react-router' }
                    });
                }
            }
        },
        CallExpression(path) {
            const callee = path.node.callee;
            if (callee?.name === 'createBrowserRouter') {
                // Not expanding full structure; at least record presence
                out.push({ path: '(react-router)', citations: [{ filePath, startLine: path.node.loc?.start.line || 1, endLine: path.node.loc?.end.line || 1 }], metadata: { framework: 'react-router' } });
            }
        }
    });
    return out;
}
//# sourceMappingURL=react-router.js.map