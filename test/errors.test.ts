import {
  ValidationError,
  NotFoundError,
  ConflictError,
  UnauthorizedError,
  ForbiddenError,
  TooManyRequestsError,
  InternalError,
} from "../src/utils/errors";

describe("Domain Error Classes", () => {
  describe("ValidationError", () => {
    it("should have statusCode 400 and code VALIDATION_ERROR", () => {
      const err = new ValidationError("bad input");
      expect(err.statusCode).toBe(400);
      expect(err.code).toBe("VALIDATION_ERROR");
      expect(err.message).toBe("bad input");
      expect(err instanceof Error).toBe(true);
    });

    it("should use default message when none provided", () => {
      const err = new ValidationError();
      expect(err.message).toBe("Validation failed");
    });

    it("should store details when provided", () => {
      const details = [{ path: ["email"], message: "Invalid email" }];
      const err = new ValidationError("bad input", details);
      expect(err.details).toEqual(details);
    });
  });

  describe("NotFoundError", () => {
    it("should have statusCode 404 and code NOT_FOUND", () => {
      const err = new NotFoundError("not found");
      expect(err.statusCode).toBe(404);
      expect(err.code).toBe("NOT_FOUND");
      expect(err.message).toBe("not found");
    });

    it("should use default message when none provided", () => {
      const err = new NotFoundError();
      expect(err.message).toBe("Resource not found");
    });
  });

  describe("ConflictError", () => {
    it("should have statusCode 409 and code CONFLICT", () => {
      const err = new ConflictError("duplicate");
      expect(err.statusCode).toBe(409);
      expect(err.code).toBe("CONFLICT");
      expect(err.message).toBe("duplicate");
    });

    it("should use default message when none provided", () => {
      const err = new ConflictError();
      expect(err.message).toBe("Resource conflict");
    });
  });

  describe("UnauthorizedError", () => {
    it("should have statusCode 401 and code UNAUTHORIZED", () => {
      const err = new UnauthorizedError("not authenticated");
      expect(err.statusCode).toBe(401);
      expect(err.code).toBe("UNAUTHORIZED");
    });

    it("should use default message when none provided", () => {
      const err = new UnauthorizedError();
      expect(err.message).toBe("Authentication required");
    });
  });

  describe("ForbiddenError", () => {
    it("should have statusCode 403 and code FORBIDDEN", () => {
      const err = new ForbiddenError("no access");
      expect(err.statusCode).toBe(403);
      expect(err.code).toBe("FORBIDDEN");
    });

    it("should use default message when none provided", () => {
      const err = new ForbiddenError();
      expect(err.message).toBe("Access denied");
    });
  });

  describe("InternalError", () => {
    it("should have statusCode 500 and code INTERNAL_ERROR", () => {
      const err = new InternalError("db exploded");
      expect(err.statusCode).toBe(500);
      expect(err.code).toBe("INTERNAL_ERROR");
      expect(err.message).toBe("db exploded");
    });

    describe("TooManyRequestsError", () => {
      it("should have statusCode 429 and code TOO_MANY_REQUESTS", () => {
        const err = new TooManyRequestsError("limit reached");
        expect(err.statusCode).toBe(429);
        expect(err.code).toBe("TOO_MANY_REQUESTS");
        expect(err.message).toBe("limit reached");
      });

      it("should use default message when none provided", () => {
        const err = new TooManyRequestsError();
        expect(err.message).toBe("Too many requests");
      });
    });

    it("should use default message when none provided", () => {
      const err = new InternalError();
      expect(err.message).toBe("An unexpected error occurred");
    });
  });

  describe("instanceof checks", () => {
    it("all errors should be instanceof Error", () => {
      expect(new ValidationError()).toBeInstanceOf(Error);
      expect(new NotFoundError()).toBeInstanceOf(Error);
      expect(new ConflictError()).toBeInstanceOf(Error);
      expect(new UnauthorizedError()).toBeInstanceOf(Error);
      expect(new ForbiddenError()).toBeInstanceOf(Error);
      expect(new TooManyRequestsError()).toBeInstanceOf(Error);
      expect(new InternalError()).toBeInstanceOf(Error);
    });
  });
});
