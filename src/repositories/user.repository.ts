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
    return this.prisma.user.findUnique({
      where: { email },
      include: userWithRoleInclude,
    });
  }

  async findById(id: number): Promise<UserWithRole | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: userWithRoleInclude,
    });
  }

  async create(data: CreateUserRecord): Promise<UserWithRole> {
    try {
      return await this.prisma.user.create({
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
}
