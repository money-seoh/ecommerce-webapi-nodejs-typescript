import { z } from "zod";

export const ROLE_NAMES = {
  ADMIN: "Admin",
  CUSTOMER: "Customer",
} as const;

export type RoleName = (typeof ROLE_NAMES)[keyof typeof ROLE_NAMES];

// Password policy: minimum 8 characters, at least one letter and one number.
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .max(24, "Password must be at most 24 characters long")
  .regex(/[A-Za-z]/, "Password must contain at least one letter")
  .regex(/[0-9]/, "Password must contain at least one number");

const e164MobileNumberSchema = z
  .string()
  .trim()
  .regex(/^\+[1-9]\d{1,14}$/, "Mobile number must be a valid E.164 phone number");

const baseUserFields = {
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  email: z.string().trim().email("Email must be a valid email address"),
  mobileNumber: e164MobileNumberSchema,
  password: passwordSchema,
};

/**
 * DTO for admin-initiated user creation (POST /api/v1/admin/users).
 * Admin may create Admin or Customer accounts, but activation is enforced
 * server-side from the selected role.
 */
export const createAdminUserSchema = z.object({
  ...baseUserFields,
  role: z.enum([ROLE_NAMES.ADMIN, ROLE_NAMES.CUSTOMER]),
}).strict();

export type CreateAdminUserDto = z.infer<typeof createAdminUserSchema>;

/**
 * DTO for customer self-registration (POST /api/v1/customers/register).
 * Role and status are not accepted from the client; the service always
 * assigns role=Customer and isActive=false.
 */
export const registerCustomerSchema = z.object(baseUserFields).strict();
export type RegisterCustomerDto = z.infer<typeof registerCustomerSchema>;

export const customerLoginSchema = z
  .object({
    email: z.string().trim().email("Email must be a valid email address"),
    password: z.string().min(1, "Password is required"),
  })
  .strict();

export type CustomerLoginDto = z.infer<typeof customerLoginSchema>;

export interface UserResponseDto {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  mobileNumber: string;
  role: RoleName;
  isActive: boolean;
  deactivatedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthTokenResponseDto {
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: string;
}
