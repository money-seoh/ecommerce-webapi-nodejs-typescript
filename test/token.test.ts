import jwt from "jsonwebtoken";
import { createAccessToken, InvalidAccessTokenError, verifyAccessToken } from "../src/utils/token";

describe("token utilities", () => {
  describe("createAccessToken", () => {
    it("should sign a JWT with the customer role and subject claim", () => {
      const token = createAccessToken(42, "Customer");
      const decoded = jwt.verify(token, process.env.JWT_SECRET ?? "test-jwt-secret") as jwt.JwtPayload;

      expect(typeof token).toBe("string");
      expect(decoded.sub).toBe("42");
      expect(decoded.role).toBe("Customer");
      expect(decoded.exp).toBeDefined();
    });
  });

  describe("verifyAccessToken", () => {
    it("should verify a JWT and return its subject and role claims", () => {
      const token = createAccessToken(7, "Admin");

      expect(verifyAccessToken(token)).toMatchObject({
        sub: "7",
        role: "Admin",
      });
    });

    it("should throw InvalidAccessTokenError when the token is malformed", () => {
      expect(() => verifyAccessToken("not-a-jwt")).toThrow(InvalidAccessTokenError);
    });

    it("should throw InvalidAccessTokenError when the token claims are invalid", () => {
      const token = jwt.sign({ role: "Guest" }, process.env.JWT_SECRET ?? "test-jwt-secret", {
        algorithm: "HS256",
        subject: "9",
        expiresIn: "1h",
      });

      expect(() => verifyAccessToken(token)).toThrow(InvalidAccessTokenError);
    });
  });
});
