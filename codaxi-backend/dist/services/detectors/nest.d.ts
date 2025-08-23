export type NestDoc = {
    method: string;
    path: string;
    citations: Array<{
        filePath: string;
        startLine: number;
        endLine: number;
    }>;
    metadata?: Record<string, any>;
};
export declare function detectNest(filePath: string, code: string): NestDoc[];
//# sourceMappingURL=nest.d.ts.map