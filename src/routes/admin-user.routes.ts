import { Router } from "express";
import { userController, userService } from "../config/container";
import { requireAdminAuthAfterBootstrap } from "../middlewares/bootstrap-admin-auth.middleware";

const router: Router = Router();

router.post("/", requireAdminAuthAfterBootstrap(userService), userController.createUserByAdmin);

export default router;
