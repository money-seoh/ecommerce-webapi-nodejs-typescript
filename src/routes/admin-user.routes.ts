import { Router, Request, Response, NextFunction } from "express";
import { userController } from "../config/container";
import { env } from "../config/env";

// NOTE: This endpoint is not yet protected by authentication/authorization
// middleware, since the Auth module (JWT validation + role-based
// authorization, see EPIC #1) has not been implemented yet. Admin-only
// access must be enforced once AUTH-US-004/AUTH-US-005 land.
const router: Router = Router();

const SAFE_ENVIRONMENTS = new Set(["development", "test"]);

if (!SAFE_ENVIRONMENTS.has(env.nodeEnv)) {
  router.post("/", (_req: Request, res: Response, _next: NextFunction) => {
    res.status(403).json({
      error: {
        code: "FORBIDDEN",
        message: "Admin user creation is not available in this environment",
      },
    });
  });
} else {
  router.post("/", userController.createUserByAdmin);
}

export default router;
