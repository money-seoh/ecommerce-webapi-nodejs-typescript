import { Prisma } from "@prisma/client";
import { RoleRepository } from "../src/repositories/role.repository";
import { InternalError } from "../src/utils/errors";

interface MockPrismaClient {
  role: {
    findUnique: jest.Mock;
  };
}

function makePrismaClient(): MockPrismaClient {
  return {
    role: {
      findUnique: jest.fn(),
    },
  };
}

function makeValidationError(): Prisma.PrismaClientValidationError {
  return new Prisma.PrismaClientValidationError("validation error", {
    clientVersion: "5.0.0",
  });
}

describe("RoleRepository", () => {
  describe("findByName", () => {
    it("should return a role when found", async () => {
      const role = { id: 1, name: "Admin", createdAt: new Date(), updatedAt: new Date() };
      const prisma = makePrismaClient();
      (prisma.role.findUnique as jest.Mock).mockResolvedValue(role);
      const repo = new RoleRepository(prisma as never);
      const result = await repo.findByName("Admin");
      expect(result).toEqual(role);
    });

    it("should return null when role is not found", async () => {
      const prisma = makePrismaClient();
      (prisma.role.findUnique as jest.Mock).mockResolvedValue(null);
      const repo = new RoleRepository(prisma as never);
      const result = await repo.findByName("Unknown");
      expect(result).toBeNull();
    });

    it("should throw InternalError on PrismaClientValidationError", async () => {
      const prisma = makePrismaClient();
      (prisma.role.findUnique as jest.Mock).mockRejectedValue(makeValidationError());
      const repo = new RoleRepository(prisma as never);
      await expect(repo.findByName("Admin")).rejects.toBeInstanceOf(InternalError);
    });

    it("should rethrow unknown errors", async () => {
      const prisma = makePrismaClient();
      const unknownError = new Error("network timeout");
      (prisma.role.findUnique as jest.Mock).mockRejectedValue(unknownError);
      const repo = new RoleRepository(prisma as never);
      await expect(repo.findByName("Admin")).rejects.toBe(unknownError);
    });
  });
});
