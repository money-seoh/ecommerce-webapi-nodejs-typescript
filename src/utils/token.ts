import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";
import { env } from "../config/env";
import { ROLE_NAMES, RoleName } from "../dtos/user.dto";

export interface AccessTokenClaims {
  role: RoleName;
}

export interface AuthenticatedAccessTokenClaims extends AccessTokenClaims, JwtPayload {
  sub: string;
}

export function createAccessToken(userId: number, role: RoleName): string {
  const payload: AccessTokenClaims = { role };

  return jwt.sign(payload, env.jwtSecret, {
    algorithm: "HS256",
    subject: String(userId),
    expiresIn: env.jwtExpiresIn as SignOptions["expiresIn"],
  });
}

export function verifyAccessToken(token: string): AuthenticatedAccessTokenClaims {
  const decoded = jwt.verify(token, env.jwtSecret, {
    algorithms: ["HS256"],
  });

  if (
    typeof decoded === "string"
    || typeof decoded.sub !== "string"
    || !isRoleName(decoded.role)
  ) {
    throw new Error("Invalid token claims");
  }

  return decoded as AuthenticatedAccessTokenClaims;
}

function isRoleName(role: unknown): role is RoleName {
  return role === ROLE_NAMES.ADMIN || role === ROLE_NAMES.CUSTOMER;
}
