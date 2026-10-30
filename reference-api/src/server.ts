import { app } from "./app";
import { env } from "./config/env";
import { logger } from "./utils/logger";
import { disconnectPrisma } from "./utils/prisma";
import http from "http";

const server = http.createServer(app);

server.listen(env.PORT, () => {
  logger.info(
    {
      port: env.PORT,
      environment: env.NODE_ENV,
      nodeVersion: process.version,
    },
    `Cynbit Inquiry Reference API listening on port ${env.PORT}`
  );
});

// Graceful Shutdown Lifecycle Handler
let isShuttingDown = false;

async function handleGracefulShutdown(signal: string): Promise<void> {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info({ signal }, "Received termination signal; starting graceful shutdown...");

  // Force shutdown timeout after 10 seconds
  const forceShutdownTimer = setTimeout(() => {
    logger.error("Forced termination due to shutdown timeout expiration");
    process.exit(1);
  }, 10000);
  forceShutdownTimer.unref();

  server.close(async () => {
    logger.info("Closed incoming HTTP server connections");
    await disconnectPrisma();
    logger.info("Graceful shutdown completed successfully");
    process.exit(0);
  });
}

process.on("SIGTERM", () => handleGracefulShutdown("SIGTERM"));
process.on("SIGINT", () => handleGracefulShutdown("SIGINT"));

process.on("unhandledRejection", (reason) => {
  logger.error({ reason }, "Unhandled Promise Rejection encountered");
});

process.on("uncaughtException", (error) => {
  logger.fatal({ error }, "Uncaught Exception encountered; terminating process");
  process.exit(1);
});
