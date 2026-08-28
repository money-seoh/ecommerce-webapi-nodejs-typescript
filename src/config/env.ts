import dotenv from "dotenv";

dotenv.config();

function requireEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  databaseUrl: requireEnv("DATABASE_URL", ""),
  port: parseInt(requireEnv("PORT", "3000"), 10),
  bcryptSaltRounds: parseInt(requireEnv("BCRYPT_SALT_ROUNDS", "10"), 10),
  nodeEnv: process.env.NODE_ENV ?? "development",
};
