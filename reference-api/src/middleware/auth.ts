import { Request, Response, NextFunction } from "express";
import { UnauthorizedError } from "../utils/errors";
import { env } from "../config/env";

export function authenticateAdmin(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const apiKeyHeader = req.headers["x-api-key"];

  let token: string | undefined;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7).trim();
  } else if (typeof apiKeyHeader === "string") {
    token = apiKeyHeader.trim();
  }

  if (!token || token !== env.ADMIN_API_KEY) {
    throw new UnauthorizedError("Valid administrative credentials required to access this resource");
  }

  next();
}
