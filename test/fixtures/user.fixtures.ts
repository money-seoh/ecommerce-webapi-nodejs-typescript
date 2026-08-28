import { UserWithRole } from "../../src/repositories/user.repository";

export function buildUserWithRole(overrides: Partial<UserWithRole> = {}): UserWithRole {
  return {
    id: 1,
    firstName: "Jane",
    lastName: "Doe",
    email: "jane.doe@example.com",
    mobileNumber: "+15551234567",
    passwordHash: "hashed-password",
    isActive: false,
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: new Date("2024-01-01T00:00:00.000Z"),
    userRoles: [
      {
        role: { id: 2, name: "Customer" },
      },
    ],
    ...overrides,
  };
}
