import rateLimit from "express-rate-limit";
import { Request, Response } from "express";
import { env } from "../config/env";

export const inquiryRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.NODE_ENV === "test" ? 100 : env.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true, // Return standard rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: {
        code: "RATE_LIMIT_EXCEEDED",
        message: "Too many inquiries submitted from this IP. Please try again later.",
        requestId: req.id,
        timestamp: new Date().toISOString(),
      },
    });
  },
});
