"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectNext = detectNext;
function detectNext(filePath, code) {
    const out = [];
    // pages/api/**
    if (/pages[\\/]api[\\/]/.test(filePath)) {
        const rel = filePath.split(/pages[\\/]api[\\/]/)[1] || '';
        const withoutExt = '/' + rel.replace(/\.(t|j)sx?$/, '');
        out.push({ method: 'get', path: withoutExt, citations: [{ filePath, startLine: 1, endLine: Math.min(20, code.split(/\r?\n/).length) }], metadata: { framework: 'next' } });
        return out;
    }
    // app/**/route.ts
    if (/app[\\/].+[\\/]route\.(t|j)s$/.test(filePath)) {
        const rel = filePath.split(/app[\\/]/)[1];
        const routePath = '/' + rel.replace(/[\\/]route\.(t|j)s$/, '');
        out.push({ method: 'get', path: routePath, citations: [{ filePath, startLine: 1, endLine: Math.min(20, code.split(/\r?\n/).length) }], metadata: { framework: 'next' } });
    }
    return out;
}
//# sourceMappingURL=next.js.map