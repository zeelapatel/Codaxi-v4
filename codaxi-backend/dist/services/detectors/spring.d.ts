export type SpringDoc = {
    method: string;
    path: string;
    citations: Array<{
        filePath: string;
        startLine: number;
        endLine: number;
    }>;
    metadata?: Record<string, any>;
};
export declare function detectSpring(filePath: string, code: string): SpringDoc[];
//# sourceMappingURL=spring.d.ts.map