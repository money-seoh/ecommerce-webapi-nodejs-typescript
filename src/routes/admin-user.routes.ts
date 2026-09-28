import { Router } from "express";
import rateLimit from "express-rate-limit";
import { userController, userService } from "../config/container";
import { requireAdminAuth, requireAdminAuthAfterBootstrap } from "../middlewares/bootstrap-admin-auth.middleware";
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
const adminUserActivationRateLimit = rateLimit({
  windowMs: 60_000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(new TooManyRequestsError("Too many admin user activation attempts"));
  },
});
const adminUserDeactivationRateLimit = rateLimit({
  windowMs: 60_000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(new TooManyRequestsError("Too many admin user deactivation attempts"));
  },
});

router.post(
  "/",
  adminUserCreationRateLimit,
  requireAdminAuthAfterBootstrap(userService),
  userController.createUserByAdmin,
);

/**
 * @openapi
 * /api/v1/admin/users/{userId}/activate:
 *   patch:
 *     summary: Activate an inactive user account
 *     description: Requires an authenticated Admin bearer token after bootstrap; bypassed only when no Admin exists.
 *     tags:
 *       - Admin Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *     responses:
 *       200:
 *         description: User account activated successfully
 *       400:
 *         description: Invalid user id
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin role is required
 *       404:
 *         description: User not found
 *       409:
 *         description: User account is already active
 *       429:
 *         description: Too many activation attempts
 */
router.patch(
  "/:userId/activate",
  adminUserActivationRateLimit,
  requireAdminAuthAfterBootstrap(userService),
  userController.activateUserByAdmin,
);

/**
 * @openapi
 * /api/v1/admin/users/{userId}/deactivate:
 *   patch:
 *     summary: Deactivate an active user account
 *     description: Requires an authenticated Admin bearer token and cannot be used to deactivate the calling Admin or the last active Admin.
 *     tags:
 *       - Admin Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *     responses:
 *       200:
 *         description: User account deactivated successfully
 *       400:
 *         description: Invalid user id
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin role is required or caller attempted self-deactivation
 *       404:
 *         description: User not found
 *       409:
 *         description: User account is already inactive or deactivation would remove the last active Admin
 *       429:
 *         description: Too many deactivation attempts
 */
router.patch(
  "/:userId/deactivate",
  adminUserDeactivationRateLimit,
  requireAdminAuth(userService),
  userController.deactivateUserByAdmin,
);

export default router;
