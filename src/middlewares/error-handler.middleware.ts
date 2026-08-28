import { NextFunction, Request, Response } from "express";
import { DomainError } from "../utils/errors";

export interface ErrorEnvelope {
  error: {
    code: string;
    message: string;
    details?: { path: (string | number)[]; message: string }[];
  };
}

/**
 * Central error-handling middleware. Converts thrown domain errors into the
 * standard error envelope. Never leaks stack traces or internal messages to
 * API responses; full details are logged server-side instead.
 */
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof DomainError) {
    console.error({
      requestId: req.headers["x-request-id"],
      code: err.code,
      message: err.message,
      path: req.path,
    });

    const isServerError = err.statusCode >= 500;
    const body: ErrorEnvelope = {
      error: {
        code: err.code,
        message: isServerError ? "An unexpected error occurred" : err.message,
        details: isServerError ? undefined : err.details,
      },
    };
    res.status(err.statusCode).json(body);
    return;
  }

  console.error({
    requestId: req.headers["x-request-id"],
    path: req.path,
    error: err,
  });

  const body: ErrorEnvelope = {
    error: {
      code: "INTERNAL_ERROR",
      message: "An unexpected error occurred",
    },
  };
  res.status(500).json(body);
}
