import request from "supertest";
import { createApp } from "../src/app";
import { UserService } from "../src/services/user.service";
import { createAccessToken } from "../src/utils/token";

const user = {
  id: 2,
  firstName: "Jane",
  lastName: "Doe",
  email: "jane.doe@example.com",
  mobileNumber: "+15551234567",
  role: "Customer" as const,
  isActive: true,
  deactivatedAt: null,
  createdAt: new Date("2024-01-01T00:00:00.000Z"),
  updatedAt: new Date("2024-01-02T00:00:00.000Z"),
};

function authorization(role: "Admin" | "Customer"): { authorization: string } {
  return { authorization: `Bearer ${createAccessToken(1, role)}` };
}

describe("admin user read endpoints", () => {
  let getUserByIdSpy: jest.SpyInstance;
  let listUsersSpy: jest.SpyInstance;
  let assertActiveUserWithRoleSpy: jest.SpyInstance;

  beforeEach(() => {
    getUserByIdSpy = jest.spyOn(UserService.prototype, "getUserById");
    listUsersSpy = jest.spyOn(UserService.prototype, "listUsers");
    assertActiveUserWithRoleSpy = jest
      .spyOn(UserService.prototype, "assertActiveUserWithRole")
      .mockResolvedValue();
  });

  afterEach(() => {
    getUserByIdSpy.mockRestore();
    listUsersSpy.mockRestore();
    assertActiveUserWithRoleSpy.mockRestore();
  });

  it("should return user details to an Admin", async () => {
    getUserByIdSpy.mockResolvedValue(user);

    const response = await request(createApp())
      .get("/api/v1/admin/users/2")
      .set(authorization("Admin"));

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({ id: 2, role: "Customer" });
    expect(response.body.data).not.toHaveProperty("passwordHash");
  });

  it("should reject an invalid user id", async () => {
    const response = await request(createApp())
      .get("/api/v1/admin/users/not-a-number")
      .set(authorization("Admin"));

    expect(response.status).toBe(400);
    expect(getUserByIdSpy).not.toHaveBeenCalled();
  });

  it("should return 404 when a user does not exist", async () => {
    const { NotFoundError } = jest.requireActual("../src/utils/errors");
    getUserByIdSpy.mockRejectedValue(new NotFoundError("User not found"));

    const response = await request(createApp())
      .get("/api/v1/admin/users/999")
      .set(authorization("Admin"));

    expect(response.status).toBe(404);
  });

  it("should paginate and forward search filters", async () => {
    listUsersSpy.mockResolvedValue({
      data: [user],
      meta: { page: 2, limit: 5, totalItems: 6, totalPages: 2 },
    });

    const response = await request(createApp())
      .get("/api/v1/admin/users")
      .query({ page: 2, limit: 5, search: "jane", role: "Customer", isActive: false })
      .set(authorization("Admin"));

    expect(response.status).toBe(200);
    expect(listUsersSpy).toHaveBeenCalledWith({
      page: 2,
      limit: 5,
      search: "jane",
      role: "Customer",
      isActive: false,
    });
    expect(response.body.meta).toEqual({ page: 2, limit: 5, totalItems: 6, totalPages: 2 });
  });

  it("should reject limits above 100", async () => {
    const response = await request(createApp())
      .get("/api/v1/admin/users?limit=101")
      .set(authorization("Admin"));

    expect(response.status).toBe(400);
    expect(listUsersSpy).not.toHaveBeenCalled();
  });

  it.each([
    ["missing token", undefined, 401],
    ["Customer token", authorization("Customer"), 403],
  ])("should protect admin reads for %s", async (_label, headers, expectedStatus) => {
    const requestBuilder = request(createApp()).get("/api/v1/admin/users/2");
    if (headers) requestBuilder.set(headers);

    const response = await requestBuilder;
    expect(response.status).toBe(expectedStatus);
    expect(getUserByIdSpy).not.toHaveBeenCalled();
  });
});
