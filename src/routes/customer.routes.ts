import { Router } from "express";
import rateLimit from "express-rate-limit";
import { userController, userService } from "../config/container";
import { ROLE_NAMES } from "../dtos/user.dto";
import { requireAuthenticatedUser, requireRoles } from "../middlewares/auth.middleware";
import { TooManyRequestsError } from "../utils/errors";

// Public self-registration endpoint: role is always forced to Customer and
// status to Inactive by the service layer, regardless of request payload.
const router: Router = Router();
const customerLoginRateLimit = rateLimit({
  windowMs: 60_000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(new TooManyRequestsError("Too many customer login attempts"));
  },
});
const customerProfileRateLimit = rateLimit({
  windowMs: 60_000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(new TooManyRequestsError("Too many customer profile requests"));
  },
});
const customerChangePasswordRateLimit = rateLimit({
  windowMs: 60_000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(new TooManyRequestsError("Too many password change attempts"));
  },
});
const customerRegistrationRateLimit = rateLimit({
  windowMs: 60_000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(new TooManyRequestsError("Too many customer registration attempts"));
  },
});

/**
 * @openapi
 * /api/v1/customers/login:
 *   post:
 *     summary: Authenticate a customer account
 *     tags:
 *       - Customers
 *     requestBody:
 *       required: true
 *     responses:
 *       200:
 *         description: Customer authenticated successfully
 *       400:
 *         description: Invalid login payload
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Inactive or unauthorized account
 *       429:
 *         description: Too many login attempts
 */
router.post("/login", customerLoginRateLimit, userController.loginCustomer);

/**
 * @openapi
 * /api/v1/customers/me:
 *   get:
 *     summary: Get the authenticated customer profile
 *     tags:
 *       - Customers
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Customer profile retrieved successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Customer role is required
 *       429:
 *         description: Too many customer profile requests
 */
router.get(
  "/me",
  customerProfileRateLimit,
  requireAuthenticatedUser(userService),
  requireRoles([ROLE_NAMES.CUSTOMER]),
  userController.getCurrentCustomer,
);

/**
 * @openapi
 * /api/v1/customers/profile:
 *   put:
 *     summary: Update the authenticated customer profile
 *     tags:
 *       - Customers
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Customer profile updated successfully
 *       400:
 *         description: Invalid profile payload
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Customer role is required
 *       404:
 *         description: User not found
 */
router.put(
  "/profile",
  customerProfileRateLimit,
  requireAuthenticatedUser(userService),
  requireRoles([ROLE_NAMES.CUSTOMER]),
  userController.updateCustomerProfile,
);

/**
 * @openapi
 * /api/v1/customers/change-password:
 *   post:
 *     summary: Change the authenticated customer's password
 *     tags:
 *       - Customers
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Invalid password or password reuse
 *       401:
 *         description: Authentication required or current password is incorrect
 *       403:
 *         description: Customer role is required
 *       429:
 *         description: Too many password change attempts
 */
router.post(
  "/change-password",
  requireAuthenticatedUser(userService),
  requireRoles([ROLE_NAMES.CUSTOMER]),
  customerChangePasswordRateLimit,
  userController.changeCustomerPassword,
);

/**
 * @openapi
 * /api/v1/customers/register:
 *   post:
 *     summary: Register a customer account
 *     tags:
 *       - Customers
 *     requestBody:
 *       required: true
 *     responses:
 *       201:
 *         description: Customer registered successfully
 *       400:
 *         description: Invalid registration payload
 *       409:
 *         description: Email already exists
 *       429:
 *         description: Too many registration attempts
 */
router.post("/register", customerRegistrationRateLimit, userController.registerCustomer);

export default router;
