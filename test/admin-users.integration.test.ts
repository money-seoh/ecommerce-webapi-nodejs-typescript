import request from "supertest";
import { createApp } from "../src/app";
import { userController } from "../src/config/container";
import { UserService } from "../src/services/user.service";
import { createAccessToken } from "../src/utils/token";

function adminAuthorizationHeader(): { authorization: string } {
  return { authorization: ["Bearer", createAccessToken(1, "Admin")].join(" ") };
}

function customerAuthorizationHeader(): { authorization: string } {
  return { authorization: ["Bearer", createAccessToken(2, "Customer")].join(" ") };
}

describe("POST /api/v1/admin/users", () => {
  let createAdminUserSpy: jest.SpyInstance;
  let activateUserSpy: jest.SpyInstance;
  let assertActiveAdminUserSpy: jest.SpyInstance;
  let hasAnyAdminUsersSpy: jest.SpyInstance;

  beforeEach(() => {
    createAdminUserSpy = jest.spyOn(UserService.prototype, "createAdminUser");
    activateUserSpy = jest.spyOn(UserService.prototype, "activateUser");
    assertActiveAdminUserSpy = jest
      .spyOn(UserService.prototype, "assertActiveAdminUser")
      .mockResolvedValue();
    hasAnyAdminUsersSpy = jest
      .spyOn(UserService.prototype, "hasAnyAdminUsers")
      .mockResolvedValue(false);
  });

  afterEach(() => {
    createAdminUserSpy.mockRestore();
    activateUserSpy.mockRestore();
    assertActiveAdminUserSpy.mockRestore();
    hasAnyAdminUsersSpy.mockRestore();
  });

  it("should create an admin user and return 201 when the payload is valid", async () => {
    createAdminUserSpy.mockResolvedValue({
      id: 1,
      firstName: "Jane",
      lastName: "Doe",
      email: "jane.doe@example.com",
      mobileNumber: "+15551234567",
      role: "Admin",
      isActive: true,
      deactivatedAt: null,
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
      updatedAt: new Date("2024-01-01T00:00:00.000Z"),
    });

    const app = createApp();

    const response = await request(app).post("/api/v1/admin/users").send({
      firstName: "Jane",
      lastName: "Doe",
      email: "jane.doe@example.com",
      mobileNumber: "+15551234567",
      password: "Password1",
      role: "Admin",
    });

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({ email: "jane.doe@example.com", role: "Admin", isActive: true });
    expect(userController).toBeDefined();
  });

  it("should create a customer user as inactive when the payload is valid", async () => {
    createAdminUserSpy.mockResolvedValue({
      id: 2,
      firstName: "John",
      lastName: "Smith",
      email: "john.smith@example.com",
      mobileNumber: "+15559876543",
      role: "Customer",
      isActive: false,
      deactivatedAt: null,
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
      updatedAt: new Date("2024-01-01T00:00:00.000Z"),
    });

    const app = createApp();

    const response = await request(app).post("/api/v1/admin/users").send({
      firstName: "John",
      lastName: "Smith",
      email: "john.smith@example.com",
      mobileNumber: "+15559876543",
      password: "Password1",
      role: "Customer",
    });

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({ email: "john.smith@example.com", role: "Customer", isActive: false });
  });

  it("should return 400 when required fields are missing", async () => {
    const app = createApp();

    const response = await request(app).post("/api/v1/admin/users").send({
      email: "not-an-email",
    });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(createAdminUserSpy).not.toHaveBeenCalled();
  });

  it("should return 409 when the service reports a duplicate email", async () => {
    const { ConflictError } = jest.requireActual("../src/utils/errors");
    createAdminUserSpy.mockRejectedValue(new ConflictError("A user with this email already exists"));

    const app = createApp();

    const response = await request(app).post("/api/v1/admin/users").send({
      firstName: "Jane",
      lastName: "Doe",
      email: "jane.doe@example.com",
      mobileNumber: "+15551234567",
      password: "Password1",
      role: "Admin",
    });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe("CONFLICT");
  });

  it("should return 400 with details when individual fields fail validation", async () => {
    const app = createApp();

    const response = await request(app).post("/api/v1/admin/users").send({
      firstName: "",
      lastName: "Doe",
      email: "not-valid",
      mobileNumber: "invalid-number",
      password: "short",
      role: "Admin",
    });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(Array.isArray(response.body.error.details)).toBe(true);
  });

  it("should return 400 when client attempts to control activation in the payload", async () => {
    const app = createApp();

    const response = await request(app).post("/api/v1/admin/users").send({
      firstName: "Jane",
      lastName: "Doe",
      email: "jane.doe@example.com",
      mobileNumber: "+15551234567",
      password: "Password1",
      role: "Admin",
      isActive: false,
    });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(createAdminUserSpy).not.toHaveBeenCalled();
  });

  it("should return 500 when the service throws an unexpected error", async () => {
    createAdminUserSpy.mockRejectedValue(new Error("unexpected"));

    const app = createApp();

    const response = await request(app).post("/api/v1/admin/users").send({
      firstName: "Jane",
      lastName: "Doe",
      email: "jane.doe@example.com",
      mobileNumber: "+15551234567",
      password: "Password1",
      role: "Admin",
    });

    expect(response.status).toBe(500);
    expect(response.body.error.code).toBe("INTERNAL_ERROR");
  });

  it("should return 401 when an Admin already exists and no auth token is provided", async () => {
    hasAnyAdminUsersSpy.mockResolvedValue(true);

    const app = createApp();
    const response = await request(app).post("/api/v1/admin/users").send({
      firstName: "Jane",
      lastName: "Doe",
      email: "jane.doe@example.com",
      mobileNumber: "+15551234567",
      password: "Password1",
      role: "Admin",
    });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("UNAUTHORIZED");
    expect(createAdminUserSpy).not.toHaveBeenCalled();
  });

  it("should return 403 when an Admin exists and caller is not Admin", async () => {
    hasAnyAdminUsersSpy.mockResolvedValue(true);

    const app = createApp();
    const response = await request(app)
      .post("/api/v1/admin/users")
      .set(customerAuthorizationHeader())
      .send({
        firstName: "Jane",
        lastName: "Doe",
        email: "jane.doe@example.com",
        mobileNumber: "+15551234567",
        password: "Password1",
        role: "Admin",
      });

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("FORBIDDEN");
    expect(createAdminUserSpy).not.toHaveBeenCalled();
  });

  it("should allow creation when an Admin exists and caller is authenticated as Admin", async () => {
    hasAnyAdminUsersSpy.mockResolvedValue(true);
    createAdminUserSpy.mockResolvedValue({
      id: 1,
      firstName: "Jane",
      lastName: "Doe",
      email: "jane.doe@example.com",
      mobileNumber: "+15551234567",
      role: "Admin",
      isActive: true,
      deactivatedAt: null,
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
      updatedAt: new Date("2024-01-01T00:00:00.000Z"),
    });

    const app = createApp();
    const response = await request(app)
      .post("/api/v1/admin/users")
      .set(adminAuthorizationHeader())
      .send({
        firstName: "Jane",
        lastName: "Doe",
        email: "jane.doe@example.com",
        mobileNumber: "+15551234567",
        password: "Password1",
        role: "Admin",
      });

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({ email: "jane.doe@example.com", role: "Admin", isActive: true });
    expect(assertActiveAdminUserSpy).toHaveBeenCalledWith(1);
  });

  it("should activate an inactive user and return 200 when an Admin exists and caller is Admin", async () => {
    hasAnyAdminUsersSpy.mockResolvedValue(true);
    activateUserSpy.mockResolvedValue({
      id: 2,
      firstName: "John",
      lastName: "Smith",
      email: "john.smith@example.com",
      mobileNumber: "+15559876543",
      role: "Customer",
      isActive: true,
      deactivatedAt: null,
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
      updatedAt: new Date("2024-01-02T00:00:00.000Z"),
    });

    const app = createApp();
    const response = await request(app)
      .patch("/api/v1/admin/users/2/activate")
      .set(adminAuthorizationHeader());

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({ id: 2, isActive: true, deactivatedAt: null });
    expect(activateUserSpy).toHaveBeenCalledWith(2);
    expect(assertActiveAdminUserSpy).toHaveBeenCalledWith(1);
  });

  it("should return 400 when activation userId path param is invalid", async () => {
    hasAnyAdminUsersSpy.mockResolvedValue(true);

    const app = createApp();
    const response = await request(app)
      .patch("/api/v1/admin/users/not-a-number/activate")
      .set(adminAuthorizationHeader());

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(activateUserSpy).not.toHaveBeenCalled();
  });

  it("should return 404 when activation target does not exist", async () => {
    const { NotFoundError } = jest.requireActual("../src/utils/errors");
    hasAnyAdminUsersSpy.mockResolvedValue(true);
    activateUserSpy.mockRejectedValue(new NotFoundError("User not found"));

    const app = createApp();
    const response = await request(app)
      .patch("/api/v1/admin/users/999/activate")
      .set(adminAuthorizationHeader());

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("NOT_FOUND");
  });

  it("should return 409 when activation target is already active", async () => {
    const { ConflictError } = jest.requireActual("../src/utils/errors");
    hasAnyAdminUsersSpy.mockResolvedValue(true);
    activateUserSpy.mockRejectedValue(new ConflictError("User account is already active"));

    const app = createApp();
    const response = await request(app)
      .patch("/api/v1/admin/users/2/activate")
      .set(adminAuthorizationHeader());

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe("CONFLICT");
  });

  it("should return 401 for activation when no authorization header is provided", async () => {
    hasAnyAdminUsersSpy.mockResolvedValue(true);

    const app = createApp();
    const response = await request(app).patch("/api/v1/admin/users/2/activate");

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("UNAUTHORIZED");
    expect(activateUserSpy).not.toHaveBeenCalled();
    expect(hasAnyAdminUsersSpy).toHaveBeenCalled();
    expect(assertActiveAdminUserSpy).not.toHaveBeenCalled();
  });

  it("should return 401 for activation when the bearer token has extra fields", async () => {
    hasAnyAdminUsersSpy.mockResolvedValue(true);
    const adminToken = createAccessToken(1, "Admin");

    const app = createApp();
    const response = await request(app)
      .patch("/api/v1/admin/users/2/activate")
      .set("authorization", "Bearer " + adminToken + " extra");

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("UNAUTHORIZED");
    expect(activateUserSpy).not.toHaveBeenCalled();
    expect(assertActiveAdminUserSpy).not.toHaveBeenCalled();
  });

  it("should allow activation without auth when no Admin exists yet", async () => {
    activateUserSpy.mockResolvedValue({
      id: 2,
      firstName: "John",
      lastName: "Smith",
      email: "john.smith@example.com",
      mobileNumber: "+15559876543",
      role: "Customer",
      isActive: true,
      deactivatedAt: null,
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
      updatedAt: new Date("2024-01-02T00:00:00.000Z"),
    });

    const app = createApp();
    const response = await request(app).patch("/api/v1/admin/users/2/activate");

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({ id: 2, isActive: true, deactivatedAt: null });
    expect(activateUserSpy).toHaveBeenCalledWith(2);
    expect(hasAnyAdminUsersSpy).toHaveBeenCalled();
    expect(assertActiveAdminUserSpy).not.toHaveBeenCalled();
  });

  it("should return 401 for activation when the admin token subject is inactive", async () => {
    const { UnauthorizedError } = jest.requireActual("../src/utils/errors");
    hasAnyAdminUsersSpy.mockResolvedValue(true);
    assertActiveAdminUserSpy.mockRejectedValueOnce(new UnauthorizedError("Authentication required"));

    const app = createApp();
    const response = await request(app)
      .patch("/api/v1/admin/users/2/activate")
      .set(adminAuthorizationHeader());

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("UNAUTHORIZED");
    expect(activateUserSpy).not.toHaveBeenCalled();
    expect(assertActiveAdminUserSpy).toHaveBeenCalledWith(1);
  });

  it("should return 401 for activation when the admin token subject does not exist", async () => {
    const { UnauthorizedError } = jest.requireActual("../src/utils/errors");
    hasAnyAdminUsersSpy.mockResolvedValue(true);
    assertActiveAdminUserSpy.mockRejectedValueOnce(new UnauthorizedError("Authentication required"));

    const app = createApp();
    const response = await request(app)
      .patch("/api/v1/admin/users/2/activate")
      .set(adminAuthorizationHeader());

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("UNAUTHORIZED");
    expect(activateUserSpy).not.toHaveBeenCalled();
    expect(assertActiveAdminUserSpy).toHaveBeenCalledWith(1);
  });

  it("should return 403 for activation when an Admin exists and caller is not Admin", async () => {
    hasAnyAdminUsersSpy.mockResolvedValue(true);

    const app = createApp();
    const response = await request(app)
      .patch("/api/v1/admin/users/2/activate")
      .set(customerAuthorizationHeader());

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("FORBIDDEN");
    expect(activateUserSpy).not.toHaveBeenCalled();
    expect(assertActiveAdminUserSpy).not.toHaveBeenCalled();
  });

  it("should return 429 when the activation rate limit is exceeded", async () => {
    hasAnyAdminUsersSpy.mockResolvedValue(true);
    activateUserSpy.mockResolvedValue({
      id: 2,
      firstName: "John",
      lastName: "Smith",
      email: "john.smith@example.com",
      mobileNumber: "+15559876543",
      role: "Customer",
      isActive: true,
      deactivatedAt: null,
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
      updatedAt: new Date("2024-01-02T00:00:00.000Z"),
    });

    const app = createApp();
    for (let attempt = 0; attempt < 20; attempt += 1) {
      await request(app)
        .patch("/api/v1/admin/users/2/activate")
        .set(adminAuthorizationHeader());
    }

    const response = await request(app)
      .patch("/api/v1/admin/users/2/activate")
      .set(adminAuthorizationHeader());

    expect(response.status).toBe(429);
    expect(response.body.error.code).toBe("TOO_MANY_REQUESTS");
  });
});
