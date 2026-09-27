import { NextFunction, Request, Response } from "express";
import { ROLE_NAMES } from "../dtos/user.dto";
import { UserService } from "../services/user.service";
import { ForbiddenError, UnauthorizedError } from "../utils/errors";
import { InvalidAccessTokenError, verifyAccessToken } from "../utils/token";

function extractBearerToken(authorizationHeader: string | undefined): string {
  const [scheme, token] = authorizationHeader?.trim().split(/\s+/, 2) ?? [];
  if (scheme !== "Bearer" || !token) {
    throw new UnauthorizedError("Authentication required");
  }

  return token;
}

function assertAdminAuth(req: Request): void {
  const token = extractBearerToken(req.header("authorization"));

  try {
    const claims = verifyAccessToken(token);
    if (claims.role !== ROLE_NAMES.ADMIN) {
      throw new ForbiddenError("Admin role is required");
    }
  } catch (error) {
    if (error instanceof ForbiddenError) {
      throw error;
    }
    if (error instanceof InvalidAccessTokenError) {
      throw new UnauthorizedError("Authentication required");
    }
    throw error;
  }
}

export function requireAdminAuth(req: Request, _res: Response, next: NextFunction): void {
  try {
    assertAdminAuth(req);
    next();
  } catch (error) {
    next(error);
  }
}

export function requireAdminAuthAfterBootstrap(userService: UserService) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const hasAdminUser = await userService.hasAnyAdminUsers();
      if (!hasAdminUser) {
        next();
        return;
      }

      assertAdminAuth(req);
      next();
    } catch (error) {
      next(error);
    }
  };
}
