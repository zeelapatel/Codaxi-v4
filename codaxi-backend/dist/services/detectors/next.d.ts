export type NextDoc = {
    method: string;
    path: string;
    citations: Array<{
        filePath: string;
        startLine: number;
        endLine: number;
    }>;
    metadata?: Record<string, any>;
};
export declare function detectNext(filePath: string, code: string): NextDoc[];
//# sourceMappingURL=next.d.ts.map