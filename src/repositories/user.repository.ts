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

export interface UpdateUserRecord {
  firstName: string;
  lastName: string;
  mobileNumber: string;
  passwordHash?: string;
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

  private readonly anyNonDeactivatedAdminWhere = {
    deactivatedAt: null,
    userRoles: {
      some: {
        role: {
          name: "Admin",
        },
      },
    },
  } satisfies Prisma.UserWhereInput;

  private readonly activeAdminWhere = {
    isActive: true,
    deactivatedAt: null,
    userRoles: {
      some: {
        role: {
          name: "Admin",
        },
      },
    },
  } satisfies Prisma.UserWhereInput;

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

  async updateById(id: number, data: UpdateUserRecord): Promise<UserWithRole> {
    try {
      return await this.prisma.$transaction(
        async (tx) => {
          const existingUser = await tx.user.findUnique({
            where: { id },
            include: userWithRoleInclude,
          });
          if (!existingUser) {
            throw new NotFoundError("User not found");
          }

          await tx.user.update({
            where: { id },
            data: {
              firstName: data.firstName,
              lastName: data.lastName,
              mobileNumber: data.mobileNumber,
              ...(data.passwordHash === undefined ? {} : { passwordHash: data.passwordHash }),
            },
          });

          const updatedUser = await tx.user.findUnique({
            where: { id },
            include: userWithRoleInclude,
          });
          if (!updatedUser) {
            throw new NotFoundError("User not found");
          }

          return updatedUser;
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      if (error instanceof ConflictError || error instanceof NotFoundError || error instanceof InternalError) {
        throw error;
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          throw new ConflictError("A user with this email already exists");
        }
        if (error.code === "P2025") {
          throw new NotFoundError("User not found");
        }
        throw new InternalError("Database error in updateById");
      }
      if (error instanceof Prisma.PrismaClientValidationError) {
        throw new InternalError("Invalid user update request");
      }
      throw error;
    }
  }

  async hasAnyAdminUser(): Promise<boolean> {
    try {
      const adminCount = await this.prisma.user.count({
        where: this.anyNonDeactivatedAdminWhere,
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

  async activateById(id: number): Promise<UserWithRole> {
    try {
      return await this.prisma.$transaction(
        async (tx) => {
          const activationResult = await tx.user.updateMany({
            where: {
              id,
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

          if (activationResult.count === 0) {
            const existingUser = await tx.user.findUnique({
              where: { id },
              select: {
                id: true,
                isActive: true,
                deactivatedAt: true,
              },
            });

            if (!existingUser) {
              throw new NotFoundError("User not found");
            }

            if (existingUser.isActive && existingUser.deactivatedAt === null) {
              throw new ConflictError("User account is already active");
            }

            throw new InternalError("User activation state could not be updated");
          }

          const activatedUser = await tx.user.findUnique({
            where: { id },
            include: userWithRoleInclude,
          });

          if (!activatedUser) {
            throw new NotFoundError("User not found");
          }

          return activatedUser;
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      if (error instanceof ConflictError || error instanceof NotFoundError) {
        throw error;
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2025") {
          throw new NotFoundError("User not found");
        }
        throw new InternalError("Database error in activateById");
      }
      if (error instanceof Prisma.PrismaClientValidationError) {
        throw new InternalError("Invalid query for activateById");
      }
      throw error;
    }
  }

  async deactivateById(id: number): Promise<UserWithRole> {
    try {
      return await this.prisma.$transaction(
        async (tx) => {
          const existingUser = await tx.user.findUnique({
            where: { id },
            include: userWithRoleInclude,
          });

          if (!existingUser) {
            throw new NotFoundError("User not found");
          }

          if (!existingUser.isActive || existingUser.deactivatedAt !== null) {
            throw new ConflictError("User account is already inactive");
          }

          const isAdminUser = existingUser.userRoles.some(({ role }) => role.name === "Admin");
          if (isAdminUser) {
            const activeAdminCount = await tx.user.count({
              where: this.activeAdminWhere,
            });

            if (activeAdminCount <= 1) {
              throw new ConflictError("At least one active Admin user must remain");
            }
          }

          const deactivationResult = await tx.user.updateMany({
            where: {
              id,
              isActive: true,
              deactivatedAt: null,
            },
            data: {
              isActive: false,
            },
          });

          if (deactivationResult.count === 0) {
            throw new InternalError("User deactivation state could not be updated");
          }

          const deactivatedUser = await tx.user.findUnique({
            where: { id },
            include: userWithRoleInclude,
          });

          if (!deactivatedUser) {
            throw new NotFoundError("User not found");
          }

          return deactivatedUser;
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      if (error instanceof ConflictError || error instanceof NotFoundError) {
        throw error;
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2025") {
          throw new NotFoundError("User not found");
        }
        throw new InternalError("Database error in deactivateById");
      }
      if (error instanceof Prisma.PrismaClientValidationError) {
        throw new InternalError("Invalid query for deactivateById");
      }
      throw error;
    }
  }
}
