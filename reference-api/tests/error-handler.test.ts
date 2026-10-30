import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import express from "express";
import { errorHandler } from "../src/middleware/error-handler";
import { requestIdMiddleware } from "../src/middleware/request-id";
import { DatabaseError, NotFoundError } from "../src/utils/errors";
import { InquiryService } from "../src/services/inquiry.service";
import { IInquiryRepository } from "../src/repositories/inquiry.repository";

describe("Centralized Error Handler & Fault Handling", () => {
  it("should catch DatabaseError and return HTTP 500 with code DATABASE_ERROR without leaking internals", async () => {
    const testApp = express();
    testApp.use(requestIdMiddleware);
    testApp.use(express.json());
    testApp.get("/trigger-db-error", () => {
      throw new DatabaseError("Connection to postgresql://admin:secret@db:5432/db failed");
    });
    testApp.use(errorHandler);

    const res = await request(testApp).get("/trigger-db-error");

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("DATABASE_ERROR");
    // Ensure credentials / connection strings are NOT leaked in response
    expect(res.body.error.message).not.toContain("secret");
    expect(res.body.error.message).not.toContain("postgresql://");
    expect(res.body.error.requestId).toBeDefined();
    expect(res.body.error.timestamp).toBeDefined();
  });

  it("should handle custom NotFoundError with HTTP 404 and code NOT_FOUND", async () => {
    const testApp = express();
    testApp.use(requestIdMiddleware);
    testApp.use(express.json());
    testApp.get("/trigger-not-found", () => {
      throw new NotFoundError("Inquiry record not found in system");
    });
    testApp.use(errorHandler);

    const res = await request(testApp).get("/trigger-not-found");

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("NOT_FOUND");
    expect(res.body.error.message).toBe("Inquiry record not found in system");
  });

  it("should handle unexpected runtime exceptions gracefully without crashing", async () => {
    const testApp = express();
    testApp.use(requestIdMiddleware);
    testApp.use(express.json());
    testApp.get("/trigger-crash", () => {
      throw new Error("Unexpected null reference in domain calculation");
    });
    testApp.use(errorHandler);

    const res = await request(testApp).get("/trigger-crash");

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("INTERNAL_SERVER_ERROR");
    expect(res.body.error.requestId).toBeDefined();
  });

  it("should handle database failure during inquiry creation gracefully via service mock", async () => {
    // Create a mock repository that simulates a catastrophic database outage
    const failingRepoMock: IInquiryRepository = {
      create: vi.fn().mockRejectedValue(new DatabaseError("Simulated database connection failure")),
      findById: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    };

    const failingService = new InquiryService(failingRepoMock);

    await expect(
      failingService.createInquiry(
        {
          name: "Test User",
          email: "test@example.com",
          message: "Valid test message for failure testing",
        },
        "req-fail-id"
      )
    ).rejects.toThrow("Simulated database connection failure");
  });
});
