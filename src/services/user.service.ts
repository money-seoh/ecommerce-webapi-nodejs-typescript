import { RoleRepository } from "../repositories/role.repository";
import { UserRepository, UserWithRole } from "../repositories/user.repository";
import { hashPassword } from "../utils/password";
import { ConflictError, InternalError } from "../utils/errors";
import {
  CreateAdminUserDto,
  RegisterCustomerDto,
  ROLE_NAMES,
  UserResponseDto,
} from "../dtos/user.dto";

export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly roleRepository: RoleRepository,
  ) {}

  /**
   * Admin-initiated user creation. Admin may create Admin or Customer
   * accounts; isActive defaults to false (Inactive) when not provided.
   */
  async createAdminUser(dto: CreateAdminUserDto): Promise<UserResponseDto> {
    await this.ensureEmailIsAvailable(dto.email);

    const role = await this.roleRepository.findByName(dto.role);
    if (!role) {
      throw new InternalError(`Role not configured: ${dto.role}`);
    }

    const passwordHash = await hashPassword(dto.password);

    const user = await this.userRepository.create({
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      mobileNumber: dto.mobileNumber,
      passwordHash,
      isActive: dto.isActive ?? false,
      roleId: role.id,
    });

    return this.toResponseDto(user);
  }

  /**
   * Customer self-registration. Role is always Customer and the account is
   * always created Active, regardless of any client-submitted values.
   */
  async registerCustomer(dto: RegisterCustomerDto): Promise<UserResponseDto> {
    await this.ensureEmailIsAvailable(dto.email);

    const role = await this.roleRepository.findByName(ROLE_NAMES.CUSTOMER);
    if (!role) {
      throw new InternalError(`Role not configured: ${ROLE_NAMES.CUSTOMER}`);
    }

    const passwordHash = await hashPassword(dto.password);

    const user = await this.userRepository.create({
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      mobileNumber: dto.mobileNumber,
      passwordHash,
      isActive: true,
      roleId: role.id,
    });

    return this.toResponseDto(user);
  }

  private async ensureEmailIsAvailable(email: string): Promise<void> {
    const existing = await this.userRepository.findByEmail(email);
    if (existing) {
      throw new ConflictError("A user with this email already exists");
    }
  }

  private toResponseDto(user: UserWithRole): UserResponseDto {
    if (user.userRoles.length !== 1) {
      throw new InternalError(
        `User ${user.id} has ${user.userRoles.length} role(s); exactly one is required`,
      );
    }

    const roleName = user.userRoles[0].role.name;

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      mobileNumber: user.mobileNumber,
      role: roleName as UserResponseDto["role"],
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
