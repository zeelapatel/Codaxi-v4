declare class KeepAliveService {
    private static instance;
    private interval;
    private readonly KEEP_ALIVE_INTERVAL;
    private constructor();
    static getInstance(): KeepAliveService;
    start(): void;
    stop(): void;
    private performKeepAlive;
}
export declare const keepAliveService: KeepAliveService;
export {};
//# sourceMappingURL=keep-alive.d.ts.map