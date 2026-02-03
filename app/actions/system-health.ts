'use server'

import { db } from "@/lib/db"
import { r2 } from "@/lib/r2"
import { ListBucketsCommand } from "@aws-sdk/client-s3"
import { Redis } from "@upstash/redis"

// Initialize Redis client using fromEnv which handles loading from process.env
const redis = Redis.fromEnv();

// Helper to check if redis is actually configured
const isRedisConfigured = () => !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

export interface ServiceHealth {
    status: boolean;
    latency: number; // in ms
    message?: string;
}

export interface EnvHealth {
    key: string;
    exists: boolean;
}

export interface DocDistribution {
    type: string;
    count: number;
}

export interface SystemHealth {
    database: ServiceHealth & {
        recordCounts?: { students: number; documents: number; payments: number };
        version?: string;
    };
    redis: ServiceHealth;
    storage: ServiceHealth;
    config: EnvHealth[];
    system: {
        uptime: number;
        memoryUsage: NodeJS.MemoryUsage;
        nodeVersion: string;
        platform: string;
        arch: string;
        region?: string;
        timezone: string;
        env: string;
    };
    documents: DocDistribution[];
    timestamp: Date;
}

export async function checkSystemHealth(): Promise<SystemHealth> {
    const health: SystemHealth = {
        database: { status: false, latency: 0 },
        redis: { status: false, latency: 0 },
        storage: { status: false, latency: 0 },
        config: [],
        system: {
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage(),
            nodeVersion: process.version,
            platform: process.platform,
            arch: process.arch,
            region: process.env.VERCEL_REGION || "Local/Unknown",
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            env: process.env.NODE_ENV || "development"
        },
        documents: [],
        timestamp: new Date()
    };

    // 1. Check Database (Status + Latency + Counts + Version)
    const dbStart = performance.now();
    try {
        // Run parallel queries for speed
        const [studentCount, docCount, paymentCount, dbVersion] = await Promise.all([
            db.student.count(),
            db.studentDocument.count(),
            db.payment.count(),
            db.$queryRaw<{ version: string }[]>`SHOW server_version`
        ]);

        health.database.status = true;
        health.database.recordCounts = {
            students: studentCount,
            documents: docCount,
            payments: paymentCount
        };
        // @ts-ignore - Prisma raw query result typing
        health.database.version = dbVersion[0]?.server_version || "Unknown";

        // Get Document Distribution
        const docGroups = await db.studentDocument.groupBy({
            by: ['fileType'],
            _count: {
                _all: true
            }
        });

        health.documents = docGroups.map(g => ({
            type: g.fileType,
            count: g._count._all
        })).sort((a, b) => b.count - a.count);

    } catch (e: any) {
        console.error("Health Check DB Failed:", e);
        health.database.message = e.message;
    } finally {
        health.database.latency = Math.round(performance.now() - dbStart);
    }

    // 2. Check Redis (Status + Latency)
    const redisStart = performance.now();
    if (isRedisConfigured()) {
        try {
            await redis.ping();
            health.redis.status = true;
        } catch (e: any) {
            console.error("Health Check Redis Failed:", e.message);
            health.redis.message = e.message;
        }
    } else {
        health.redis.message = "Not Configured";
    }
    health.redis.latency = Math.round(performance.now() - redisStart);

    // 3. Check Storage (Status + Latency)
    const storageStart = performance.now();
    try {
        await r2.send(new ListBucketsCommand({}));
        health.storage.status = true;
    } catch (e: any) {
        console.error("Health Check R2 Failed:", e);
        health.storage.message = e.message;
    } finally {
        health.storage.latency = Math.round(performance.now() - storageStart);
    }

    // 4. Config Audit
    const criticalEnvVars = [
        "DATABASE_URL",
        "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
        "CLERK_SECRET_KEY",
        "UPSTASH_REDIS_REST_URL",
        "UPSTASH_REDIS_REST_TOKEN",
        "R2_ACCESS_KEY_ID",
        "R2_SECRET_ACCESS_KEY",
        "R2_BUCKET_NAME",
        "RESEND_API_KEY",
        "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
        "TURNSTILE_SECRET_KEY"
    ];

    health.config = criticalEnvVars.map(key => ({
        key,
        exists: !!process.env[key]
    }));

    return health;
}
