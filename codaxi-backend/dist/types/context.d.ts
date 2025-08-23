export type CodeContextKind = 'handler' | 'dto' | 'controller' | 'exception' | 'middleware';
export interface CodeContext {
    filePath: string;
    snippet: string;
    kind: CodeContextKind;
}
export interface ContextEndpoint {
    method: string;
    path: string;
    consumes?: string;
    produces?: string;
    auth?: string;
}
export interface ContextPack {
    endpoint: ContextEndpoint;
    contexts: CodeContext[];
    facts: string[];
}
export interface ProviderResult {
    json?: any;
    raw: string;
    tokensIn: number;
    tokensOut: number;
}
//# sourceMappingURL=context.d.ts.map