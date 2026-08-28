import { Router } from "express";
import { userController } from "../config/container";

// Public self-registration endpoint: role is always forced to Customer and
// status to Active by the service layer, regardless of request payload.
const router: Router = Router();

router.post("/register", userController.registerCustomer);

export default router;
