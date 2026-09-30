import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { UserService } from "../services/user.service";
import {
  createAdminUserSchema,
  customerLoginSchema,
  registerCustomerSchema,
  updateAdminUserSchema,
  userIdParamSchema,
  userStatusChangeSchema,
} from "../dtos/user.dto";
import { UnauthorizedError, ValidationError } from "../utils/errors";

function toValidationError(error: ZodError): ValidationError {
  const details = error.issues.map((issue) => ({ path: issue.path.filter((p): p is string | number => typeof p !== "symbol"), message: issue.message }));
  return new ValidationError("Validation failed", details);
}

export class UserController {
  constructor(private readonly userService: UserService) {}

  createUserByAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parseResult = createAdminUserSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw toValidationError(parseResult.error);
      }

      const user = await this.userService.createAdminUser(parseResult.data);
      res.status(201).json({ data: user });
    } catch (error) {
      next(error);
    }
  };

  registerCustomer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parseResult = registerCustomerSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw toValidationError(parseResult.error);
      }

      const user = await this.userService.registerCustomer(parseResult.data);
      res.status(201).json({ data: user });
    } catch (error) {
      next(error);
    }
  };

  loginCustomer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parseResult = customerLoginSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw toValidationError(parseResult.error);
      }

      const authResponse = await this.userService.loginCustomer(parseResult.data);
      res.status(200).json({ data: authResponse });
    } catch (error) {
      next(error);
    }
  };

  updateUserByAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const paramsResult = userIdParamSchema.safeParse(req.params);
      if (!paramsResult.success) {
        throw toValidationError(paramsResult.error);
      }

      const bodyResult = updateAdminUserSchema.safeParse(req.body);
      if (!bodyResult.success) {
        throw toValidationError(bodyResult.error);
      }

      const user = await this.userService.updateAdminUser(paramsResult.data.userId, bodyResult.data);
      res.status(200).json({ data: user });
    } catch (error) {
      next(error);
    }
  };

  getCurrentCustomer = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const actorUserId = Number(res.locals.authenticatedUserId);
      if (!Number.isInteger(actorUserId) || actorUserId <= 0) {
        throw new UnauthorizedError("Authentication required");
      }

      const user = await this.userService.getCurrentUser(actorUserId);
      res.status(200).json({ data: user });
    } catch (error) {
      next(error);
    }
  };

  activateUserByAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const bodyResult = userStatusChangeSchema.safeParse(req.body ?? {});
      if (!bodyResult.success) {
        throw toValidationError(bodyResult.error);
      }

      const parseResult = userIdParamSchema.safeParse(req.params);
      if (!parseResult.success) {
        throw toValidationError(parseResult.error);
      }

      const user = await this.userService.activateUser(parseResult.data.userId);
      res.status(200).json({ data: user });
    } catch (error) {
      next(error);
    }
  };

  deactivateUserByAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const bodyResult = userStatusChangeSchema.safeParse(req.body ?? {});
      if (!bodyResult.success) {
        throw toValidationError(bodyResult.error);
      }

      const parseResult = userIdParamSchema.safeParse(req.params);
      if (!parseResult.success) {
        throw toValidationError(parseResult.error);
      }

      const actorUserId = Number(res.locals.authenticatedUserId);
      if (!Number.isInteger(actorUserId) || actorUserId <= 0) {
        throw new UnauthorizedError("Authentication required");
      }

      const user = await this.userService.deactivateUser(actorUserId, parseResult.data.userId);
      res.status(200).json({ data: user });
    } catch (error) {
      next(error);
    }
  };
}
