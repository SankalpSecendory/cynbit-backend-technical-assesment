import express, { Express, Request, Response } from "express";
import helmet from "helmet";
import cors from "cors";
import { env } from "./config/env";
import { requestIdMiddleware } from "./middleware/request-id";
import { errorHandler } from "./middleware/error-handler";
import { apiRouter } from "./routes/inquiry.routes";

export function createApp(): Express {
  const app = express();

  // 1. Trust Reverse Proxy (Cloudflare / Nginx / Vercel Edge)
  app.set("trust proxy", 1);

  // 2. Correlation Request ID Middleware
  app.use(requestIdMiddleware);

  // 3. Security Headers via Helmet
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'"],
        },
      },
      frameguard: { action: "deny" },
      hidePoweredBy: true,
      noSniff: true,
      referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    })
  );

  // 4. Restricted Cross-Origin Resource Sharing (CORS)
  const allowedOrigins = env.CORS_ORIGIN.split(",").map((o) => o.trim());
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
        if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
          callback(null, true);
        } else {
          callback(new Error(`Origin ${origin} not allowed by CORS policy`));
        }
      },
      methods: ["GET", "POST", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Request-Id", "x-api-key"],
      exposedHeaders: ["X-Request-Id", "RateLimit-Limit", "RateLimit-Remaining", "RateLimit-Reset"],
      credentials: true,
      maxAge: 86400, // 24 hours preflight cache
    })
  );

  // 5. Strict Body Parsing with 10kb Limit (Mitigate Buffer Overflow DoS)
  app.use(express.json({ limit: "10kb" }));
  app.use(express.urlencoded({ extended: false, limit: "10kb" }));

  // 6. Mount Versioned API Routes
  app.use("/api/v1", apiRouter);

  // 7. Standard 404 Route Catch-All
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: {
        code: "ROUTE_NOT_FOUND",
        message: `The requested path ${req.method} ${req.originalUrl} does not exist on this server.`,
        requestId: req.id,
        timestamp: new Date().toISOString(),
      },
    });
  });

  // 8. Centralized RFC 7807 Error Handler
  app.use(errorHandler);

  return app;
}

export const app = createApp();
