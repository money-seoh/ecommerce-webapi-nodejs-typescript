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
        expect.objectContaining({ isActive: false, roleId: 1 }),
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
        expect.objectContaining({ isActive: true, roleId: 2 }),
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
  });
});
