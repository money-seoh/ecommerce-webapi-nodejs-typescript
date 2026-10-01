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
const adminUserUpdateRateLimit = rateLimit({
  windowMs: 60_000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(new TooManyRequestsError("Too many admin user update attempts"));
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

/**
 * @openapi
 * /api/v1/admin/users:
 *   get:
 *     summary: Search and list users
 *     tags:
 *       - Admin Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [Admin, Customer]
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Paginated user list
 *       400:
 *         description: Invalid query parameters
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin role is required
 */
router.get(
  "/",
  requireAdminAuth(userService),
  userController.listUsersByAdmin,
);

router.post(
  "/",
  adminUserCreationRateLimit,
  requireAdminAuthAfterBootstrap(userService),
  userController.createUserByAdmin,
);

/**
 * @openapi
 * /api/v1/admin/users/{userId}:
 *   get:
 *     summary: Get user details
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
 *         description: User details
 *       400:
 *         description: Invalid user id
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin role is required
 *       404:
 *         description: User not found
 */
router.get(
  "/:userId",
  requireAdminAuth(userService),
  userController.getUserByAdmin,
);

/**
 * @openapi
 * /api/v1/admin/users/{userId}:
 *   put:
 *     summary: Update a user account
 *     description: Requires an authenticated Admin bearer token. Account activation is managed by the dedicated status endpoints.
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: false
 *             required: [firstName, lastName, mobileNumber]
 *             properties:
 *               firstName:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 1000
 *               lastName:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 1000
 *               mobileNumber:
 *                 type: string
 *                 pattern: '^\\+[1-9]\\d{1,14}$'
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 maxLength: 24
 *     responses:
 *       200:
 *         description: User account updated successfully
 *       400:
 *         description: Invalid user id or user information
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin role is required
 *       404:
 *         description: User not found
 *       429:
 *         description: Too many user update attempts
 */
router.put(
  "/:userId",
  adminUserUpdateRateLimit,
  requireAdminAuth(userService),
  userController.updateUserByAdmin,
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
