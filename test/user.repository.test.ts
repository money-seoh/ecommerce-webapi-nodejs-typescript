import { Prisma } from "@prisma/client";
import { UserRepository } from "../src/repositories/user.repository";
import { ConflictError, InternalError, NotFoundError } from "../src/utils/errors";
import { buildUserWithRole } from "./fixtures/user.fixtures";

interface MockPrismaClient {
  $transaction: jest.Mock;
  user: {
    findUnique: jest.Mock;
    create: jest.Mock;
    count: jest.Mock;
    updateMany: jest.Mock;
  };
}

function makePrismaClient(): MockPrismaClient {
  return {
    $transaction: jest.fn(),
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
      updateMany: jest.fn(),
    },
  };
}

function makeKnownRequestError(code: string): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError("db error", {
    code,
    clientVersion: "5.0.0",
  });
}

function makeValidationError(): Prisma.PrismaClientValidationError {
  return new Prisma.PrismaClientValidationError("validation error", {
    clientVersion: "5.0.0",
  });
}

describe("UserRepository", () => {
  describe("findByEmail", () => {
    it("should return a user when found", async () => {
      const user = buildUserWithRole();
      const prisma = makePrismaClient();
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(user);
      const repo = new UserRepository(prisma as never);
      const result = await repo.findByEmail("jane.doe@example.com");
      expect(result).toEqual(user);
    });

    it("should return null when user is not found", async () => {
      const prisma = makePrismaClient();
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      const repo = new UserRepository(prisma as never);
      const result = await repo.findByEmail("nobody@example.com");
      expect(result).toBeNull();
    });

    it("should throw InternalError on PrismaClientKnownRequestError", async () => {
      const prisma = makePrismaClient();
      (prisma.user.findUnique as jest.Mock).mockRejectedValue(makeKnownRequestError("P2001"));
      const repo = new UserRepository(prisma as never);
      await expect(repo.findByEmail("test@example.com")).rejects.toBeInstanceOf(InternalError);
    });

    it("should throw InternalError on PrismaClientValidationError", async () => {
      const prisma = makePrismaClient();
      (prisma.user.findUnique as jest.Mock).mockRejectedValue(makeValidationError());
      const repo = new UserRepository(prisma as never);
      await expect(repo.findByEmail("test@example.com")).rejects.toBeInstanceOf(InternalError);
    });

    it("should rethrow unknown errors", async () => {
      const prisma = makePrismaClient();
      const unknownError = new Error("network timeout");
      (prisma.user.findUnique as jest.Mock).mockRejectedValue(unknownError);
      const repo = new UserRepository(prisma as never);
      await expect(repo.findByEmail("test@example.com")).rejects.toBe(unknownError);
    });
  });

  describe("findById", () => {
    it("should return a user when found", async () => {
      const user = buildUserWithRole({ id: 5 });
      const prisma = makePrismaClient();
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(user);
      const repo = new UserRepository(prisma as never);
      const result = await repo.findById(5);
      expect(result).toEqual(user);
    });

    it("should return null when user is not found", async () => {
      const prisma = makePrismaClient();
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      const repo = new UserRepository(prisma as never);
      const result = await repo.findById(999);
      expect(result).toBeNull();
    });

    it("should throw InternalError on PrismaClientKnownRequestError", async () => {
      const prisma = makePrismaClient();
      (prisma.user.findUnique as jest.Mock).mockRejectedValue(makeKnownRequestError("P2001"));
      const repo = new UserRepository(prisma as never);
      await expect(repo.findById(1)).rejects.toBeInstanceOf(InternalError);
    });

    it("should throw InternalError on PrismaClientValidationError", async () => {
      const prisma = makePrismaClient();
      (prisma.user.findUnique as jest.Mock).mockRejectedValue(makeValidationError());
      const repo = new UserRepository(prisma as never);
      await expect(repo.findById(1)).rejects.toBeInstanceOf(InternalError);
    });

    it("should rethrow unknown errors", async () => {
      const prisma = makePrismaClient();
      const unknownError = new Error("network timeout");
      (prisma.user.findUnique as jest.Mock).mockRejectedValue(unknownError);
      const repo = new UserRepository(prisma as never);
      await expect(repo.findById(1)).rejects.toBe(unknownError);
    });
  });

  describe("create", () => {
    const createData = {
      firstName: "Jane",
      lastName: "Doe",
      email: "jane.doe@example.com",
      mobileNumber: "+15551234567",
      passwordHash: "hashed",
      isActive: false,
      roleId: 1,
    };

    it("should return the created user", async () => {
      const user = buildUserWithRole();
      const prisma = makePrismaClient();
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback: (tx: MockPrismaClient) => Promise<unknown>) =>
        callback(prisma),
      );
      (prisma.user.create as jest.Mock).mockResolvedValue(user);
      const repo = new UserRepository(prisma as never);
      const result = await repo.create(createData);
      expect(result).toEqual(user);
    });

    it("should throw ConflictError on P2002 (unique constraint)", async () => {
      const prisma = makePrismaClient();
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback: (tx: MockPrismaClient) => Promise<unknown>) =>
        callback(prisma),
      );
      (prisma.user.create as jest.Mock).mockRejectedValue(makeKnownRequestError("P2002"));
      const repo = new UserRepository(prisma as never);
      await expect(repo.create(createData)).rejects.toBeInstanceOf(ConflictError);
    });

    it("should throw NotFoundError on P2025 (record not found)", async () => {
      const prisma = makePrismaClient();
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback: (tx: MockPrismaClient) => Promise<unknown>) =>
        callback(prisma),
      );
      (prisma.user.create as jest.Mock).mockRejectedValue(makeKnownRequestError("P2025"));
      const repo = new UserRepository(prisma as never);
      await expect(repo.create(createData)).rejects.toBeInstanceOf(NotFoundError);
    });

    it("should rethrow unhandled PrismaClientKnownRequestError codes", async () => {
      const prisma = makePrismaClient();
      const knownError = makeKnownRequestError("P2003");
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback: (tx: MockPrismaClient) => Promise<unknown>) =>
        callback(prisma),
      );
      (prisma.user.create as jest.Mock).mockRejectedValue(knownError);
      const repo = new UserRepository(prisma as never);
      await expect(repo.create(createData)).rejects.toBe(knownError);
    });

    it("should throw InternalError on PrismaClientValidationError", async () => {
      const prisma = makePrismaClient();
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback: (tx: MockPrismaClient) => Promise<unknown>) =>
        callback(prisma),
      );
      (prisma.user.create as jest.Mock).mockRejectedValue(makeValidationError());
      const repo = new UserRepository(prisma as never);
      await expect(repo.create(createData)).rejects.toBeInstanceOf(InternalError);
    });

    it("should rethrow unknown errors", async () => {
      const prisma = makePrismaClient();
      const unknownError = new Error("unexpected");
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback: (tx: MockPrismaClient) => Promise<unknown>) =>
        callback(prisma),
      );
      (prisma.user.create as jest.Mock).mockRejectedValue(unknownError);
      const repo = new UserRepository(prisma as never);
      await expect(repo.create(createData)).rejects.toBe(unknownError);
    });
  });

  describe("hasAnyAdminUser", () => {
    it("should return true when at least one non-deactivated Admin exists", async () => {
      const prisma = makePrismaClient();
      (prisma.user.count as jest.Mock).mockResolvedValue(1);
      const repo = new UserRepository(prisma as never);

      await expect(repo.hasAnyAdminUser()).resolves.toBe(true);
      expect(prisma.user.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ deactivatedAt: null }),
        }),
      );
      const queryArgs = (prisma.user.count as jest.Mock).mock.calls[0][0];
      expect(queryArgs.where).not.toHaveProperty("isActive");
    });

    it("should return false when no Admin exists", async () => {
      const prisma = makePrismaClient();
      (prisma.user.count as jest.Mock).mockResolvedValue(0);
      const repo = new UserRepository(prisma as never);
      await expect(repo.hasAnyAdminUser()).resolves.toBe(false);
    });

    it("should throw InternalError on PrismaClientKnownRequestError", async () => {
      const prisma = makePrismaClient();
      (prisma.user.count as jest.Mock).mockRejectedValue(makeKnownRequestError("P2001"));
      const repo = new UserRepository(prisma as never);
      await expect(repo.hasAnyAdminUser()).rejects.toBeInstanceOf(InternalError);
    });
  });

  describe("activateById", () => {
    it("should update activation state atomically and clear deactivatedAt", async () => {
      const user = buildUserWithRole({ id: 7, isActive: true, deactivatedAt: null });
      const prisma = makePrismaClient();
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback: (tx: MockPrismaClient) => Promise<unknown>) =>
        callback(prisma),
      );
      (prisma.user.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(user);
      const repo = new UserRepository(prisma as never);

      await expect(repo.activateById(7)).resolves.toEqual(user);
      expect(prisma.$transaction).toHaveBeenCalledWith(
        expect.any(Function),
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
      expect(prisma.user.updateMany).toHaveBeenCalledWith({
        where: {
          id: 7,
          OR: [
            { isActive: false },
            { deactivatedAt: { not: null } },
          ],
        },
        data: {
          isActive: true,
          deactivatedAt: null,
        },
      });
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 7 },
        include: expect.any(Object),
      });
    });

    it("should throw NotFoundError when the user does not exist", async () => {
      const prisma = makePrismaClient();
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback: (tx: MockPrismaClient) => Promise<unknown>) =>
        callback(prisma),
      );
      (prisma.user.updateMany as jest.Mock).mockResolvedValue({ count: 0 });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      const repo = new UserRepository(prisma as never);

      await expect(repo.activateById(7)).rejects.toBeInstanceOf(NotFoundError);
    });

    it("should throw ConflictError when the user is already active", async () => {
      const prisma = makePrismaClient();
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback: (tx: MockPrismaClient) => Promise<unknown>) =>
        callback(prisma),
      );
      (prisma.user.updateMany as jest.Mock).mockResolvedValue({ count: 0 });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 7, isActive: true, deactivatedAt: null });
      const repo = new UserRepository(prisma as never);

      await expect(repo.activateById(7)).rejects.toBeInstanceOf(ConflictError);
    });

    it("should throw InternalError on PrismaClientKnownRequestError", async () => {
      const prisma = makePrismaClient();
      (prisma.$transaction as jest.Mock).mockRejectedValue(makeKnownRequestError("P2001"));
      const repo = new UserRepository(prisma as never);

      await expect(repo.activateById(7)).rejects.toBeInstanceOf(InternalError);
    });

    it("should throw NotFoundError on P2025 during activation transaction", async () => {
      const prisma = makePrismaClient();
      (prisma.$transaction as jest.Mock).mockRejectedValue(makeKnownRequestError("P2025"));
      const repo = new UserRepository(prisma as never);

      await expect(repo.activateById(7)).rejects.toBeInstanceOf(NotFoundError);
    });

    it("should throw InternalError on PrismaClientValidationError", async () => {
      const prisma = makePrismaClient();
      (prisma.$transaction as jest.Mock).mockRejectedValue(makeValidationError());
      const repo = new UserRepository(prisma as never);

      await expect(repo.activateById(7)).rejects.toBeInstanceOf(InternalError);
    });
  });

  describe("deactivateById", () => {
    it("should update deactivation state atomically by setting isActive to false", async () => {
      const user = buildUserWithRole({
        id: 7,
        isActive: false,
        deactivatedAt: null,
        userRoles: [{ role: { id: 2, name: "Customer" } }],
      });
      const prisma = makePrismaClient();
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback: (tx: MockPrismaClient) => Promise<unknown>) =>
        callback(prisma),
      );
      (prisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce(buildUserWithRole({
          id: 7,
          isActive: true,
          deactivatedAt: null,
          userRoles: [{ role: { id: 2, name: "Customer" } }],
        }))
        .mockResolvedValueOnce(user);
      (prisma.user.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
      const repo = new UserRepository(prisma as never);

      await expect(repo.deactivateById(7)).resolves.toEqual(user);
      expect(prisma.$transaction).toHaveBeenCalledWith(
        expect.any(Function),
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
      expect(prisma.user.updateMany).toHaveBeenCalledWith({
        where: {
          id: 7,
          isActive: true,
          deactivatedAt: null,
        },
        data: {
          isActive: false,
        },
      });
      expect(prisma.user.count).not.toHaveBeenCalled();
      expect(prisma.user.findUnique).toHaveBeenNthCalledWith(2, {
        where: { id: 7 },
        include: expect.any(Object),
      });
    });

    it("should prevent deactivation of the last active Admin", async () => {
      const prisma = makePrismaClient();
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback: (tx: MockPrismaClient) => Promise<unknown>) =>
        callback(prisma),
      );
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(buildUserWithRole({
        id: 7,
        isActive: true,
        deactivatedAt: null,
        userRoles: [{ role: { id: 1, name: "Admin" } }],
      }));
      (prisma.user.count as jest.Mock).mockResolvedValue(1);
      const repo = new UserRepository(prisma as never);

      await expect(repo.deactivateById(7)).rejects.toBeInstanceOf(ConflictError);
      expect(prisma.user.updateMany).not.toHaveBeenCalled();
    });

    it("should throw NotFoundError when the user does not exist", async () => {
      const prisma = makePrismaClient();
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback: (tx: MockPrismaClient) => Promise<unknown>) =>
        callback(prisma),
      );
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      const repo = new UserRepository(prisma as never);

      await expect(repo.deactivateById(7)).rejects.toBeInstanceOf(NotFoundError);
    });

    it("should throw ConflictError when the user is already inactive", async () => {
      const prisma = makePrismaClient();
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback: (tx: MockPrismaClient) => Promise<unknown>) =>
        callback(prisma),
      );
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(buildUserWithRole({
        id: 7,
        isActive: false,
        deactivatedAt: new Date("2024-01-03T00:00:00.000Z"),
      }));
      const repo = new UserRepository(prisma as never);

      await expect(repo.deactivateById(7)).rejects.toBeInstanceOf(ConflictError);
    });

    it("should throw NotFoundError on P2025 during deactivation transaction", async () => {
      const prisma = makePrismaClient();
      (prisma.$transaction as jest.Mock).mockRejectedValue(makeKnownRequestError("P2025"));
      const repo = new UserRepository(prisma as never);

      await expect(repo.deactivateById(7)).rejects.toBeInstanceOf(NotFoundError);
    });

    it("should throw InternalError on PrismaClientKnownRequestError", async () => {
      const prisma = makePrismaClient();
      (prisma.$transaction as jest.Mock).mockRejectedValue(makeKnownRequestError("P2001"));
      const repo = new UserRepository(prisma as never);

      await expect(repo.deactivateById(7)).rejects.toBeInstanceOf(InternalError);
    });

    it("should throw InternalError on PrismaClientValidationError", async () => {
      const prisma = makePrismaClient();
      (prisma.$transaction as jest.Mock).mockRejectedValue(makeValidationError());
      const repo = new UserRepository(prisma as never);

      await expect(repo.deactivateById(7)).rejects.toBeInstanceOf(InternalError);
    });
  });
});
