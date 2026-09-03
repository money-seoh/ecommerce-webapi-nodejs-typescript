import dotenv from "dotenv";

dotenv.config();

function requireEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function requirePositiveInt(name: string, fallback?: string): number {
  const raw = requireEnv(name, fallback);
  const trimmed = raw.trim();
  const value = parseInt(trimmed, 10);
  if (!Number.isInteger(value) || value <= 0 || String(value) !== trimmed) {
    throw new Error(
      `Environment variable ${name} must be a positive integer, got: "${raw}"`,
    );
  }
  return value;
}

export const env = {
  databaseUrl: requireEnv("DATABASE_URL"),
  port: requirePositiveInt("PORT", "3000"),
  bcryptSaltRounds: requirePositiveInt("BCRYPT_SALT_ROUNDS", "10"),
  jwtSecret: requireEnv("JWT_SECRET"),
  jwtExpiresIn: requireEnv("JWT_EXPIRES_IN", "1h"),
  nodeEnv: process.env.NODE_ENV ?? "production",
};
