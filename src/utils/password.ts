import bcrypt from "bcrypt";
import { env } from "../config/env";

/**
 * Hashes a plain-text password using bcrypt. Plain-text passwords must never
 * be persisted; only the resulting hash is stored.
 */
export async function hashPassword(plainTextPassword: string): Promise<string> {
  return bcrypt.hash(plainTextPassword, env.bcryptSaltRounds);
}

/**
 * Compares a plain-text password against a stored bcrypt hash.
 */
export async function comparePassword(
  plainTextPassword: string,
  passwordHash: string,
): Promise<boolean> {
  return bcrypt.compare(plainTextPassword, passwordHash);
}
