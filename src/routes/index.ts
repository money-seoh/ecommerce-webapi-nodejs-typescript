import { Router } from "express";
import adminUserRoutes from "./admin-user.routes";
import customerRoutes from "./customer.routes";

const router: Router = Router();

router.get("/health", (_req, res) => {
  res.status(200).json({ data: { status: "ok" } });
});

router.use("/admin/users", adminUserRoutes);
router.use("/customers", customerRoutes);

export default router;
