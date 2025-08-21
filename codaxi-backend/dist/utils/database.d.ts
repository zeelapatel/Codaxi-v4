import { PrismaClient } from '@prisma/client';
declare class DatabaseClient extends PrismaClient {
    constructor();
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    healthCheck(): Promise<boolean>;
}
export declare const db: DatabaseClient;
export {};
//# sourceMappingURL=database.d.ts.map