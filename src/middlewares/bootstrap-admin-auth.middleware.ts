import { NextFunction, Request, Response } from "express";
import { ROLE_NAMES } from "../dtos/user.dto";
import { UserService } from "../services/user.service";
import { ForbiddenError, UnauthorizedError } from "../utils/errors";

function hasAuthenticatedContext(authorizationHeader: string | undefined): boolean {
  return Boolean(authorizationHeader?.trim());
}

export function requireAdminAuthAfterBootstrap(userService: UserService) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const hasAdminUser = await userService.hasAnyAdminUsers();
      if (!hasAdminUser) {
        next();
        return;
      }

      if (!hasAuthenticatedContext(req.header("authorization"))) {
        throw new UnauthorizedError("Authentication required");
      }

      const callerRole = req.header("x-user-role");
      if (callerRole !== ROLE_NAMES.ADMIN) {
        throw new ForbiddenError("Admin role is required");
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
