import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/app";

describe("GET /api/v1/health", () => {
  it("should return HTTP 200 with service health and database connectivity status", async () => {
    const res = await request(app).get("/api/v1/health");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.status).toBe("healthy");
    expect(res.body.services).toBeDefined();
    expect(res.body.services.database.status).toBe("connected");
    expect(typeof res.body.services.database.latencyMs).toBe("number");
    expect(res.body.system).toBeDefined();
    expect(res.body.system.uptimeSeconds).toBeGreaterThanOrEqual(0);
    expect(res.headers["x-request-id"]).toBeDefined();
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["x-frame-options"]).toBe("DENY");
  });
});
