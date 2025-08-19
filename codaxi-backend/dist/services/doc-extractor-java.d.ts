export type JavaExtractedDoc = {
    kind: 'route';
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
export declare function extractFromJavaSource(filePath: string, code: string): JavaExtractedDoc[];
//# sourceMappingURL=doc-extractor-java.d.ts.map