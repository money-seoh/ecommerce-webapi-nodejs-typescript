import jwt, { SignOptions } from "jsonwebtoken";
import { env } from "../config/env";
import { RoleName } from "../dtos/user.dto";

export interface AccessTokenClaims {
  role: RoleName;
}

export function createAccessToken(userId: number, role: RoleName): string {
  const payload: AccessTokenClaims = { role };

  return jwt.sign(payload, env.jwtSecret, {
    algorithm: "HS256",
    subject: String(userId),
    expiresIn: env.jwtExpiresIn as SignOptions["expiresIn"],
  });
}
