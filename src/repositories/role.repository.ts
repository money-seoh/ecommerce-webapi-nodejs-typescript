import { Prisma, PrismaClient, Role } from "@prisma/client";
import { InternalError } from "../utils/errors";

export class RoleRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByName(name: string): Promise<Role | null> {
    try {
      return await this.prisma.role.findUnique({ where: { name } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientValidationError) {
        throw new InternalError("Invalid role lookup request");
      }
      throw error;
    }
  }
}
