// redisClient.ts
import { createClient } from "redis";
const REDIS_URL = process.env.REDIS_URL;

export const redisClient = createClient({
  url: REDIS_URL,
});
redisClient.on("error", (err) => console.error("Redis Client Error", err));

export async function initRedis() {
  await redisClient.connect();
  console.log("Connected to Redis");
}
