import { ContextPack } from '../types/context';
type DocNode = {
    path: string;
    metadata?: {
        method?: string;
        framework?: string;
    };
    citations?: Array<{
        filePath: string;
        startLine: number;
        endLine: number;
    }>;
};
type BuildOptions = {
    budgetChars?: number;
    maxFiles?: number;
    resolveDepth?: number;
};
export declare function buildContextPack(repoRoot: string, docNode: DocNode, options?: BuildOptions): Promise<ContextPack>;
export {};
//# sourceMappingURL=context-builder.d.ts.map