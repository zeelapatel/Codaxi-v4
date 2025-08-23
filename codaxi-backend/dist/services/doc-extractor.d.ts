export type ExtractedDoc = {
    kind: 'route' | 'event' | 'type' | 'module' | 'function' | 'class';
    path: string;
    title: string;
    summary?: string;
    citations?: Array<{
        filePath: string;
        startLine: number;
        endLine: number;
        sha?: string;
    }>;
    metadata?: Record<string, any>;
};
export declare function extractFromSource(filePath: string, code: string): ExtractedDoc[];
export declare function enumerateSourceFiles(rootDir: string): Promise<string[]>;
//# sourceMappingURL=doc-extractor.d.ts.map