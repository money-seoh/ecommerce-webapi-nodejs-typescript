import { Router } from "express";
import rateLimit from "express-rate-limit";
import { userController, userService } from "../config/container";
import { requireAdminAuthAfterBootstrap } from "../middlewares/bootstrap-admin-auth.middleware";
import { TooManyRequestsError } from "../utils/errors";

const router: Router = Router();
const adminUserCreationRateLimit = rateLimit({
  windowMs: 60_000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(new TooManyRequestsError("Too many admin user creation attempts"));
  },
});

router.post(
  "/",
  adminUserCreationRateLimit,
  requireAdminAuthAfterBootstrap(userService),
  userController.createUserByAdmin,
);

export default router;
