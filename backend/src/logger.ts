import pino from "pino";

const isProduction = process.env.NODE_ENV === "production";

/**
 * Structured app logger. Pretty-printed in development, JSON in production (for log
 * aggregators). Never log request/response bodies verbatim — pino-http's request log
 * only ever includes method/url/status/duration, and this instance's redact list covers
 * the header/body paths most likely to carry a token, password or payment secret if a
 * call site ever logs a raw object.
 */
export const logger = pino({
  level: process.env.LOG_LEVEL ?? (isProduction ? "info" : "debug"),
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "*.password",
      "*.passwordHash",
      "*.token",
      "*.jwt",
      "*.signature",
      "*.razorpayKeySecret",
    ],
    censor: "[redacted]",
  },
  ...(isProduction
    ? {}
    : {
        transport: {
          target: "pino-pretty",
          options: { colorize: true, translateTime: "HH:MM:ss", ignore: "pid,hostname" },
        },
      }),
});
