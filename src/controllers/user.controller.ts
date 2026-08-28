import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { UserService } from "../services/user.service";
import { createAdminUserSchema, registerCustomerSchema } from "../dtos/user.dto";
import { ValidationError } from "../utils/errors";

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
}
