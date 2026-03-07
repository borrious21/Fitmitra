// server/controllers/Admin/adminUsersController.js
const bcrypt         = require("bcryptjs");
const userService    = require("../services/adminUserService");

exports.getAllUsers = async (req, res) => {
  try {
    const { search, role, is_active, page, limit } = req.query;
    const result = await userService.getAllUsers({ search, role, is_active, page, limit });
    res.json(result);
  } catch (err) {
    console.error("getAllUsers:", err);
    res.status(500).json({ message: "Failed to fetch users." });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found." });
    res.json(user);
  } catch (err) {
    console.error("getUserById:", err);
    res.status(500).json({ message: "Failed to fetch user." });
  }
};

exports.banUser = async (req, res) => {
  try {
    const user = await userService.banUser(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found." });
    await userService.writeAdminLog(req.user.id, req.params.id, "ban_user", {}, req.ip);
    res.json({ message: `User "${user.name}" has been banned.`, user });
  } catch (err) {
    console.error("banUser:", err);
    res.status(500).json({ message: "Failed to ban user." });
  }
};

exports.activateUser = async (req, res) => {
  try {
    const user = await userService.activateUser(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found." });
    await userService.writeAdminLog(req.user.id, req.params.id, "activate_user", {}, req.ip);
    res.json({ message: `User "${user.name}" has been activated.`, user });
  } catch (err) {
    console.error("activateUser:", err);
    res.status(500).json({ message: "Failed to activate user." });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const existing = await userService.getUserById(req.params.id);
    if (!existing) return res.status(404).json({ message: "User not found." });

    if (+req.params.id === req.user.id) {
      return res.status(400).json({ message: "Cannot delete your own account." });
    }

    await userService.writeAdminLog(
      req.user.id, req.params.id, "delete_user",
      { deleted_name: existing.name, deleted_email: existing.email }, req.ip
    );
    await userService.deleteUser(req.params.id);
    res.json({ message: `User "${existing.name}" deleted.` });
  } catch (err) {
    console.error("deleteUser:", err);
    res.status(500).json({ message: "Failed to delete user." });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { new_password } = req.body;
    if (!new_password || new_password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters." });
    }

    const hash = await bcrypt.hash(new_password, 10);
    await userService.resetUserPassword(req.params.id, hash);
    await userService.writeAdminLog(req.user.id, req.params.id, "reset_password", {}, req.ip);
    res.json({ message: "Password has been reset." });
  } catch (err) {
    console.error("resetPassword:", err);
    res.status(500).json({ message: "Failed to reset password." });
  }
};

exports.sendNotification = async (req, res) => {
  try {
    const { user_id, title, message, notification_type = "admin_message", scheduled_for } = req.body;

    if (!title || !message) {
      return res.status(400).json({ message: "Title and message are required." });
    }

    const pool = require("../db");

    if (user_id) {
      await pool.query(
        `INSERT INTO notifications (user_id, notification_type, title, message, scheduled_for)
         VALUES ($1, $2, $3, $4, $5)`,
        [user_id, notification_type, title, message, scheduled_for || null]
      );
      await userService.writeAdminLog(req.user.id, user_id, "send_notification", { title }, req.ip);
      res.json({ message: "Notification sent to user." });
    } else {
      const result = await pool.query(
        `INSERT INTO notifications (user_id, notification_type, title, message, scheduled_for)
         SELECT id, $1, $2, $3, $4
         FROM   users
         WHERE  is_active = TRUE`,
        [notification_type, title, message, scheduled_for || null]
      );
      await userService.writeAdminLog(req.user.id, null, "broadcast_notification", { title, count: result.rowCount }, req.ip);
      res.json({ message: `Broadcast sent to ${result.rowCount} users.` });
    }
  } catch (err) {
    console.error("sendNotification:", err);
    res.status(500).json({ message: "Failed to send notification." });
  }
};