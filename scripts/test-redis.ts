
import { Redis } from "@upstash/redis";
import "dotenv/config";

async function main() {
    console.log("Testing Redis Connection...");
    console.log("URL:", process.env.UPSTASH_REDIS_REST_URL);
    console.log("Token Length:", process.env.UPSTASH_REDIS_REST_TOKEN?.length);

    try {
        const redis = Redis.fromEnv();
        const response = await redis.ping();
        console.log("Redis Ping Response:", response);
        console.log("SUCCESS: Redis is connected.");
    } catch (error) {
        console.error("FAILURE: Redis connection failed.");
        console.error(error);
    }
}

main();
