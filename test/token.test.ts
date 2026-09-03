import jwt from "jsonwebtoken";
import { createAccessToken } from "../src/utils/token";

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
});
