import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/errors";
import { logger } from "../utils/logger";
import { env } from "../config/env";

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  const requestId = req.id || "unknown";
  const timestamp = new Date().toISOString();

  // 1. Handle Zod Validation Errors
  if (err instanceof ZodError) {
    const details = err.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));

    logger.warn(
      {
        requestId,
        method: req.method,
        url: req.originalUrl,
        details,
      },
      "Request validation failed"
    );

    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "The submitted information is invalid. Please check the provided fields.",
        details,
        requestId,
        timestamp,
      },
    });
    return;
  }

  // 2. Handle Body Parser Syntax Errors (Malformed JSON)
  if (err instanceof SyntaxError && "status" in err && err.status === 400 && "body" in err) {
    logger.warn({ requestId, err: err.message }, "Malformed JSON payload received");
    res.status(400).json({
      success: false,
      error: {
        code: "MALFORMED_JSON",
        message: "The request body contains invalid JSON syntax.",
        requestId,
        timestamp,
      },
    });
    return;
  }

  // 3. Handle Custom Application Errors
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error({ requestId, err: err.message, stack: err.stack }, "Operational server error encountered");
    } else {
      logger.warn({ requestId, code: err.code, err: err.message }, "Operational client error");
    }

    const safeMessage =
      err.statusCode >= 500
        ? "An internal database or server error occurred while processing the request."
        : err.message;

    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: safeMessage,
        ...(err.details ? { details: err.details } : {}),
        requestId,
        timestamp,
      },
    });
    return;
  }

  // 4. Handle Prisma Known Database Errors (without leaking internals)
  if (err.constructor.name === "PrismaClientKnownRequestError" || err.constructor.name === "PrismaClientInitializationError") {
    logger.error({ requestId, err: err.message }, "Database operational error intercepted");
    res.status(500).json({
      success: false,
      error: {
        code: "DATABASE_ERROR",
        message: "An internal database error occurred while processing the request.",
        requestId,
        timestamp,
      },
    });
    return;
  }

  // 5. Handle Unhandled / Programmer Exceptions
  logger.error(
    {
      requestId,
      err: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
    },
    "Unhandled unexpected exception encountered"
  );

  res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message:
        env.NODE_ENV === "production"
          ? "An unexpected error occurred. Please contact support."
          : err.message || "An unexpected error occurred.",
      requestId,
      timestamp,
    },
  });
}
