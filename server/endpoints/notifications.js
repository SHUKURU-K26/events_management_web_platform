import express from "express"
import  pool  from "../config/db.js"
import { verifyToken, verifyRole } from "../authMiddleware.js"
const routes = express.Router()

// GET MY NOTIFICATIONS
// GET /api/notifications
routes.get("/", verifyToken, async (req, res) => {
    try {
        // Step 1 — get user_id from token
        // hint: const { user_id } = req.user
        const { user_id } = req.user
        // Step 2 — fetch all notifications for this user
        // hint: SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC
            const [rows] = await pool.execute(
                "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC",
                [user_id]
            )
        // Step 3 — return notifications
        res.status(200).json({ notifications: rows })        

    } catch (error) {
        console.error("Error fetching notifications:", error)
        res.status(500).json({ message: "Internal server error" })
    }
})

// MARK NOTIFICATION AS READ
// PUT /api/notifications/:id
routes.put("/:id", verifyToken, async (req, res) => {
    try {
        // Step 1 — get notification id from params
        const { id } = req.params
        // Step 2 — get user_id from token
        const { user_id } = req.user
        // Step 3 — update is_read to 1
        // hint: UPDATE notifications SET is_read = 1 WHERE n_id = ? AND user_id = ?
        // why user_id check? → so users can only mark THEIR OWN notifications as read!
        const [result] = await pool.execute(
            "UPDATE notifications SET is_read = 1 WHERE n_id = ? AND user_id = ?",
            [id, user_id]
        )

        // Step 4 — check if notification was found
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Notification not found" })
        }
        // Step 5 — return success response
        res.status(200).json({ message: "Notification marked as read" })

    } catch (error) {
        console.error("Error updating notification:", error)
        res.status(500).json({ message: "Internal server error" })
    }
})

export default routes