import pino from "pino";
import { env } from "../config/env";

export const logger = pino({
  level: env.NODE_ENV === "test" ? "silent" : env.NODE_ENV === "production" ? "info" : "debug",
  redact: {
    paths: [
      "email",
      "phone",
      "password",
      "message",
      "permanentAddress",
      "authorization",
      "req.headers.authorization",
      "req.headers.cookie",
      "*.email",
      "*.phone",
      "*.password",
      "*.message",
      "*.permanentAddress",
    ],
    censor: "[REDACTED]",
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label) => ({ level: label.toUpperCase() }),
  },
});
