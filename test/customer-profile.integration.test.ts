import request from "supertest";
import { createApp } from "../src/app";
import { UserService } from "../src/services/user.service";
import { createAccessToken } from "../src/utils/token";

function customerAuthorizationHeader(): { authorization: string } {
  return { authorization: ["Bearer", createAccessToken(2, "Customer")].join(" ") };
}

describe("PUT /api/v1/customers/profile", () => {
  let updateCustomerProfileSpy: jest.SpyInstance;
  let assertActiveUserWithRoleSpy: jest.SpyInstance;

  beforeEach(() => {
    updateCustomerProfileSpy = jest.spyOn(UserService.prototype, "updateCustomerProfile");
    assertActiveUserWithRoleSpy = jest
      .spyOn(UserService.prototype, "assertActiveUserWithRole")
      .mockResolvedValue();
  });

  afterEach(() => {
    updateCustomerProfileSpy.mockRestore();
    assertActiveUserWithRoleSpy.mockRestore();
  });

  it("should update the authenticated customer's profile", async () => {
    updateCustomerProfileSpy.mockResolvedValue({
      id: 2,
      firstName: "Jane",
      lastName: "Smith",
      email: "jane.doe@example.com",
      mobileNumber: "+15551234567",
      role: "Customer",
      isActive: true,
      deactivatedAt: null,
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
      updatedAt: new Date("2024-01-02T00:00:00.000Z"),
    });

    const response = await request(createApp())
      .put("/api/v1/customers/profile")
      .set(customerAuthorizationHeader())
      .send({
        firstName: "Jane",
        lastName: "Smith",
        mobileNumber: "+15551234567",
      });

    expect(response.status).toBe(200);
    expect(updateCustomerProfileSpy).toHaveBeenCalledWith(2, {
      firstName: "Jane",
      lastName: "Smith",
      mobileNumber: "+15551234567",
    });
  });

  it("should reject email, role, and activation fields", async () => {
    const response = await request(createApp())
      .put("/api/v1/customers/profile")
      .set(customerAuthorizationHeader())
      .send({
        firstName: "Jane",
        lastName: "Smith",
        mobileNumber: "+15551234567",
        email: "new@example.com",
        role: "Admin",
        isActive: true,
      });

    expect(response.status).toBe(400);
    expect(updateCustomerProfileSpy).not.toHaveBeenCalled();
  });

  it("should require a Customer bearer token", async () => {
    const response = await request(createApp())
      .put("/api/v1/customers/profile")
      .set("authorization", ["Bearer", createAccessToken(1, "Admin")].join(" "))
      .send({
        firstName: "Jane",
        lastName: "Smith",
        mobileNumber: "+15551234567",
      });

    expect(response.status).toBe(403);
    expect(updateCustomerProfileSpy).not.toHaveBeenCalled();
  });
});
