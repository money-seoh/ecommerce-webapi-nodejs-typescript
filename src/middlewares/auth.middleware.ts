import { NextFunction, Request, RequestHandler, Response } from "express";
import { RoleName } from "../dtos/user.dto";
import { UserService } from "../services/user.service";
import { ForbiddenError, UnauthorizedError } from "../utils/errors";
import { InvalidAccessTokenError, verifyAccessToken } from "../utils/token";

export interface AuthenticatedUserContext {
  userId: number;
  role: RoleName;
}

function extractBearerToken(authorizationHeader: string | undefined): string {
  const bearerMatch = authorizationHeader?.trim().match(/^Bearer\s+(\S+)$/);
  if (!bearerMatch) {
    throw new UnauthorizedError("Authentication required");
  }

  return bearerMatch[1];
}

function getRoleRequirementMessage(allowedRoles: readonly RoleName[]): string {
  if (allowedRoles.length === 1) {
    return `${allowedRoles[0]} role is required`;
  }

  return `One of the following roles is required: ${allowedRoles.join(", ")}`;
}

async function authenticateRequest(
  userService: UserService,
  req: Request,
): Promise<AuthenticatedUserContext> {
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

  const userId = Number(claims.sub);
  if (!Number.isInteger(userId) || userId <= 0) {
    throw new UnauthorizedError("Authentication required");
  }

  await userService.assertActiveUserWithRole(userId, claims.role);

  return {
    userId,
    role: claims.role,
  };
}

export function requireAuthenticatedUser(userService: UserService): RequestHandler {
  return async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authenticatedUser = await authenticateRequest(userService, _req);
      res.locals.authenticatedUser = authenticatedUser;
      res.locals.authenticatedUserId = authenticatedUser.userId;
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function requireRoles(allowedRoles: readonly RoleName[]): RequestHandler {
  return (_req: Request, res: Response, next: NextFunction): void => {
    try {
      const authenticatedUser = res.locals.authenticatedUser as AuthenticatedUserContext | undefined;
      if (!authenticatedUser) {
        throw new UnauthorizedError("Authentication required");
      }

      if (!allowedRoles.includes(authenticatedUser.role)) {
        throw new ForbiddenError(getRoleRequirementMessage(allowedRoles));
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
