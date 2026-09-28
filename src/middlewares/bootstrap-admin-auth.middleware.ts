import { NextFunction, Request, Response } from "express";
import { ROLE_NAMES } from "../dtos/user.dto";
import { UserService } from "../services/user.service";
import { requireAuthenticatedUser, requireRoles } from "./auth.middleware";

export function requireAdminAuth(userService: UserService) {
  const authenticateUser = requireAuthenticatedUser(userService);
  const requireAdminRole = requireRoles([ROLE_NAMES.ADMIN]);

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    authenticateUser(req, res, (authenticationError?: unknown) => {
      if (authenticationError) {
        next(authenticationError);
        return;
      }

      requireAdminRole(req, res, next);
    });
  };
}

export function requireAdminAuthAfterBootstrap(userService: UserService) {
  const requireAdmin = requireAdminAuth(userService);

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const hasAdminUser = await userService.hasAnyAdminUsers();
      if (!hasAdminUser) {
        next();
        return;
      }

      requireAdmin(req, res, next);
    } catch (error) {
      next(error);
    }
  };
}
