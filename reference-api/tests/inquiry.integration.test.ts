import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { prisma } from "../src/utils/prisma";
import { env } from "../src/config/env";

describe("Inquiry Integration Workflows", () => {
  beforeAll(async () => {
    // Clean up test database state
    try {
      await prisma.inquiry.deleteMany({});
    } catch {
      // Table might not exist yet before first push
    }
  });

  afterAll(async () => {
    try {
      await prisma.inquiry.deleteMany({});
      await prisma.$disconnect();
    } catch {
      // Disconnect cleanly
    }
  });

  it("should successfully create a new inquiry and return HTTP 201 Created", async () => {
    const validPayload = {
      name: "Sankalp Sharma",
      email: "sankalp@example.com",
      company: "Cynbit Technologies Partner Lab",
      industry: "Autonomous AI Agents",
      message: "We are interested in collaborating on autonomous agents and digital infrastructure.",
    };

    const res = await request(app).post("/api/v1/inquiries").send(validPayload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.inquiryId).toBeDefined();
    expect(typeof res.body.data.inquiryId).toBe("string");
    expect(res.body.data.status).toBe("received");
    expect(res.headers["x-request-id"]).toBeDefined();

    // Verify durable persistence in database
    const savedInquiry = await prisma.inquiry.findUnique({
      where: { id: res.body.data.inquiryId },
    });

    expect(savedInquiry).not.toBeNull();
    expect(savedInquiry?.name).toBe("Sankalp Sharma");
    expect(savedInquiry?.email).toBe("sankalp@example.com");
    expect(savedInquiry?.company).toBe("Cynbit Technologies Partner Lab");
  });

  it("should reject administrative listing without authorization credentials (HTTP 401)", async () => {
    const res = await request(app).get("/api/v1/inquiries");

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it("should reject administrative listing with invalid Bearer token (HTTP 401)", async () => {
    const res = await request(app)
      .get("/api/v1/inquiries")
      .set("Authorization", "Bearer invalid_secret_token");

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it("should permit administrative listing with valid Bearer token and return paginated inquiries (HTTP 200)", async () => {
    const res = await request(app)
      .get("/api/v1/inquiries?page=1&limit=10")
      .set("Authorization", `Bearer ${env.ADMIN_API_KEY}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.pagination).toBeDefined();
    expect(res.body.pagination.page).toBe(1);
    expect(res.body.pagination.limit).toBe(10);
    expect(res.body.pagination.totalCount).toBeGreaterThanOrEqual(1);
  });

  it("should return HTTP 404 with standardized error contract for undefined routes", async () => {
    const res = await request(app).get("/api/v1/non-existent-endpoint");

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("ROUTE_NOT_FOUND");
    expect(res.body.error.requestId).toBeDefined();
  });
});
