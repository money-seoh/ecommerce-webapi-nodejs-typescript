export type ErrorDetails = { path: (string | number)[]; message: string }[] | undefined;

/**
 * Base class for all typed domain errors. Never throw raw strings or plain
 * `Error` instances from services — throw a subclass of `DomainError` so the
 * central error-handling middleware can map it to the standard error envelope.
 */
export abstract class DomainError extends Error {
  abstract readonly statusCode: number;
  abstract readonly code: string;
  readonly details?: ErrorDetails;

  protected constructor(message: string, details?: ErrorDetails) {
    super(message);
    this.name = new.target.name;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends DomainError {
  readonly statusCode = 400;
  readonly code = "VALIDATION_ERROR";

  constructor(message = "Validation failed", details?: ErrorDetails) {
    super(message, details);
  }
}

export class NotFoundError extends DomainError {
  readonly statusCode = 404;
  readonly code = "NOT_FOUND";

  constructor(message = "Resource not found", details?: ErrorDetails) {
    super(message, details);
  }
}

export class ConflictError extends DomainError {
  readonly statusCode = 409;
  readonly code = "CONFLICT";

  constructor(message = "Resource conflict", details?: ErrorDetails) {
    super(message, details);
  }
}

export class UnauthorizedError extends DomainError {
  readonly statusCode = 401;
  readonly code = "UNAUTHORIZED";

  constructor(message = "Authentication required", details?: ErrorDetails) {
    super(message, details);
  }
}

export class ForbiddenError extends DomainError {
  readonly statusCode = 403;
  readonly code = "FORBIDDEN";

  constructor(message = "Access denied", details?: ErrorDetails) {
    super(message, details);
  }
}

export class TooManyRequestsError extends DomainError {
  readonly statusCode = 429;
  readonly code = "TOO_MANY_REQUESTS";

  constructor(message = "Too many requests", details?: ErrorDetails) {
    super(message, details);
  }
}

export class InternalError extends DomainError {
  readonly statusCode = 500;
  readonly code = "INTERNAL_ERROR";

  constructor(message = "An unexpected error occurred", details?: ErrorDetails) {
    super(message, details);
  }
}
