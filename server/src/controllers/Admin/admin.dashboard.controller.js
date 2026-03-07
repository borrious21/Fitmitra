// Controllers/Admin/admin.dashboard.controller.js
import { getPlatformOverview } from "../../services/Admin/analytic.service.js";
import pool from "../../db/pool.js";
import response from "../../utils/response.util.js";

class DashboardController {
  static async getStats(req, res, next) {
    try {
      const overview = await getPlatformOverview();

      const { rows: goalDist } = await pool.query(
        `SELECT goal, COUNT(*) AS count
         FROM profiles
         GROUP BY goal ORDER BY count DESC`
      );

      const { rows: dailySignups } = await pool.query(
        `SELECT DATE_TRUNC('day', created_at) AS day, COUNT(*) AS count
         FROM users
         WHERE created_at >= NOW() - INTERVAL '14 days'
         GROUP BY day ORDER BY day ASC`
      );

      const { rows: recentUsers } = await pool.query(
        `SELECT id, name, email, role, is_verified, created_at
         FROM users
         ORDER BY created_at DESC LIMIT 5`
      );

      return response(res, 200, true, "Dashboard stats retrieved", {
        overview,
        goal_distribution:  goalDist,
        daily_signups:      dailySignups,
        recent_users:       recentUsers,
      });
    } catch (err) {
      next(err);
    }
  }
}

export default DashboardController;