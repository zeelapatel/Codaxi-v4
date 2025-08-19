interface GenerateOptions {
    method?: string;
    fullPath: string;
    codeContexts: Array<{
        filePath: string;
        snippet: string;
    }>;
}
export type GeneratedApiExamples = {
    params?: {
        path?: Record<string, any>;
        query?: Record<string, any>;
        headers?: Record<string, any>;
    };
    requestSchema?: any;
    requestExample?: any;
    responses?: Record<string, {
        contentType?: string;
        schema?: any;
        example?: any;
    }>;
    errors?: Array<{
        status: number;
        code?: string;
        message?: string;
        example?: any;
    }>;
};
/**
 * Placeholder generator. Later, swap with real LLM provider.
 */
export declare function generateApiExamples(opts: GenerateOptions): Promise<GeneratedApiExamples>;
export declare function generateApiExamplesWithLLM(opts: GenerateOptions): Promise<GeneratedApiExamples>;
export {};
//# sourceMappingURL=ai-generator.d.ts.map