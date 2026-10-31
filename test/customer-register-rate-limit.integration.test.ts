import request from "supertest";
import { createApp } from "../src/app";
import { UserService } from "../src/services/user.service";

describe("POST /api/v1/customers/register rate limit", () => {
  let registerCustomerSpy: jest.SpyInstance;

  beforeEach(() => {
    registerCustomerSpy = jest.spyOn(UserService.prototype, "registerCustomer").mockResolvedValue({
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
  });

  afterEach(() => {
    registerCustomerSpy.mockRestore();
  });

  it("should return 429 when the registration rate limit is exceeded", async () => {
    const app = createApp();
    const payload = {
      firstName: "John",
      lastName: "Smith",
      email: "john.smith@example.com",
      mobileNumber: "+15559876543",
      password: "Password1",
    };

    for (let attempt = 0; attempt < 10; attempt += 1) {
      await request(app).post("/api/v1/customers/register").send(payload);
    }

    const response = await request(app).post("/api/v1/customers/register").send(payload);

    expect(response.status).toBe(429);
    expect(response.body.error.code).toBe("TOO_MANY_REQUESTS");
    expect(registerCustomerSpy).toHaveBeenCalledTimes(10);
  });
});
