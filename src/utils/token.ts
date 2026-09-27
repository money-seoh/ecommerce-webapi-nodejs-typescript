import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";
import { env } from "../config/env";
import { ROLE_NAMES, RoleName } from "../dtos/user.dto";

export interface AccessTokenClaims {
  role: RoleName;
}

export interface AuthenticatedAccessTokenClaims extends AccessTokenClaims, JwtPayload {
  sub: string;
}

export class InvalidAccessTokenError extends Error {
  constructor(message = "Invalid access token") {
    super(message);
    this.name = "InvalidAccessTokenError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
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
  try {
    const decoded = jwt.verify(token, env.jwtSecret, {
      algorithms: ["HS256"],
    });

    if (
      typeof decoded === "string"
      || typeof decoded.sub !== "string"
      || !isRoleName(decoded.role)
    ) {
      throw new InvalidAccessTokenError("Invalid token claims");
    }

    return decoded as AuthenticatedAccessTokenClaims;
  } catch (error) {
    if (error instanceof InvalidAccessTokenError || error instanceof jwt.JsonWebTokenError) {
      throw new InvalidAccessTokenError();
    }

    throw error;
  }
}

function isRoleName(role: unknown): role is RoleName {
  return role === ROLE_NAMES.ADMIN || role === ROLE_NAMES.CUSTOMER;
}
