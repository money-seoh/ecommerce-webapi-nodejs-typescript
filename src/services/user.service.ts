import { RoleRepository } from "../repositories/role.repository";
import { UserRepository, UserWithRole } from "../repositories/user.repository";
import { comparePassword, hashPassword } from "../utils/password";
import { ConflictError, ForbiddenError, InternalError, UnauthorizedError } from "../utils/errors";
import {
  AuthTokenResponseDto,
  CustomerLoginDto,
  CreateAdminUserDto,
  RegisterCustomerDto,
  RoleName,
  ROLE_NAMES,
  UpdateAdminUserDto,
  UpdateCustomerProfileDto,
  UserResponseDto,
} from "../dtos/user.dto";
import { createAccessToken } from "../utils/token";
import { env } from "../config/env";

export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly roleRepository: RoleRepository,
  ) {}

  /**
   * Admin-initiated user creation. Admin may create Admin or Customer
   * accounts; activation is derived server-side from the assigned role.
   */
  async createAdminUser(dto: CreateAdminUserDto): Promise<UserResponseDto> {
    const normalizedEmail = this.normalizeEmail(dto.email);
    await this.ensureEmailIsAvailable(normalizedEmail);

    const role = await this.roleRepository.findByName(dto.role);
    if (!role) {
      throw new InternalError(`Role not configured: ${dto.role}`);
    }

    const passwordHash = await hashPassword(dto.password);

    const user = await this.userRepository.create({
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: normalizedEmail,
      mobileNumber: dto.mobileNumber,
      passwordHash,
      isActive: dto.role === ROLE_NAMES.ADMIN,
      roleId: role.id,
    });

    return this.toResponseDto(user);
  }

  async updateAdminUser(userId: number, dto: UpdateAdminUserDto): Promise<UserResponseDto> {
    const passwordHash = dto.password === undefined ? undefined : await hashPassword(dto.password);
    const user = await this.userRepository.updateById(userId, {
      firstName: dto.firstName,
      lastName: dto.lastName,
      mobileNumber: dto.mobileNumber,
      ...(passwordHash === undefined ? {} : { passwordHash }),
    });

    return this.toResponseDto(user);
  }

  async updateCustomerProfile(userId: number, dto: UpdateCustomerProfileDto): Promise<UserResponseDto> {
    await this.assertActiveUserWithRole(userId, ROLE_NAMES.CUSTOMER);
    const passwordHash = dto.password === undefined ? undefined : await hashPassword(dto.password);
    const user = await this.userRepository.updateById(userId, {
      firstName: dto.firstName,
      lastName: dto.lastName,
      mobileNumber: dto.mobileNumber,
      ...(passwordHash === undefined ? {} : { passwordHash }),
    });

    return this.toResponseDto(user);
  }

  /**
   * Customer self-registration. Role is always Customer and the account is
   * always created Inactive, regardless of any client-submitted values.
   */
  async registerCustomer(dto: RegisterCustomerDto): Promise<UserResponseDto> {
    const normalizedEmail = this.normalizeEmail(dto.email);
    await this.ensureEmailIsAvailable(normalizedEmail);

    const role = await this.roleRepository.findByName(ROLE_NAMES.CUSTOMER);
    if (!role) {
      throw new InternalError(`Role not configured: ${ROLE_NAMES.CUSTOMER}`);
    }

    const passwordHash = await hashPassword(dto.password);

    const user = await this.userRepository.create({
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: normalizedEmail,
      mobileNumber: dto.mobileNumber,
      passwordHash,
      isActive: false,
      roleId: role.id,
    });

    return this.toResponseDto(user);
  }

  async loginCustomer(dto: CustomerLoginDto): Promise<AuthTokenResponseDto> {
    const normalizedEmail = this.normalizeEmail(dto.email);
    const user = await this.userRepository.findByEmail(normalizedEmail);
    if (!user) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const passwordMatches = await comparePassword(dto.password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const hasCustomerRole = user.userRoles.some(({ role }) => role.name === ROLE_NAMES.CUSTOMER);
    if (!hasCustomerRole) {
      throw new ForbiddenError("Account is not authorized for customer access");
    }

    if (!user.isActive || user.deactivatedAt !== null) {
      throw new ForbiddenError("Customer account is not active");
    }

    return {
      accessToken: createAccessToken(user.id, ROLE_NAMES.CUSTOMER),
      tokenType: "Bearer",
      expiresIn: env.jwtExpiresIn,
    };
  }

  async activateUser(userId: number): Promise<UserResponseDto> {
    const user = await this.userRepository.activateById(userId);
    return this.toResponseDto(user);
  }

  async deactivateUser(actorUserId: number, targetUserId: number): Promise<UserResponseDto> {
    if (actorUserId === targetUserId) {
      throw new ForbiddenError("Admins cannot deactivate their own accounts");
    }

    const user = await this.userRepository.deactivateById(targetUserId);
    return this.toResponseDto(user);
  }

  async getCurrentUser(userId: number): Promise<UserResponseDto> {
    const user = await this.getActiveUserById(userId);
    return this.toResponseDto(user);
  }

  async assertActiveUserWithRole(userId: number, role: RoleName): Promise<void> {
    const user = await this.getActiveUserById(userId);
    const hasRole = user.userRoles.some(({ role: userRole }) => userRole.name === role);
    if (!hasRole) {
      throw new ForbiddenError(`${role} role is required`);
    }
  }

  async assertActiveAdminUser(userId: number): Promise<void> {
    await this.assertActiveUserWithRole(userId, ROLE_NAMES.ADMIN);
  }

  async hasAnyAdminUsers(): Promise<boolean> {
    return this.userRepository.hasAnyAdminUser();
  }

  private async getActiveUserById(userId: number): Promise<UserWithRole> {
    const user = await this.userRepository.findById(userId);
    if (!user || !user.isActive || user.deactivatedAt !== null) {
      throw new UnauthorizedError("Authentication required");
    }

    return user;
  }

  private async ensureEmailIsAvailable(email: string): Promise<void> {
    const existing = await this.userRepository.findByEmail(email);
    if (existing) {
      throw new ConflictError("A user with this email already exists");
    }
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private toResponseDto(user: UserWithRole): UserResponseDto {
    if (user.userRoles.length !== 1) {
      throw new InternalError(
        `User ${user.id} has ${user.userRoles.length} role(s); exactly one is required`,
      );
    }

    const roleName = user.userRoles[0].role.name;
    const validRoleNames: readonly string[] = Object.values(ROLE_NAMES);
    if (!validRoleNames.includes(roleName)) {
      throw new InternalError(`Unrecognised role name: ${roleName}`);
    }

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      mobileNumber: user.mobileNumber,
      role: roleName as RoleName,
      isActive: user.isActive,
      deactivatedAt: user.deactivatedAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
