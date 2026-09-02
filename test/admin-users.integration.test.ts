import request from "supertest";
import { createApp } from "../src/app";
import { userController } from "../src/config/container";
import { UserService } from "../src/services/user.service";

describe("POST /api/v1/admin/users", () => {
  let createAdminUserSpy: jest.SpyInstance;
  let hasAnyAdminUsersSpy: jest.SpyInstance;

  beforeEach(() => {
    createAdminUserSpy = jest.spyOn(UserService.prototype, "createAdminUser");
    hasAnyAdminUsersSpy = jest
      .spyOn(UserService.prototype, "hasAnyAdminUsers")
      .mockResolvedValue(false);
  });

  afterEach(() => {
    createAdminUserSpy.mockRestore();
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
      isActive: false,
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
    expect(response.body.data).toMatchObject({ email: "jane.doe@example.com", role: "Admin" });
    expect(userController).toBeDefined();
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
      .set("authorization", "******")
      .set("x-user-role", "Customer")
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
      isActive: false,
      deactivatedAt: null,
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
      updatedAt: new Date("2024-01-01T00:00:00.000Z"),
    });

    const app = createApp();
    const response = await request(app)
      .post("/api/v1/admin/users")
      .set("authorization", "******")
      .set("x-user-role", "Admin")
      .send({
        firstName: "Jane",
        lastName: "Doe",
        email: "jane.doe@example.com",
        mobileNumber: "+15551234567",
        password: "Password1",
        role: "Admin",
      });

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({ email: "jane.doe@example.com", role: "Admin" });
  });
});
