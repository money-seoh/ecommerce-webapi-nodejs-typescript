import { hashPassword, comparePassword } from "../src/utils/password";

describe("password utilities", () => {
  describe("hashPassword", () => {
    it("should return a non-empty string different from the plain-text input", async () => {
      const plainText = "Password1";
      const hash = await hashPassword(plainText);
      expect(typeof hash).toBe("string");
      expect(hash.length).toBeGreaterThan(0);
      expect(hash).not.toBe(plainText);
    });

    it("should produce different hashes for the same input (salted)", async () => {
      const hash1 = await hashPassword("Password1");
      const hash2 = await hashPassword("Password1");
      expect(hash1).not.toBe(hash2);
    });
  });

  describe("comparePassword", () => {
    it("should return true when the plain-text matches the hash", async () => {
      const plainText = "Password1";
      const hash = await hashPassword(plainText);
      const result = await comparePassword(plainText, hash);
      expect(result).toBe(true);
    });

    it("should return false when the plain-text does not match the hash", async () => {
      const hash = await hashPassword("Password1");
      const result = await comparePassword("WrongPassword1", hash);
      expect(result).toBe(false);
    });
  });
});
