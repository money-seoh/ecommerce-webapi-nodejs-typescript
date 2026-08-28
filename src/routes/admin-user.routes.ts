import { Router } from "express";
import { userController } from "../config/container";

// NOTE: This endpoint is not yet protected by authentication/authorization
// middleware, since the Auth module (JWT validation + role-based
// authorization, see EPIC #1) has not been implemented yet. Admin-only
// access must be enforced once AUTH-US-004/AUTH-US-005 land.
const router: Router = Router();

router.post("/", userController.createUserByAdmin);

export default router;
