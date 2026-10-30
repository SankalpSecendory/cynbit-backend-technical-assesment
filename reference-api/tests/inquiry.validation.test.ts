import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/app";

describe("POST /api/v1/inquiries — Validation Rules", () => {
  it("should reject submission when 'name' is missing", async () => {
    const payload = {
      email: "alex@example.com",
      message: "This is a valid inquiry message with sufficient length.",
    };

    const res = await request(app).post("/api/v1/inquiries").send(payload);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(res.body.error.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: "name" })])
    );
  });

  it("should reject submission when 'email' is invalid", async () => {
    const payload = {
      name: "Alex Rivera",
      email: "not-an-email-address",
      message: "This is a valid inquiry message with sufficient length.",
    };

    const res = await request(app).post("/api/v1/inquiries").send(payload);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(res.body.error.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: "email" })])
    );
  });

  it("should reject submission when 'message' is missing", async () => {
    const payload = {
      name: "Alex Rivera",
      email: "alex@example.com",
    };

    const res = await request(app).post("/api/v1/inquiries").send(payload);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(res.body.error.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: "message" })])
    );
  });

  it("should reject submission when 'message' is shorter than 10 characters", async () => {
    const payload = {
      name: "Alex Rivera",
      email: "alex@example.com",
      message: "Too short",
    };

    const res = await request(app).post("/api/v1/inquiries").send(payload);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(res.body.error.details[0].field).toBe("message");
  });

  it("should reject submission when 'message' exceeds 5000 characters", async () => {
    const payload = {
      name: "Alex Rivera",
      email: "alex@example.com",
      message: "A".repeat(5001),
    };

    const res = await request(app).post("/api/v1/inquiries").send(payload);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(res.body.error.details[0].field).toBe("message");
  });

  it("should reject submission with unexpected properties due to strict schema enforcement", async () => {
    const payload = {
      name: "Alex Rivera",
      email: "alex@example.com",
      message: "This is a valid inquiry message with sufficient length.",
      isAdmin: true, // Unexpected injected property
      internalNotes: "Hacker injection attempt",
    };

    const res = await request(app).post("/api/v1/inquiries").send(payload);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("should handle malformed JSON syntax cleanly with HTTP 400 and RFC 7807 error format", async () => {
    const res = await request(app)
      .post("/api/v1/inquiries")
      .set("Content-Type", "application/json")
      .send("{ name: 'broken json string without closing quote, }");

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("MALFORMED_JSON");
    expect(res.body.error.requestId).toBeDefined();
  });
});
