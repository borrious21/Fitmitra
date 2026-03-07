// admin/routes/adminRoutes.js
import { Router } from "express";
import authMiddleware  from "../../middleware/authMiddleware.js";
import adminMiddleware from "../../middleware/adminMiddleware.js";
import DashboardController    from "../controllers/dashboardController.js";
import usersRoutes            from "./usersRoutes.js";
import mealsRoutes            from "./mealsRoutes.js";
import exercisesRoutes        from "./exercisesRoutes.js";
import plansRoutes            from "./plansRoutes.js";
import logsRoutes             from "./logsRoutes.js";
import analyticsRoutes        from "./analyticsRoutes.js";
import notificationsRoutes    from "./notificationsRoutes.js";

const router = Router();

router.use(authMiddleware, adminMiddleware);

router.get("/dashboard", DashboardController.getStats);

router.use("/users",          usersRoutes);
router.use("/meals",          mealsRoutes);
router.use("/exercises",      exercisesRoutes);
router.use("/plans",          plansRoutes);
router.use("/logs",           logsRoutes);       
router.use("/analytics",      analyticsRoutes);
router.use("/notifications",  notificationsRoutes);

export default router;