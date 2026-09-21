import { Prisma, PrismaClient, User } from "@prisma/client";
import { ConflictError, InternalError, NotFoundError } from "../utils/errors";

export interface CreateUserRecord {
  firstName: string;
  lastName: string;
  email: string;
  mobileNumber: string;
  passwordHash: string;
  isActive: boolean;
  roleId: number;
}

export interface UserWithRole extends User {
  userRoles: {
    role: {
      id: number;
      name: string;
    };
  }[];
}

const userWithRoleInclude = {
  userRoles: {
    include: {
      role: {
        select: { id: true, name: true },
      },
    },
  },
} satisfies Prisma.UserInclude;

export class UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByEmail(email: string): Promise<UserWithRole | null> {
    try {
      return await this.prisma.user.findUnique({
        where: { email },
        include: userWithRoleInclude,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new InternalError("Database error in findByEmail");
      }
      if (error instanceof Prisma.PrismaClientValidationError) {
        throw new InternalError("Invalid query for findByEmail");
      }
      throw error;
    }
  }

  async findById(id: number): Promise<UserWithRole | null> {
    try {
      return await this.prisma.user.findUnique({
        where: { id },
        include: userWithRoleInclude,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new InternalError("Database error in findById");
      }
      if (error instanceof Prisma.PrismaClientValidationError) {
        throw new InternalError("Invalid query for findById");
      }
      throw error;
    }
  }

  async create(data: CreateUserRecord): Promise<UserWithRole> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        return tx.user.create({
          data: {
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            mobileNumber: data.mobileNumber,
            passwordHash: data.passwordHash,
            isActive: data.isActive,
            userRoles: {
              create: {
                roleId: data.roleId,
              },
            },
          },
          include: userWithRoleInclude,
        });
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          throw new ConflictError("A user with this email already exists");
        }
        if (error.code === "P2025") {
          throw new NotFoundError("Referenced record not found");
        }
      }
      if (error instanceof Prisma.PrismaClientValidationError) {
        throw new InternalError("Invalid user creation request");
      }
      throw error;
    }
  }

  async hasAnyAdminUser(): Promise<boolean> {
    try {
      const adminCount = await this.prisma.user.count({
        where: {
          userRoles: {
            some: {
              role: {
                name: "Admin",
              },
            },
          },
          deactivatedAt: null,
        },
      });
      return adminCount > 0;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new InternalError("Database error in hasAnyAdminUser");
      }
      if (error instanceof Prisma.PrismaClientValidationError) {
        throw new InternalError("Invalid query for hasAnyAdminUser");
      }
      throw error;
    }
  }

  async updateActivationStatus(id: number, isActive: boolean, deactivatedAt: Date | null): Promise<UserWithRole> {
    try {
      return await this.prisma.user.update({
        where: { id },
        data: {
          isActive,
          deactivatedAt,
        },
        include: userWithRoleInclude,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2025") {
          throw new NotFoundError("User not found");
        }
        throw new InternalError("Database error in updateActivationStatus");
      }
      if (error instanceof Prisma.PrismaClientValidationError) {
        throw new InternalError("Invalid query for updateActivationStatus");
      }
      throw error;
    }
  }
}
