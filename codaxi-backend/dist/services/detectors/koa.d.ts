export type KoaDoc = {
    method: string;
    path: string;
    citations: Array<{
        filePath: string;
        startLine: number;
        endLine: number;
    }>;
    metadata?: Record<string, any>;
};
export declare function detectKoa(filePath: string, code: string): KoaDoc[];
//# sourceMappingURL=koa.d.ts.map