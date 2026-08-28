/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  rootDir: ".",
  roots: ["<rootDir>/test"],
  testMatch: ["**/*.test.ts", "**/*.spec.ts"],
  collectCoverageFrom: ["src/**/*.ts"],
  clearMocks: true,
  setupFiles: ["<rootDir>/test/jest.setup.ts"],
};
