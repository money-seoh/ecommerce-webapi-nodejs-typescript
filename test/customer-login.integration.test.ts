import request from "supertest";
import { createApp } from "../src/app";
import { UserService } from "../src/services/user.service";

describe("POST /api/v1/customers/login", () => {
  let loginCustomerSpy: jest.SpyInstance;

  beforeEach(() => {
    loginCustomerSpy = jest.spyOn(UserService.prototype, "loginCustomer");
  });

  afterEach(() => {
    loginCustomerSpy.mockRestore();
  });

  it("should return 200 with a bearer token when credentials are valid", async () => {
    loginCustomerSpy.mockResolvedValue({
      accessToken: "signed-jwt",
      tokenType: "Bearer",
      expiresIn: "1h",
    });

    const app = createApp();

    const response = await request(app).post("/api/v1/customers/login").send({
      email: "jane.doe@example.com",
      password: "Password1",
    });

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({
      accessToken: "signed-jwt",
      tokenType: "Bearer",
      expiresIn: "1h",
    });
  });

  it("should return 400 when the payload is invalid", async () => {
    const app = createApp();

    const response = await request(app).post("/api/v1/customers/login").send({
      email: "not-an-email",
      password: "",
      role: "Admin",
    });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(loginCustomerSpy).not.toHaveBeenCalled();
  });

  it("should return 401 when the service reports invalid credentials", async () => {
    const { UnauthorizedError } = jest.requireActual("../src/utils/errors");
    loginCustomerSpy.mockRejectedValue(new UnauthorizedError("Invalid email or password"));

    const app = createApp();

    const response = await request(app).post("/api/v1/customers/login").send({
      email: "jane.doe@example.com",
      password: "WrongPassword1",
    });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("UNAUTHORIZED");
  });

  it("should return 403 when the service reports an inactive customer account", async () => {
    const { ForbiddenError } = jest.requireActual("../src/utils/errors");
    loginCustomerSpy.mockRejectedValue(new ForbiddenError("Customer account is not active"));

    const app = createApp();

    const response = await request(app).post("/api/v1/customers/login").send({
      email: "jane.doe@example.com",
      password: "Password1",
    });

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("FORBIDDEN");
  });

  it("should return 403 when the service reports a deactivated customer account", async () => {
    const { ForbiddenError } = jest.requireActual("../src/utils/errors");
    loginCustomerSpy.mockRejectedValue(new ForbiddenError("Customer account is not active"));

    const app = createApp();

    const response = await request(app).post("/api/v1/customers/login").send({
      email: "jane.doe@example.com",
      password: "Password1",
    });

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("FORBIDDEN");
    expect(response.body.error.message).toBe("Customer account is not active");
  });

  it("should return 429 when the rate limit is exceeded", async () => {
    loginCustomerSpy.mockResolvedValue({
      accessToken: "signed-jwt",
      tokenType: "Bearer",
      expiresIn: "1h",
    });

    const app = createApp();

    for (let attempt = 0; attempt < 5; attempt += 1) {
      await request(app).post("/api/v1/customers/login").send({
        email: "jane.doe@example.com",
        password: "Password1",
      });
    }

    const response = await request(app).post("/api/v1/customers/login").send({
      email: "jane.doe@example.com",
      password: "Password1",
    });

    expect(response.status).toBe(429);
    expect(response.body.error.code).toBe("TOO_MANY_REQUESTS");
  });
});
