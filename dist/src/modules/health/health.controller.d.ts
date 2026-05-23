import { HealthCheckService, PrismaHealthIndicator, MemoryHealthIndicator, DiskHealthIndicator } from '@nestjs/terminus';
import { PrismaService } from "../../prisma/prisma.service";
export declare class HealthController {
    private readonly health;
    private readonly prismaIndicator;
    private readonly memory;
    private readonly disk;
    private readonly prisma;
    constructor(health: HealthCheckService, prismaIndicator: PrismaHealthIndicator, memory: MemoryHealthIndicator, disk: DiskHealthIndicator, prisma: PrismaService);
    check(): Promise<import("@nestjs/terminus").HealthCheckResult<import("@nestjs/terminus").HealthIndicatorResult<string, import("@nestjs/terminus").HealthIndicatorStatus, Record<string, any>> & import("@nestjs/terminus").HealthIndicatorResult<"disk"> & import("@nestjs/terminus").HealthIndicatorResult<"memory"> & import("@nestjs/terminus").HealthIndicatorResult<"database">, Partial<import("@nestjs/terminus").HealthIndicatorResult<string, import("@nestjs/terminus").HealthIndicatorStatus, Record<string, any>> & import("@nestjs/terminus").HealthIndicatorResult<"disk"> & import("@nestjs/terminus").HealthIndicatorResult<"memory"> & import("@nestjs/terminus").HealthIndicatorResult<"database">> | undefined, Partial<import("@nestjs/terminus").HealthIndicatorResult<string, import("@nestjs/terminus").HealthIndicatorStatus, Record<string, any>> & import("@nestjs/terminus").HealthIndicatorResult<"disk"> & import("@nestjs/terminus").HealthIndicatorResult<"memory"> & import("@nestjs/terminus").HealthIndicatorResult<"database">> | undefined>>;
}
