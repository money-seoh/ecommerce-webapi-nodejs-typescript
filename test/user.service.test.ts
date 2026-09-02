import { UserService } from "../src/services/user.service";
import { UserRepository } from "../src/repositories/user.repository";
import { RoleRepository } from "../src/repositories/role.repository";
import { ConflictError, InternalError } from "../src/utils/errors";
import { buildUserWithRole } from "./fixtures/user.fixtures";

jest.mock("../src/repositories/user.repository");
jest.mock("../src/repositories/role.repository");
jest.mock("../src/utils/password", () => ({
  hashPassword: jest.fn().mockResolvedValue("hashed-password"),
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
  });

  describe("createAdminUser", () => {
    it("should default isActive to false when not provided", async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      roleRepository.findByName.mockResolvedValue({
        id: 1,
        name: "Admin",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      userRepository.create.mockResolvedValue(
        buildUserWithRole({ isActive: false, userRoles: [{ role: { id: 1, name: "Admin" } }] }),
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
          isActive: false,
          roleId: 1,
        }),
      );
    });

    it("should respect explicit isActive value when provided", async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      roleRepository.findByName.mockResolvedValue({
        id: 1,
        name: "Admin",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      userRepository.create.mockResolvedValue(buildUserWithRole({ isActive: true }));

      await service.createAdminUser({
        firstName: "Jane",
        lastName: "Doe",
        email: "jane.doe@example.com",
        mobileNumber: "+15551234567",
        password: "Password1",
        role: "Admin",
        isActive: true,
      });

      expect(userRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ isActive: true }),
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

  describe("registerCustomer", () => {
    it("should force role=Customer and isActive=true regardless of input", async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      roleRepository.findByName.mockResolvedValue({
        id: 2,
        name: "Customer",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      userRepository.create.mockResolvedValue(buildUserWithRole({ isActive: true }));

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
          isActive: true,
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
      userRepository.create.mockResolvedValue(buildUserWithRole({ isActive: true }));

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
