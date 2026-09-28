import request from "supertest";
import { createApp } from "../src/app";
import { UserService } from "../src/services/user.service";
import { createAccessToken } from "../src/utils/token";

function customerAuthorizationHeader(): { authorization: string } {
  return { authorization: ["Bearer", createAccessToken(2, "Customer")].join(" ") };
}

function adminAuthorizationHeader(): { authorization: string } {
  return { authorization: ["Bearer", createAccessToken(1, "Admin")].join(" ") };
}

describe("GET /api/v1/customers/me", () => {
  let getCurrentUserSpy: jest.SpyInstance;
  let assertActiveUserWithRoleSpy: jest.SpyInstance;

  beforeEach(() => {
    getCurrentUserSpy = jest.spyOn(UserService.prototype, "getCurrentUser");
    assertActiveUserWithRoleSpy = jest
      .spyOn(UserService.prototype, "assertActiveUserWithRole")
      .mockResolvedValue();
  });

  afterEach(() => {
    getCurrentUserSpy.mockRestore();
    assertActiveUserWithRoleSpy.mockRestore();
  });

  it("should return 200 with the authenticated customer profile", async () => {
    getCurrentUserSpy.mockResolvedValue({
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
      .get("/api/v1/customers/me")
      .set(customerAuthorizationHeader());

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      id: 2,
      email: "jane.doe@example.com",
      role: "Customer",
    });
    expect(assertActiveUserWithRoleSpy).toHaveBeenCalledWith(2, "Customer");
    expect(getCurrentUserSpy).toHaveBeenCalledWith(2);
  });

  it("should return 401 when no authorization header is provided", async () => {
    const app = createApp();
    const response = await request(app).get("/api/v1/customers/me");

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("UNAUTHORIZED");
    expect(assertActiveUserWithRoleSpy).not.toHaveBeenCalled();
    expect(getCurrentUserSpy).not.toHaveBeenCalled();
  });

  it("should return 401 when the bearer token has extra fields", async () => {
    const customerToken = createAccessToken(2, "Customer");

    const app = createApp();
    const response = await request(app)
      .get("/api/v1/customers/me")
      .set("authorization", "Bearer " + customerToken + " extra");

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("UNAUTHORIZED");
    expect(assertActiveUserWithRoleSpy).not.toHaveBeenCalled();
    expect(getCurrentUserSpy).not.toHaveBeenCalled();
  });

  it("should return 401 when the customer token subject is inactive", async () => {
    const { UnauthorizedError } = jest.requireActual("../src/utils/errors");
    assertActiveUserWithRoleSpy.mockRejectedValueOnce(new UnauthorizedError("Authentication required"));

    const app = createApp();
    const response = await request(app)
      .get("/api/v1/customers/me")
      .set(customerAuthorizationHeader());

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("UNAUTHORIZED");
    expect(assertActiveUserWithRoleSpy).toHaveBeenCalledWith(2, "Customer");
    expect(getCurrentUserSpy).not.toHaveBeenCalled();
  });

  it("should return 403 when the caller is authenticated as Admin", async () => {
    const app = createApp();
    const response = await request(app)
      .get("/api/v1/customers/me")
      .set(adminAuthorizationHeader());

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("FORBIDDEN");
    expect(assertActiveUserWithRoleSpy).toHaveBeenCalledWith(1, "Admin");
    expect(getCurrentUserSpy).not.toHaveBeenCalled();
  });

  it("should return 429 when the customer profile rate limit is exceeded", async () => {
    getCurrentUserSpy.mockResolvedValue({
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
    for (let attempt = 0; attempt < 60; attempt += 1) {
      await request(app)
        .get("/api/v1/customers/me")
        .set(customerAuthorizationHeader());
    }

    const response = await request(app)
      .get("/api/v1/customers/me")
      .set(customerAuthorizationHeader());

    expect(response.status).toBe(429);
    expect(response.body.error.code).toBe("TOO_MANY_REQUESTS");
  });
});
