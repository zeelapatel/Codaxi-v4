export type ExpressDoc = {
    method: string;
    path: string;
    citations: Array<{
        filePath: string;
        startLine: number;
        endLine: number;
    }>;
    metadata?: Record<string, any>;
};
export declare function detectExpress(filePath: string, code: string): ExpressDoc[];
//# sourceMappingURL=express.d.ts.map