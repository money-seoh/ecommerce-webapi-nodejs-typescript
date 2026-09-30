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
  let updateAdminUserSpy: jest.SpyInstance;
  let activateUserSpy: jest.SpyInstance;
  let deactivateUserSpy: jest.SpyInstance;
  let assertActiveUserWithRoleSpy: jest.SpyInstance;
  let hasAnyAdminUsersSpy: jest.SpyInstance;

  beforeEach(() => {
    createAdminUserSpy = jest.spyOn(UserService.prototype, "createAdminUser");
    updateAdminUserSpy = jest.spyOn(UserService.prototype, "updateAdminUser");
    activateUserSpy = jest.spyOn(UserService.prototype, "activateUser");
    deactivateUserSpy = jest.spyOn(UserService.prototype, "deactivateUser");
    assertActiveUserWithRoleSpy = jest
      .spyOn(UserService.prototype, "assertActiveUserWithRole")
      .mockResolvedValue();
    hasAnyAdminUsersSpy = jest
      .spyOn(UserService.prototype, "hasAnyAdminUsers")
      .mockResolvedValue(false);
  });

  afterEach(() => {
    createAdminUserSpy.mockRestore();
    updateAdminUserSpy.mockRestore();
    activateUserSpy.mockRestore();
    deactivateUserSpy.mockRestore();
    assertActiveUserWithRoleSpy.mockRestore();
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

  it("should update a user and return 200 when the payload is valid", async () => {
    hasAnyAdminUsersSpy.mockResolvedValue(true);
    updateAdminUserSpy.mockResolvedValue({
      id: 2,
      firstName: "Jane",
      lastName: "Doe",
      email: "jane.doe@example.com",
      mobileNumber: "+15551234567",
      role: "Customer",
      isActive: true,
      deactivatedAt: null,
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
      updatedAt: new Date("2024-01-02T00:00:00.000Z"),
    });

    const app = createApp();
    const response = await request(app)
      .put("/api/v1/admin/users/2")
      .set(adminAuthorizationHeader())
      .send({
        firstName: "Jane",
        lastName: "Doe",
        mobileNumber: "+15551234567",
      });

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({ id: 2, email: "jane.doe@example.com", role: "Customer" });
    expect(updateAdminUserSpy).toHaveBeenCalledWith(2, expect.objectContaining({ firstName: "Jane" }));
    expect(assertActiveUserWithRoleSpy).toHaveBeenCalledWith(1, "Admin");
  });

  it("should reject invalid user updates before calling the service", async () => {
    hasAnyAdminUsersSpy.mockResolvedValue(true);

    const app = createApp();
    const response = await request(app)
      .put("/api/v1/admin/users/2")
      .set(adminAuthorizationHeader())
      .send({
        firstName: "J".repeat(1001),
        lastName: "Doe",
        mobileNumber: "+15551234567",
        isActive: true,
      });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(Array.isArray(response.body.error.details)).toBe(true);
    expect(updateAdminUserSpy).not.toHaveBeenCalled();
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
    expect(assertActiveUserWithRoleSpy).toHaveBeenCalledWith(1, "Admin");
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
    expect(assertActiveUserWithRoleSpy).toHaveBeenCalledWith(1, "Admin");
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

  it("should reject activation requests with unexpected body fields", async () => {
    const app = createApp();
    const response = await request(app)
      .patch("/api/v1/admin/users/2/activate")
      .send({ isActive: true });

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
    expect(assertActiveUserWithRoleSpy).not.toHaveBeenCalled();
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
    expect(assertActiveUserWithRoleSpy).not.toHaveBeenCalled();
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
    expect(assertActiveUserWithRoleSpy).not.toHaveBeenCalled();
  });

  it("should return 401 for activation when the admin token subject is inactive", async () => {
    const { UnauthorizedError } = jest.requireActual("../src/utils/errors");
    hasAnyAdminUsersSpy.mockResolvedValue(true);
    assertActiveUserWithRoleSpy.mockRejectedValueOnce(new UnauthorizedError("Authentication required"));

    const app = createApp();
    const response = await request(app)
      .patch("/api/v1/admin/users/2/activate")
      .set(adminAuthorizationHeader());

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("UNAUTHORIZED");
    expect(activateUserSpy).not.toHaveBeenCalled();
    expect(assertActiveUserWithRoleSpy).toHaveBeenCalledWith(1, "Admin");
  });

  it("should return 401 for activation when the admin token subject does not exist", async () => {
    const { UnauthorizedError } = jest.requireActual("../src/utils/errors");
    hasAnyAdminUsersSpy.mockResolvedValue(true);
    assertActiveUserWithRoleSpy.mockRejectedValueOnce(new UnauthorizedError("Authentication required"));

    const app = createApp();
    const response = await request(app)
      .patch("/api/v1/admin/users/2/activate")
      .set(adminAuthorizationHeader());

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("UNAUTHORIZED");
    expect(activateUserSpy).not.toHaveBeenCalled();
    expect(assertActiveUserWithRoleSpy).toHaveBeenCalledWith(1, "Admin");
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
    expect(assertActiveUserWithRoleSpy).toHaveBeenCalledWith(2, "Customer");
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

  it("should deactivate another user and return 200 when caller is Admin", async () => {
    hasAnyAdminUsersSpy.mockResolvedValue(true);
    deactivateUserSpy.mockResolvedValue({
      id: 2,
      firstName: "John",
      lastName: "Smith",
      email: "john.smith@example.com",
      mobileNumber: "+15559876543",
      role: "Customer",
      isActive: false,
      deactivatedAt: new Date("2024-01-03T00:00:00.000Z"),
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
      updatedAt: new Date("2024-01-03T00:00:00.000Z"),
    });

    const app = createApp();
    const response = await request(app)
      .patch("/api/v1/admin/users/2/deactivate")
      .set(adminAuthorizationHeader());

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({ id: 2, isActive: false });
    expect(deactivateUserSpy).toHaveBeenCalledWith(1, 2);
    expect(assertActiveUserWithRoleSpy).toHaveBeenCalledWith(1, "Admin");
  });

  it("should return 400 when deactivation userId path param is invalid", async () => {
    const app = createApp();
    const response = await request(app)
      .patch("/api/v1/admin/users/not-a-number/deactivate")
      .set(adminAuthorizationHeader());

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(deactivateUserSpy).not.toHaveBeenCalled();
  });

  it("should reject deactivation requests with unexpected body fields", async () => {
    const app = createApp();
    const response = await request(app)
      .patch("/api/v1/admin/users/2/deactivate")
      .set(adminAuthorizationHeader())
      .send({ isActive: false });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(deactivateUserSpy).not.toHaveBeenCalled();
  });

  it("should return 404 when deactivation target does not exist", async () => {
    const { NotFoundError } = jest.requireActual("../src/utils/errors");
    deactivateUserSpy.mockRejectedValue(new NotFoundError("User not found"));

    const app = createApp();
    const response = await request(app)
      .patch("/api/v1/admin/users/999/deactivate")
      .set(adminAuthorizationHeader());

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("NOT_FOUND");
  });

  it("should return 409 when deactivation target is already inactive", async () => {
    const { ConflictError } = jest.requireActual("../src/utils/errors");
    deactivateUserSpy.mockRejectedValue(new ConflictError("User account is already inactive"));

    const app = createApp();
    const response = await request(app)
      .patch("/api/v1/admin/users/2/deactivate")
      .set(adminAuthorizationHeader());

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe("CONFLICT");
  });

  it("should return 409 when deactivation would remove the last active Admin", async () => {
    const { ConflictError } = jest.requireActual("../src/utils/errors");
    deactivateUserSpy.mockRejectedValue(new ConflictError("At least one active Admin user must remain"));

    const app = createApp();
    const response = await request(app)
      .patch("/api/v1/admin/users/2/deactivate")
      .set(adminAuthorizationHeader());

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe("CONFLICT");
  });

  it("should return 403 when an Admin attempts to deactivate themselves", async () => {
    const { ForbiddenError } = jest.requireActual("../src/utils/errors");
    deactivateUserSpy.mockRejectedValue(new ForbiddenError("Admins cannot deactivate their own accounts"));

    const app = createApp();
    const response = await request(app)
      .patch("/api/v1/admin/users/1/deactivate")
      .set(adminAuthorizationHeader());

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("FORBIDDEN");
  });

  it("should return 401 for deactivation when no authorization header is provided", async () => {
    const app = createApp();
    const response = await request(app).patch("/api/v1/admin/users/2/deactivate");

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("UNAUTHORIZED");
    expect(deactivateUserSpy).not.toHaveBeenCalled();
    expect(assertActiveUserWithRoleSpy).not.toHaveBeenCalled();
    expect(hasAnyAdminUsersSpy).not.toHaveBeenCalled();
  });

  it("should return 401 for deactivation when the bearer token has extra fields", async () => {
    const adminToken = createAccessToken(1, "Admin");

    const app = createApp();
    const response = await request(app)
      .patch("/api/v1/admin/users/2/deactivate")
      .set("authorization", "Bearer " + adminToken + " extra");

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("UNAUTHORIZED");
    expect(deactivateUserSpy).not.toHaveBeenCalled();
    expect(assertActiveUserWithRoleSpy).not.toHaveBeenCalled();
  });

  it("should return 401 for deactivation when the admin token subject is inactive", async () => {
    const { UnauthorizedError } = jest.requireActual("../src/utils/errors");
    assertActiveUserWithRoleSpy.mockRejectedValueOnce(new UnauthorizedError("Authentication required"));

    const app = createApp();
    const response = await request(app)
      .patch("/api/v1/admin/users/2/deactivate")
      .set(adminAuthorizationHeader());

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("UNAUTHORIZED");
    expect(deactivateUserSpy).not.toHaveBeenCalled();
    expect(assertActiveUserWithRoleSpy).toHaveBeenCalledWith(1, "Admin");
  });

  it("should return 403 for deactivation when caller is not Admin", async () => {
    const app = createApp();
    const response = await request(app)
      .patch("/api/v1/admin/users/2/deactivate")
      .set(customerAuthorizationHeader());

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("FORBIDDEN");
    expect(deactivateUserSpy).not.toHaveBeenCalled();
    expect(assertActiveUserWithRoleSpy).toHaveBeenCalledWith(2, "Customer");
  });

  it("should return 429 when the deactivation rate limit is exceeded", async () => {
    deactivateUserSpy.mockResolvedValue({
      id: 2,
      firstName: "John",
      lastName: "Smith",
      email: "john.smith@example.com",
      mobileNumber: "+15559876543",
      role: "Customer",
      isActive: false,
      deactivatedAt: new Date("2024-01-03T00:00:00.000Z"),
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
      updatedAt: new Date("2024-01-03T00:00:00.000Z"),
    });

    const app = createApp();
    for (let attempt = 0; attempt < 20; attempt += 1) {
      await request(app)
        .patch("/api/v1/admin/users/2/deactivate")
        .set(adminAuthorizationHeader());
    }

    const response = await request(app)
      .patch("/api/v1/admin/users/2/deactivate")
      .set(adminAuthorizationHeader());

    expect(response.status).toBe(429);
    expect(response.body.error.code).toBe("TOO_MANY_REQUESTS");
  });
});
