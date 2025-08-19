"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeHtml = sanitizeHtml;
exports.isJsonSerializable = isJsonSerializable;
exports.clampJsonSize = clampJsonSize;
/**
 * Very small sanitizer to strip dangerous tags and attributes.
 * In production consider a vetted lib like sanitize-html or DOMPurify (server-safe).
 */
function sanitizeHtml(input, maxLength = 20000) {
    if (!input)
        return undefined;
    let out = input
        // remove script/style tags and their content
        .replace(/<\s*(script|style)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '')
        // remove on* event handlers
        .replace(/ on[a-z]+\s*=\s*"[^"]*"/gi, '')
        .replace(/ on[a-z]+\s*=\s*'[^']*'/gi, '')
        .replace(/ on[a-z]+\s*=\s*[^\s>]+/gi, '')
        // remove javascript: URLs
        .replace(/javascript:/gi, '');
    if (out.length > maxLength) {
        out = out.slice(0, maxLength);
    }
    return out;
}
function isJsonSerializable(value, maxStringLength = 10000) {
    try {
        const str = JSON.stringify(value);
        if (!str)
            return true;
        return str.length <= maxStringLength;
    }
    catch {
        return false;
    }
}
function clampJsonSize(value, maxStringLength = 10000) {
    try {
        const str = JSON.stringify(value);
        if (str.length <= maxStringLength)
            return value;
        // If too large, return a placeholder
        return { _truncated: true };
    }
    catch {
        return value;
    }
}
//# sourceMappingURL=sanitize.js.map