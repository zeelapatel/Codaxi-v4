export type FastifyDoc = {
    method: string;
    path: string;
    citations: Array<{
        filePath: string;
        startLine: number;
        endLine: number;
    }>;
    metadata?: Record<string, any>;
};
export declare function detectFastify(filePath: string, code: string): FastifyDoc[];
//# sourceMappingURL=fastify.d.ts.map