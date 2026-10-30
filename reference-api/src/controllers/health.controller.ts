import { Request, Response } from "express";
import { prisma } from "../utils/prisma";
import { logger } from "../utils/logger";
import { env } from "../config/env";

export class HealthController {
  async getHealth(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    let dbStatus = "unreachable";
    let isHealthy = false;

    try {
      // Actively verify database connectivity by executing a lightweight query
      await prisma.$queryRaw`SELECT 1`;
      dbStatus = "connected";
      isHealthy = true;
    } catch (err: unknown) {
      logger.error({ requestId: req.id, err }, "Database health check failed");
      dbStatus = "disconnected";
    }

    const responsePayload = {
      success: isHealthy,
      status: isHealthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      services: {
        database: {
          status: dbStatus,
          latencyMs: Date.now() - startTime,
        },
      },
      system: {
        uptimeSeconds: Math.floor(process.uptime()),
        memoryUsageMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
        environment: env.NODE_ENV,
        nodeVersion: process.version,
      },
    };

    res.status(isHealthy ? 200 : 503).json(responsePayload);
  }
}

export const healthController = new HealthController();
