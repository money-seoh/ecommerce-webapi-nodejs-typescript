import request from "supertest";
import { createApp } from "../src/app";
import { userController } from "../src/config/container";
import { UserService } from "../src/services/user.service";

describe("POST /api/v1/admin/users", () => {
  let createAdminUserSpy: jest.SpyInstance;

  beforeEach(() => {
    createAdminUserSpy = jest.spyOn(UserService.prototype, "createAdminUser");
  });

  afterEach(() => {
    createAdminUserSpy.mockRestore();
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
      mobileNumber: "+15551234567",
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
});

describe("POST /api/v1/admin/users — non-safe environment", () => {
  const originalNodeEnv = process.env.NODE_ENV;

  beforeAll(() => {
    jest.resetModules();
    process.env.NODE_ENV = "production";
  });

  afterAll(() => {
    process.env.NODE_ENV = originalNodeEnv;
    jest.resetModules();
  });

  it("should return 403 when NODE_ENV is not development or test", async () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { createApp: createFreshApp } = require("../src/app");
    const app = createFreshApp();
    const response = await request(app).post("/api/v1/admin/users").send({
      firstName: "Jane",
      lastName: "Doe",
      email: "jane.doe@example.com",
      mobileNumber: "+15551234567",
      password: "Password1",
      role: "Admin",
    });
    expect(response.status).toBe(403);
  });
});
