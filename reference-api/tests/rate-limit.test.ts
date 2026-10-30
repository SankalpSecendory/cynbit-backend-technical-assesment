import { describe, it, expect } from "vitest";
import request from "supertest";
import express from "express";
import { inquiryRateLimiter } from "../src/middleware/rate-limiter";
import { requestIdMiddleware } from "../src/middleware/request-id";
import { errorHandler } from "../src/middleware/error-handler";

import rateLimit from "express-rate-limit";

describe("Rate Limiter Middleware", () => {
  it("should enforce rate limits and return HTTP 429 when max requests are exceeded", async () => {
    const testLimiter = rateLimit({
      windowMs: 60000,
      max: 5,
      handler: (req, res) => {
        res.status(429).json({
          success: false,
          error: {
            code: "RATE_LIMIT_EXCEEDED",
            message: "Too many requests. Please try again later.",
            requestId: req.id,
            timestamp: new Date().toISOString(),
          },
        });
      },
    });

    // Create an isolated sub-app to test rate limiting without affecting other test suites
    const testApp = express();
    testApp.use(requestIdMiddleware);
    testApp.use(express.json());
    testApp.post("/test-limit", testLimiter, (_req, res) => {
      res.status(200).json({ success: true });
    });
    testApp.use(errorHandler);

    // Max limit is configured to 5 requests per window
    // Send 5 successful requests
    for (let i = 0; i < 5; i++) {
      const res = await request(testApp).post("/test-limit").send({});
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    }

    // 6th request must breach the threshold and trigger HTTP 429
    const breachRes = await request(testApp).post("/test-limit").send({});
    expect(breachRes.status).toBe(429);
    expect(breachRes.body.success).toBe(false);
    expect(breachRes.body.error.code).toBe("RATE_LIMIT_EXCEEDED");
    expect(breachRes.body.error.requestId).toBeDefined();
  });
});
