import { Router } from "express";
import rateLimit from "express-rate-limit";
import { userController } from "../config/container";
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

router.post("/register", userController.registerCustomer);

export default router;
