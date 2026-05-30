import express from "express"
import pool from "../config/db.js"
import { verifyToken, verifyRole } from "../authMiddleware.js"

const router = express.Router()

// GET DASHBOARD STATS
// GET /api/dashboard
router.get("/", verifyToken, async (req, res) => {
    try {
        const role = req.user.role
        const user_id = req.user.user_id

        if (role === "staff") {
            // Staff only sees their own stats
            const [[{ total_tasks }]] = await pool.execute(
                `SELECT COUNT(*) as total_tasks FROM task_assignments WHERE user_id = ?`, [user_id]
            )
            const [[{ pending_tasks }]] = await pool.execute(
                `SELECT COUNT(*) as pending_tasks FROM tasks t
                 JOIN task_assignments ta ON t.task_id = ta.task_id
                 WHERE ta.user_id = ? AND t.track_progress = 'pending'`, [user_id]
            )
            const [[{ total_events }]] = await pool.execute(
                `SELECT COUNT(*) as total_events FROM event_assignments WHERE user_id = ?`, [user_id]
            )
            const [[{ unread_notifications }]] = await pool.execute(
                `SELECT COUNT(*) as unread_notifications FROM notifications WHERE user_id = ? AND is_read = 0`, [user_id]
            )
            return res.status(200).json({
                total_tasks,
                pending_tasks,
                total_events,
                unread_notifications,
                total_revenue: null,
                total_expenses: null
            })
        }

        // Manager/Superadmin sees everything
        const [[{ total_events }]] = await pool.execute("SELECT COUNT(*) as total_events FROM events")
        const [[{ upcoming_events }]] = await pool.execute("SELECT COUNT(*) as upcoming_events FROM events WHERE status = 'pending'")
        const [[{ total_tasks }]] = await pool.execute("SELECT COUNT(*) as total_tasks FROM tasks")
        const [[{ pending_tasks }]] = await pool.execute("SELECT COUNT(*) as pending_tasks FROM tasks WHERE track_progress = 'pending'")
        const [[{ total_resources }]] = await pool.execute("SELECT COUNT(*) as total_resources FROM resources")
        const [[{ available_resources }]] = await pool.execute("SELECT COUNT(*) as available_resources FROM resources WHERE resource_status = 'available'")
        const [[{ total_revenue }]] = await pool.execute("SELECT SUM(transaction_amount) as total_revenue FROM transactions WHERE transaction_category = 'revenue'")
        const [[{ total_expenses }]] = await pool.execute("SELECT SUM(transaction_amount) as total_expenses FROM transactions WHERE transaction_category = 'expense'")

        res.status(200).json({
            total_events,
            upcoming_events,
            total_tasks,
            pending_tasks,
            total_resources,
            available_resources,
            total_revenue: total_revenue || 0,
            total_expenses: total_expenses || 0
        })

    } catch (error) {
        console.error("Error fetching dashboard stats:", error)
        res.status(500).json({ message: "Internal server error" })
    }
})
export default router