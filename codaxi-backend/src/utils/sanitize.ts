/**
 * Very small sanitizer to strip dangerous tags and attributes.
 * In production consider a vetted lib like sanitize-html or DOMPurify (server-safe).
 */
export function sanitizeHtml(input?: string, maxLength: number = 20_000): string | undefined {
  if (!input) return undefined
  let out = input
    // remove script/style tags and their content
    .replace(/<\s*(script|style)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '')
    // remove on* event handlers
    .replace(/ on[a-z]+\s*=\s*"[^"]*"/gi, '')
    .replace(/ on[a-z]+\s*=\s*'[^']*'/gi, '')
    .replace(/ on[a-z]+\s*=\s*[^\s>]+/gi, '')
    // remove javascript: URLs
    .replace(/javascript:/gi, '')
  
  if (out.length > maxLength) {
    out = out.slice(0, maxLength)
  }
  return out
}

export function isJsonSerializable(value: unknown, maxStringLength: number = 10_000): boolean {
  try {
    const str = JSON.stringify(value)
    if (!str) return true
    return str.length <= maxStringLength
  } catch {
    return false
  }
}

export function clampJsonSize<T>(value: T, maxStringLength: number = 10_000): T {
  try {
    const str = JSON.stringify(value)
    if (str.length <= maxStringLength) return value
    // If too large, return a placeholder
    return { _truncated: true } as unknown as T
  } catch {
    return value
  }
}


