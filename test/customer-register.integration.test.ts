import request from "supertest";
import { createApp } from "../src/app";
import { UserService } from "../src/services/user.service";

describe("POST /api/v1/customers/register", () => {
  let registerCustomerSpy: jest.SpyInstance;

  beforeEach(() => {
    registerCustomerSpy = jest.spyOn(UserService.prototype, "registerCustomer");
  });

  afterEach(() => {
    registerCustomerSpy.mockRestore();
  });

  it("should register a customer and return 201 when the payload is valid", async () => {
    registerCustomerSpy.mockResolvedValue({
      id: 2,
      firstName: "John",
      lastName: "Smith",
      email: "john.smith@example.com",
      mobileNumber: "+15559876543",
      role: "Customer",
      isActive: true,
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
      updatedAt: new Date("2024-01-01T00:00:00.000Z"),
    });

    const app = createApp();

    const response = await request(app).post("/api/v1/customers/register").send({
      firstName: "John",
      lastName: "Smith",
      email: "john.smith@example.com",
      mobileNumber: "+15559876543",
      password: "Password1",
    });

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({ email: "john.smith@example.com", role: "Customer", isActive: true });
  });

  it("should ignore client-submitted role/isActive fields", async () => {
    registerCustomerSpy.mockResolvedValue({
      id: 3,
      firstName: "John",
      lastName: "Smith",
      email: "john.smith2@example.com",
      mobileNumber: "+15559876543",
      role: "Customer",
      isActive: true,
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
      updatedAt: new Date("2024-01-01T00:00:00.000Z"),
    });

    const app = createApp();

    await request(app)
      .post("/api/v1/customers/register")
      .send({
        firstName: "John",
        lastName: "Smith",
        email: "john.smith2@example.com",
        mobileNumber: "+15559876543",
        password: "Password1",
        role: "Admin",
        isActive: false,
      });

    const passedDto = registerCustomerSpy.mock.calls[0][0];
    expect(passedDto).not.toHaveProperty("role");
    expect(passedDto).not.toHaveProperty("isActive");
  });

  it("should return 400 when password does not meet the security policy", async () => {
    const app = createApp();

    const response = await request(app).post("/api/v1/customers/register").send({
      firstName: "John",
      lastName: "Smith",
      email: "john.smith@example.com",
      mobileNumber: "+15559876543",
      password: "short",
    });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(registerCustomerSpy).not.toHaveBeenCalled();
  });
});
