/**
 * Very small sanitizer to strip dangerous tags and attributes.
 * In production consider a vetted lib like sanitize-html or DOMPurify (server-safe).
 */
export declare function sanitizeHtml(input?: string, maxLength?: number): string | undefined;
export declare function isJsonSerializable(value: unknown, maxStringLength?: number): boolean;
export declare function clampJsonSize<T>(value: T, maxStringLength?: number): T;
//# sourceMappingURL=sanitize.d.ts.map