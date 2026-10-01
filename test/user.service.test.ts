import { UserService } from "../src/services/user.service";
import { UserRepository } from "../src/repositories/user.repository";
import { RoleRepository } from "../src/repositories/role.repository";
import { ConflictError, ForbiddenError, InternalError, NotFoundError, UnauthorizedError } from "../src/utils/errors";
import { buildUserWithRole } from "./fixtures/user.fixtures";
import { comparePassword } from "../src/utils/password";
import { createAccessToken } from "../src/utils/token";

jest.mock("../src/repositories/user.repository");
jest.mock("../src/repositories/role.repository");
jest.mock("../src/utils/password", () => ({
  hashPassword: jest.fn().mockResolvedValue("hashed-password"),
  comparePassword: jest.fn(),
}));
jest.mock("../src/utils/token", () => ({
  createAccessToken: jest.fn().mockReturnValue("signed-jwt"),
}));

describe("UserService", () => {
  let userRepository: jest.Mocked<UserRepository>;
  let roleRepository: jest.Mocked<RoleRepository>;
  let service: UserService;

  beforeEach(() => {
    userRepository = new UserRepository(
      {} as never,
    ) as jest.Mocked<UserRepository>;
    roleRepository = new RoleRepository({} as never) as jest.Mocked<RoleRepository>;
    service = new UserService(userRepository, roleRepository);
    jest.mocked(comparePassword).mockReset();
    jest.mocked(createAccessToken).mockClear();
  });

  describe("createAdminUser", () => {
    it("should create new Admin users as active", async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      roleRepository.findByName.mockResolvedValue({
        id: 1,
        name: "Admin",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      userRepository.create.mockResolvedValue(
        buildUserWithRole({ isActive: true, userRoles: [{ role: { id: 1, name: "Admin" } }] }),
      );

      await service.createAdminUser({
        firstName: "Jane",
        lastName: "Doe",
        email: "jane.doe@example.com",
        mobileNumber: "+15551234567",
        password: "Password1",
        role: "Admin",
      });

      expect(userRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "jane.doe@example.com",
          isActive: true,
          roleId: 1,
        }),
      );
    });

    it("should create new Customer users as inactive", async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      roleRepository.findByName.mockResolvedValue({
        id: 2,
        name: "Customer",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      userRepository.create.mockResolvedValue(buildUserWithRole({ isActive: false }));

      await service.createAdminUser({
        firstName: "Jane",
        lastName: "Doe",
        email: "jane.doe@example.com",
        mobileNumber: "+15551234567",
        password: "Password1",
        role: "Customer",
      });

      expect(userRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ isActive: false, roleId: 2 }),
      );
    });

    it("should reject creation when email already exists", async () => {
      userRepository.findByEmail.mockResolvedValue(buildUserWithRole());

      await expect(
        service.createAdminUser({
          firstName: "Jane",
          lastName: "Doe",
          email: "jane.doe@example.com",
          mobileNumber: "+15551234567",
          password: "Password1",
          role: "Admin",
        }),
      ).rejects.toBeInstanceOf(ConflictError);
      expect(userRepository.create).not.toHaveBeenCalled();
    });

    it("should throw InternalError when the configured role cannot be found", async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      roleRepository.findByName.mockResolvedValue(null);

      await expect(
        service.createAdminUser({
          firstName: "Jane",
          lastName: "Doe",
          email: "jane.doe@example.com",
          mobileNumber: "+15551234567",
          password: "Password1",
          role: "Admin",
        }),
      ).rejects.toBeInstanceOf(InternalError);
    });
  });

  describe("updateAdminUser", () => {
    it("should update the profile and preserve immutable account fields when password is omitted", async () => {
      userRepository.updateById.mockResolvedValue(
        buildUserWithRole({
          id: 7,
          firstName: "Jane",
          mobileNumber: "+15551234567",
        }),
      );

      await expect(
        service.updateAdminUser(7, {
          firstName: "Jane",
          lastName: "Doe",
          mobileNumber: "+15551234567",
        }),
      ).resolves.toMatchObject({ id: 7, email: "jane.doe@example.com", role: "Customer" });

      expect(userRepository.updateById).toHaveBeenCalledWith(7, {
        firstName: "Jane",
        lastName: "Doe",
        mobileNumber: "+15551234567",
      });
    });

    it("should hash and persist a replacement password", async () => {
      userRepository.updateById.mockResolvedValue(buildUserWithRole({ id: 7 }));
      await expect(
        service.updateAdminUser(7, {
          firstName: "Jane",
          lastName: "Doe",
          mobileNumber: "+15551234567",
          password: "NewPassword1",
        }),
      ).resolves.toBeDefined();

      expect(userRepository.updateById).toHaveBeenCalledWith(7, {
        firstName: "Jane",
        lastName: "Doe",
        mobileNumber: "+15551234567",
        passwordHash: "hashed-password",
      });
    });
  });

  describe("admin user reads", () => {
    it("should return one user by id without exposing the password hash", async () => {
      userRepository.findById.mockResolvedValue(buildUserWithRole({ id: 9 }));

      const result = await service.getUserById(9);

      expect(result).toMatchObject({ id: 9, role: "Customer" });
      expect(result).not.toHaveProperty("passwordHash");
    });

    it("should return NotFoundError when the requested user does not exist", async () => {
      userRepository.findById.mockResolvedValue(null);
      await expect(service.getUserById(999)).rejects.toBeInstanceOf(NotFoundError);
    });

    it("should map paginated users and calculate total pages", async () => {
      userRepository.findMany.mockResolvedValue({
        users: [buildUserWithRole({ id: 2 }), buildUserWithRole({ id: 3 })],
        totalItems: 21,
      });

      await expect(service.listUsers({ page: 2, limit: 10 })).resolves.toMatchObject({
        data: [{ id: 2 }, { id: 3 }],
        meta: { page: 2, limit: 10, totalItems: 21, totalPages: 3 },
      });
    });
  });

  describe("changeCustomerPassword", () => {
    it("should verify and replace the current password hash", async () => {
      userRepository.findById.mockResolvedValue(
        buildUserWithRole({ id: 7, isActive: true, deactivatedAt: null }),
      );
      jest.mocked(comparePassword)
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);

      await service.changeCustomerPassword(7, {
        currentPassword: "Password1",
        newPassword: "NewPassword2",
      });

      expect(comparePassword).toHaveBeenNthCalledWith(1, "Password1", "hashed-password");
      expect(comparePassword).toHaveBeenNthCalledWith(2, "NewPassword2", "hashed-password");
      expect(userRepository.updatePasswordHash).toHaveBeenCalledWith(7, "hashed-password");
    });

    it("should reject an incorrect current password", async () => {
      userRepository.findById.mockResolvedValue(
        buildUserWithRole({ id: 7, isActive: true, deactivatedAt: null }),
      );
      jest.mocked(comparePassword).mockResolvedValue(false);

      await expect(
        service.changeCustomerPassword(7, {
          currentPassword: "WrongPassword1",
          newPassword: "NewPassword2",
        }),
      ).rejects.toBeInstanceOf(UnauthorizedError);
      expect(userRepository.updatePasswordHash).not.toHaveBeenCalled();
    });

    it("should reject reuse of the current password", async () => {
      userRepository.findById.mockResolvedValue(
        buildUserWithRole({ id: 7, isActive: true, deactivatedAt: null }),
      );
      jest.mocked(comparePassword).mockResolvedValue(true);

      await expect(
        service.changeCustomerPassword(7, {
          currentPassword: "Password1",
          newPassword: "Password1",
        }),
      ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
      expect(userRepository.updatePasswordHash).not.toHaveBeenCalled();
    });
  });

  describe("registerCustomer", () => {
    it("should force role=Customer and isActive=false regardless of input", async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      roleRepository.findByName.mockResolvedValue({
        id: 2,
        name: "Customer",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      userRepository.create.mockResolvedValue(buildUserWithRole({ isActive: false }));

      await service.registerCustomer({
        firstName: "Jane",
        lastName: "Doe",
        email: "jane.doe@example.com",
        mobileNumber: "+15551234567",
        password: "Password1",
      });

      expect(roleRepository.findByName).toHaveBeenCalledWith("Customer");
      expect(userRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "jane.doe@example.com",
          isActive: false,
          roleId: 2,
        }),
      );
    });

    it("should normalize email to lowercase before uniqueness check and create", async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      roleRepository.findByName.mockResolvedValue({
        id: 2,
        name: "Customer",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      userRepository.create.mockResolvedValue(buildUserWithRole({ isActive: false }));

      await service.registerCustomer({
        firstName: "Jane",
        lastName: "Doe",
        email: "Jane.Doe@Example.COM",
        mobileNumber: "+15551234567",
        password: "Password1",
      });

      expect(userRepository.findByEmail).toHaveBeenCalledWith("jane.doe@example.com");
      expect(userRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ email: "jane.doe@example.com" }),
      );
    });

    it("should reject registration when email already exists", async () => {
      userRepository.findByEmail.mockResolvedValue(buildUserWithRole());

      await expect(
        service.registerCustomer({
          firstName: "Jane",
          lastName: "Doe",
          email: "jane.doe@example.com",
          mobileNumber: "+15551234567",
          password: "Password1",
        }),
      ).rejects.toBeInstanceOf(ConflictError);
      expect(userRepository.create).not.toHaveBeenCalled();
    });

    it("should throw InternalError when Customer role is not configured", async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      roleRepository.findByName.mockResolvedValue(null);

      await expect(
        service.registerCustomer({
          firstName: "Jane",
          lastName: "Doe",
          email: "jane.doe@example.com",
          mobileNumber: "+15551234567",
          password: "Password1",
        }),
      ).rejects.toBeInstanceOf(InternalError);
    });
  });

  describe("loginCustomer", () => {
    it("should return an access token when credentials belong to an active customer", async () => {
      userRepository.findByEmail.mockResolvedValue(buildUserWithRole({ isActive: true }));
      jest.mocked(comparePassword).mockResolvedValue(true);

      await expect(
        service.loginCustomer({
          email: "Jane.Doe@Example.COM",
          password: "Password1",
        }),
      ).resolves.toEqual({
        accessToken: "signed-jwt",
        tokenType: "Bearer",
        expiresIn: "1h",
      });

      expect(userRepository.findByEmail).toHaveBeenCalledWith("jane.doe@example.com");
      expect(comparePassword).toHaveBeenCalledWith("Password1", "hashed-password");
      expect(createAccessToken).toHaveBeenCalledWith(1, "Customer");
    });

    it("should reject login when no user exists for the provided email", async () => {
      userRepository.findByEmail.mockResolvedValue(null);

      await expect(
        service.loginCustomer({
          email: "jane.doe@example.com",
          password: "Password1",
        }),
      ).rejects.toBeInstanceOf(UnauthorizedError);

      expect(comparePassword).not.toHaveBeenCalled();
    });

    it("should reject login when the password is incorrect", async () => {
      userRepository.findByEmail.mockResolvedValue(buildUserWithRole({ isActive: true }));
      jest.mocked(comparePassword).mockResolvedValue(false);

      await expect(
        service.loginCustomer({
          email: "jane.doe@example.com",
          password: "WrongPassword1",
        }),
      ).rejects.toBeInstanceOf(UnauthorizedError);

      expect(createAccessToken).not.toHaveBeenCalled();
    });

    it("should reject login when the account is not active", async () => {
      userRepository.findByEmail.mockResolvedValue(buildUserWithRole({ isActive: false }));
      jest.mocked(comparePassword).mockResolvedValue(true);

      await expect(
        service.loginCustomer({
          email: "jane.doe@example.com",
          password: "Password1",
        }),
      ).rejects.toBeInstanceOf(ForbiddenError);
    });

    it("should reject login when the account is deactivated", async () => {
      userRepository.findByEmail.mockResolvedValue(
        buildUserWithRole({
          isActive: true,
          deactivatedAt: new Date("2024-01-02T00:00:00.000Z"),
        }),
      );
      jest.mocked(comparePassword).mockResolvedValue(true);

      await expect(
        service.loginCustomer({
          email: "jane.doe@example.com",
          password: "Password1",
        }),
      ).rejects.toBeInstanceOf(ForbiddenError);
    });

    it("should reject login when the account does not have the Customer role", async () => {
      userRepository.findByEmail.mockResolvedValue(
        buildUserWithRole({
          isActive: true,
          userRoles: [{ role: { id: 1, name: "Admin" } }],
        }),
      );
      jest.mocked(comparePassword).mockResolvedValue(true);

      await expect(
        service.loginCustomer({
          email: "jane.doe@example.com",
          password: "Password1",
        }),
      ).rejects.toBeInstanceOf(ForbiddenError);
    });
  });

  describe("activateUser", () => {
    it("should activate an inactive user and clear deactivatedAt", async () => {
      userRepository.activateById.mockResolvedValue(
        buildUserWithRole({
          id: 3,
          isActive: true,
          deactivatedAt: null,
        }),
      );

      await expect(service.activateUser(3)).resolves.toMatchObject({
        id: 3,
        isActive: true,
        deactivatedAt: null,
      });

      expect(userRepository.activateById).toHaveBeenCalledWith(3);
    });

    it("should return NotFoundError when the user does not exist", async () => {
      userRepository.activateById.mockRejectedValue(new NotFoundError("User not found"));

      await expect(service.activateUser(99)).rejects.toBeInstanceOf(NotFoundError);
      expect(userRepository.activateById).toHaveBeenCalledWith(99);
    });

    it("should return ConflictError when the user is already active", async () => {
      userRepository.activateById.mockRejectedValue(new ConflictError("User account is already active"));

      await expect(service.activateUser(4)).rejects.toBeInstanceOf(ConflictError);
      expect(userRepository.activateById).toHaveBeenCalledWith(4);
    });

    it("should allow the activated customer to log in afterwards", async () => {
      userRepository.activateById.mockResolvedValue(
        buildUserWithRole({
          id: 5,
          isActive: true,
          deactivatedAt: null,
        }),
      );
      jest.mocked(comparePassword).mockResolvedValue(true);

      await service.activateUser(5);
      userRepository.findByEmail.mockResolvedValue(
        buildUserWithRole({
          id: 5,
          isActive: true,
          deactivatedAt: null,
        }),
      );

      await expect(
        service.loginCustomer({
          email: "jane.doe@example.com",
          password: "Password1",
        }),
      ).resolves.toEqual({
        accessToken: "signed-jwt",
        tokenType: "Bearer",
        expiresIn: "1h",
      });
    });
  });

  describe("deactivateUser", () => {
    it("should deactivate another active user", async () => {
      userRepository.deactivateById.mockResolvedValue(
        buildUserWithRole({
          id: 8,
          isActive: false,
          deactivatedAt: new Date("2024-01-03T00:00:00.000Z"),
        }),
      );

      await expect(service.deactivateUser(7, 8)).resolves.toMatchObject({
        id: 8,
        isActive: false,
      });

      expect(userRepository.deactivateById).toHaveBeenCalledWith(8);
    });

    it("should reject self-deactivation", async () => {
      await expect(service.deactivateUser(7, 7)).rejects.toBeInstanceOf(ForbiddenError);
      expect(userRepository.deactivateById).not.toHaveBeenCalled();
    });

    it("should return NotFoundError when the user does not exist", async () => {
      userRepository.deactivateById.mockRejectedValue(new NotFoundError("User not found"));

      await expect(service.deactivateUser(7, 99)).rejects.toBeInstanceOf(NotFoundError);
      expect(userRepository.deactivateById).toHaveBeenCalledWith(99);
    });

    it("should return ConflictError when the user is already inactive", async () => {
      userRepository.deactivateById.mockRejectedValue(new ConflictError("User account is already inactive"));

      await expect(service.deactivateUser(7, 8)).rejects.toBeInstanceOf(ConflictError);
      expect(userRepository.deactivateById).toHaveBeenCalledWith(8);
    });

    it("should return ConflictError when deactivation would remove the last active Admin", async () => {
      userRepository.deactivateById.mockRejectedValue(new ConflictError("At least one active Admin user must remain"));

      await expect(service.deactivateUser(7, 8)).rejects.toBeInstanceOf(ConflictError);
      expect(userRepository.deactivateById).toHaveBeenCalledWith(8);
    });

    it("should prevent the deactivated customer from logging in afterwards", async () => {
      userRepository.deactivateById.mockResolvedValue(
        buildUserWithRole({
          id: 5,
          isActive: false,
          deactivatedAt: new Date("2024-01-03T00:00:00.000Z"),
        }),
      );
      jest.mocked(comparePassword).mockResolvedValue(true);

      await service.deactivateUser(7, 5);
      userRepository.findByEmail.mockResolvedValue(
        buildUserWithRole({
          id: 5,
          isActive: false,
          deactivatedAt: new Date("2024-01-03T00:00:00.000Z"),
        }),
      );

      await expect(
        service.loginCustomer({
          email: "jane.doe@example.com",
          password: "Password1",
        }),
      ).rejects.toBeInstanceOf(ForbiddenError);
    });
  });

  describe("getCurrentUser", () => {
    it("should return the current active user profile", async () => {
      userRepository.findById.mockResolvedValue(
        buildUserWithRole({
          id: 7,
          isActive: true,
          deactivatedAt: null,
          userRoles: [{ role: { id: 2, name: "Customer" } }],
        }),
      );

      await expect(service.getCurrentUser(7)).resolves.toMatchObject({
        id: 7,
        role: "Customer",
        isActive: true,
      });
    });

    it("should reject when the current user does not exist", async () => {
      userRepository.findById.mockResolvedValue(null);

      await expect(service.getCurrentUser(7)).rejects.toBeInstanceOf(UnauthorizedError);
    });
  });

  describe("assertActiveUserWithRole", () => {
    it("should allow an active user with the expected role", async () => {
      userRepository.findById.mockResolvedValue(
        buildUserWithRole({
          id: 8,
          isActive: true,
          deactivatedAt: null,
          userRoles: [{ role: { id: 2, name: "Customer" } }],
        }),
      );

      await expect(service.assertActiveUserWithRole(8, "Customer")).resolves.toBeUndefined();
      expect(userRepository.findById).toHaveBeenCalledWith(8);
    });

    it("should reject when the user is inactive", async () => {
      userRepository.findById.mockResolvedValue(
        buildUserWithRole({
          id: 8,
          isActive: false,
          deactivatedAt: null,
          userRoles: [{ role: { id: 2, name: "Customer" } }],
        }),
      );

      await expect(service.assertActiveUserWithRole(8, "Customer")).rejects.toBeInstanceOf(UnauthorizedError);
    });

    it("should reject when the user does not have the expected role", async () => {
      userRepository.findById.mockResolvedValue(
        buildUserWithRole({
          id: 8,
          isActive: true,
          deactivatedAt: null,
          userRoles: [{ role: { id: 1, name: "Admin" } }],
        }),
      );

      await expect(service.assertActiveUserWithRole(8, "Customer")).rejects.toBeInstanceOf(ForbiddenError);
    });
  });

  describe("assertActiveAdminUser", () => {
    it("should allow an active admin user", async () => {
      userRepository.findById.mockResolvedValue(
        buildUserWithRole({
          id: 7,
          isActive: true,
          deactivatedAt: null,
          userRoles: [{ role: { id: 1, name: "Admin" } }],
        }),
      );

      await expect(service.assertActiveAdminUser(7)).resolves.toBeUndefined();
      expect(userRepository.findById).toHaveBeenCalledWith(7);
    });

    it("should reject when the admin user does not exist", async () => {
      userRepository.findById.mockResolvedValue(null);

      await expect(service.assertActiveAdminUser(7)).rejects.toBeInstanceOf(UnauthorizedError);
    });

    it("should reject when the admin user is inactive", async () => {
      userRepository.findById.mockResolvedValue(
        buildUserWithRole({
          id: 7,
          isActive: false,
          userRoles: [{ role: { id: 1, name: "Admin" } }],
        }),
      );

      await expect(service.assertActiveAdminUser(7)).rejects.toBeInstanceOf(UnauthorizedError);
    });

    it("should reject when the user does not have the Admin role", async () => {
      userRepository.findById.mockResolvedValue(
        buildUserWithRole({
          id: 7,
          isActive: true,
          deactivatedAt: null,
          userRoles: [{ role: { id: 2, name: "Customer" } }],
        }),
      );

      await expect(service.assertActiveAdminUser(7)).rejects.toBeInstanceOf(ForbiddenError);
    });
  });

  describe("toResponseDto edge cases (via createAdminUser)", () => {
    it("should throw InternalError when the created user has no roles", async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      roleRepository.findByName.mockResolvedValue({ id: 1, name: "Admin", createdAt: new Date(), updatedAt: new Date() });
      userRepository.create.mockResolvedValue(buildUserWithRole({ userRoles: [] }));

      await expect(
        service.createAdminUser({
          firstName: "Jane",
          lastName: "Doe",
          email: "jane.doe@example.com",
          mobileNumber: "+15551234567",
          password: "Password1",
          role: "Admin",
        }),
      ).rejects.toBeInstanceOf(InternalError);
    });

    it("should throw InternalError when the created user has an unrecognised role name", async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      roleRepository.findByName.mockResolvedValue({ id: 99, name: "SuperAdmin", createdAt: new Date(), updatedAt: new Date() });
      userRepository.create.mockResolvedValue(
        buildUserWithRole({ userRoles: [{ role: { id: 99, name: "SuperAdmin" } }] }),
      );

      await expect(
        service.createAdminUser({
          firstName: "Jane",
          lastName: "Doe",
          email: "jane.doe@example.com",
          mobileNumber: "+15551234567",
          password: "Password1",
          role: "Admin",
        }),
      ).rejects.toBeInstanceOf(InternalError);
    });

    describe("hasAnyAdminUsers", () => {
      it("should return true when repository reports an existing Admin user", async () => {
        userRepository.hasAnyAdminUser.mockResolvedValue(true);
        await expect(service.hasAnyAdminUsers()).resolves.toBe(true);
        expect(userRepository.hasAnyAdminUser).toHaveBeenCalledTimes(1);
      });
    });
  });
});
