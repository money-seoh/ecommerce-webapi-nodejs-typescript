import { NextFunction, Request, Response } from "express";
import { ROLE_NAMES } from "../dtos/user.dto";
import { UserService } from "../services/user.service";
import { ForbiddenError, UnauthorizedError } from "../utils/errors";
import { InvalidAccessTokenError, verifyAccessToken } from "../utils/token";

function extractBearerToken(authorizationHeader: string | undefined): string {
  const bearerMatch = authorizationHeader?.trim().match(/^Bearer\s+(\S+)$/);
  if (!bearerMatch) {
    throw new UnauthorizedError("Authentication required");
  }

  return bearerMatch[1];
}

async function assertAdminAuth(userService: UserService, req: Request): Promise<void> {
  const token = extractBearerToken(req.header("authorization"));

  const claims = (() => {
    try {
      return verifyAccessToken(token);
    } catch (error) {
      if (error instanceof InvalidAccessTokenError) {
        throw new UnauthorizedError("Authentication required");
      }
      throw error;
    }
  })();

  if (claims.role !== ROLE_NAMES.ADMIN) {
    throw new ForbiddenError("Admin role is required");
  }

  const userId = Number(claims.sub);
  if (!Number.isInteger(userId) || userId <= 0) {
    throw new UnauthorizedError("Authentication required");
  }

  await userService.assertActiveAdminUser(userId);
}

export function requireAdminAuth(userService: UserService) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      await assertAdminAuth(userService, req);
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function requireAdminAuthAfterBootstrap(userService: UserService) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const hasAdminUser = await userService.hasAnyAdminUsers();
      if (!hasAdminUser) {
        next();
        return;
      }

      await assertAdminAuth(userService, req);
      next();
    } catch (error) {
      next(error);
    }
  };
}
