import request from "supertest";
import { createApp } from "../src/app";
import { UserService } from "../src/services/user.service";
import { createAccessToken } from "../src/utils/token";

function authorization(role: "Admin" | "Customer"): { authorization: string } {
  return { authorization: `Bearer ${createAccessToken(2, role)}` };
}

describe("POST /api/v1/customers/change-password", () => {
  let changeCustomerPasswordSpy: jest.SpyInstance;
  let assertActiveUserWithRoleSpy: jest.SpyInstance;

  beforeEach(() => {
    changeCustomerPasswordSpy = jest
      .spyOn(UserService.prototype, "changeCustomerPassword")
      .mockResolvedValue();
    assertActiveUserWithRoleSpy = jest
      .spyOn(UserService.prototype, "assertActiveUserWithRole")
      .mockResolvedValue();
  });

  afterEach(() => {
    changeCustomerPasswordSpy.mockRestore();
    assertActiveUserWithRoleSpy.mockRestore();
  });

  it("should change an authenticated customer's password", async () => {
    const response = await request(createApp())
      .post("/api/v1/customers/change-password")
      .set(authorization("Customer"))
      .send({ currentPassword: "Password1", newPassword: "NewPassword2" });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: { message: "Password changed successfully" } });
    expect(changeCustomerPasswordSpy).toHaveBeenCalledWith(2, {
      currentPassword: "Password1",
      newPassword: "NewPassword2",
    });
  });

  it("should reject an incorrect current password", async () => {
    const { UnauthorizedError } = jest.requireActual("../src/utils/errors");
    changeCustomerPasswordSpy.mockRejectedValue(
      new UnauthorizedError("Current password is incorrect"),
    );

    const response = await request(createApp())
      .post("/api/v1/customers/change-password")
      .set(authorization("Customer"))
      .send({ currentPassword: "WrongPassword1", newPassword: "NewPassword2" });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("UNAUTHORIZED");
  });

  it.each([
    [{ newPassword: "NewPassword2" }, "missing current password"],
    [{ currentPassword: "Password1", newPassword: "short" }, "weak new password"],
    [
      { currentPassword: "Password1", newPassword: "NewPassword2", role: "Admin" },
      "unknown fields",
    ],
  ])("should reject invalid input for %s", async (body, _label) => {
    const response = await request(createApp())
      .post("/api/v1/customers/change-password")
      .set(authorization("Customer"))
      .send(body);

    expect(response.status).toBe(400);
    expect(changeCustomerPasswordSpy).not.toHaveBeenCalled();
  });

  it("should require authentication", async () => {
    const response = await request(createApp())
      .post("/api/v1/customers/change-password")
      .send({ currentPassword: "Password1", newPassword: "NewPassword2" });

    expect(response.status).toBe(401);
  });

  it("should require the Customer role", async () => {
    const response = await request(createApp())
      .post("/api/v1/customers/change-password")
      .set(authorization("Admin"))
      .send({ currentPassword: "Password1", newPassword: "NewPassword2" });

    expect(response.status).toBe(403);
  });
});
