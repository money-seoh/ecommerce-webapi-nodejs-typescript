import { Request, Response, NextFunction } from "express";
import { errorHandler } from "../src/middlewares/error-handler.middleware";
import {
  ValidationError,
  ConflictError,
  InternalError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
} from "../src/utils/errors";

function makeResMock() {
  const res = {
    status: jest.fn(),
    json: jest.fn(),
  } as unknown as Response;
  (res.status as jest.Mock).mockReturnValue(res);
  return res;
}

function makeReqMock(requestId?: string): Request {
  return {
    headers: requestId ? { "x-request-id": requestId } : {},
    path: "/test",
  } as unknown as Request;
}

const next: NextFunction = jest.fn();

describe("errorHandler middleware", () => {
  it("should return 400 for ValidationError with details", () => {
    const err = new ValidationError("Validation failed", [{ path: ["email"], message: "Invalid email" }]);
    const req = makeReqMock("req-1");
    const res = makeResMock();
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    const body = (res.json as jest.Mock).mock.calls[0][0];
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.message).toBe("Validation failed");
    expect(body.error.details).toEqual([{ path: ["email"], message: "Invalid email" }]);
  });

  it("should return 409 for ConflictError", () => {
    const err = new ConflictError("Email already exists");
    const res = makeResMock();
    errorHandler(err, makeReqMock(), res, next);
    expect(res.status).toHaveBeenCalledWith(409);
    const body = (res.json as jest.Mock).mock.calls[0][0];
    expect(body.error.code).toBe("CONFLICT");
    expect(body.error.message).toBe("Email already exists");
  });

  it("should return 404 for NotFoundError", () => {
    const err = new NotFoundError("Resource not found");
    const res = makeResMock();
    errorHandler(err, makeReqMock(), res, next);
    expect(res.status).toHaveBeenCalledWith(404);
    const body = (res.json as jest.Mock).mock.calls[0][0];
    expect(body.error.code).toBe("NOT_FOUND");
  });

  it("should return 401 for UnauthorizedError", () => {
    const err = new UnauthorizedError();
    const res = makeResMock();
    errorHandler(err, makeReqMock(), res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    const body = (res.json as jest.Mock).mock.calls[0][0];
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("should return 403 for ForbiddenError", () => {
    const err = new ForbiddenError();
    const res = makeResMock();
    errorHandler(err, makeReqMock(), res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    const body = (res.json as jest.Mock).mock.calls[0][0];
    expect(body.error.code).toBe("FORBIDDEN");
  });

  it("should return 500 for InternalError and hide details/message", () => {
    const err = new InternalError("Secret DB message");
    const res = makeResMock();
    errorHandler(err, makeReqMock(), res, next);
    expect(res.status).toHaveBeenCalledWith(500);
    const body = (res.json as jest.Mock).mock.calls[0][0];
    expect(body.error.code).toBe("INTERNAL_ERROR");
    expect(body.error.message).toBe("An unexpected error occurred");
    expect(body.error.details).toBeUndefined();
  });

  it("should return 500 for a plain Error (non-DomainError) with generic message", () => {
    const err = new Error("Something went wrong internally");
    const res = makeResMock();
    errorHandler(err, makeReqMock(), res, next);
    expect(res.status).toHaveBeenCalledWith(500);
    const body = (res.json as jest.Mock).mock.calls[0][0];
    expect(body.error.code).toBe("INTERNAL_ERROR");
    expect(body.error.message).toBe("An unexpected error occurred");
    expect(body.error.details).toBeUndefined();
  });

  it("should return 500 for a non-Error thrown value", () => {
    const res = makeResMock();
    errorHandler("string error", makeReqMock(), res, next);
    expect(res.status).toHaveBeenCalledWith(500);
    const body = (res.json as jest.Mock).mock.calls[0][0];
    expect(body.error.code).toBe("INTERNAL_ERROR");
  });

  it("should include x-request-id in log context when present", () => {
    const logSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const err = new ConflictError("Duplicate");
    errorHandler(err, makeReqMock("abc-123"), makeResMock(), next);
    expect(logSpy).toHaveBeenCalledWith(
      expect.objectContaining({ requestId: "abc-123" }),
    );
    logSpy.mockRestore();
  });
});
