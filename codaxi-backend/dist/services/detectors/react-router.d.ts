export type ReactRouteDoc = {
    path: string;
    citations: Array<{
        filePath: string;
        startLine: number;
        endLine: number;
    }>;
    metadata?: Record<string, any>;
};
export declare function detectReactRouter(filePath: string, code: string): ReactRouteDoc[];
//# sourceMappingURL=react-router.d.ts.map