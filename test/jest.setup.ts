// Ensures required environment variables have safe defaults during test runs,
// since the app's env loader (src/config/env.ts) throws if DATABASE_URL is
// missing. Tests never hit a real database; PrismaClient is always mocked or
// unused via jest.spyOn on the service layer.
process.env.DATABASE_URL =
  process.env.DATABASE_URL ?? "sqlserver://localhost:1433;database=test;trustServerCertificate=true";
process.env.PORT = process.env.PORT ?? "3000";
process.env.BCRYPT_SALT_ROUNDS = process.env.BCRYPT_SALT_ROUNDS ?? "4";
