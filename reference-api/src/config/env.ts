import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL must be specified"),
  CORS_ORIGIN: z.string().default("https://www.cynbit.in,http://localhost:3000"),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(15 * 60 * 1000), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(5), // 5 requests per window
  ADMIN_API_KEY: z.string().default("cynbit_test_admin_secret_key_2026"),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("Invalid environment variables configuration:", parsedEnv.error.format());
  process.exit(1);
}

export const env = parsedEnv.data;
