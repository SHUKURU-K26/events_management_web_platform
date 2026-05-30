import express from "express"
import  pool  from "../config/db.js"
import { verifyToken, verifyRole } from "../authMiddleware.js"
const routes=express.Router()

// CREATE TASK
// POST /api/tasks
routes.post("/", verifyToken, verifyRole("manager", "superadmin"), async (req, res) => {
    try {
        // Step 1 — extract task data from req.body
        const { task_name, task_deadline, track_progress, event_id } = req.body
        const user_id = req.user.user_id  // get user_id from token
        // Step 2 — insert into tasks table
        const [result] = await pool.execute(
            "INSERT INTO tasks (task_name, task_deadline, track_progress, event_id) VALUES (?, ?, ?, ?)",
            [task_name, task_deadline, "pending", event_id || null]  // default to "pending" if not provided
        )
        const newTaskId = result.insertId
        res.status(201).json({ message: "Task created successfully", taskId: newTaskId })
    } catch (error) {
        console.error("Error creating task:", error)
        res.status(500).json({ message: "Internal server error" })
    }
})

//Get All tasks based on role
// GET /api/tasks
routes.get("/", verifyToken, async (req, res) => {  // ← no verifyRole here!
    try {
        const { role, user_id } = req.user
        let rows

        if (role === "staff") {
            // get only tasks assigned to this staff
                const [result] = await pool.execute(
                    `SELECT t.* FROM tasks t
                        JOIN task_assignments ta ON t.task_id = ta.task_id
                        WHERE ta.user_id = ?`,
                    [user_id]
                )
                rows = result             
        } else {
            // get all tasks
            const [result] = await pool.execute("SELECT * FROM tasks")
            rows = result        

        }
        res.status(200).json({ tasks: rows })
    } catch (error) {
        console.error("Error fetching tasks:", error)
        res.status(500).json({ message: "Internal server error" })
    }
})


//GET    /api/tasks/:id  → get single task
routes.get("/:id", verifyToken, async (req, res) => {
    try {
        const { id } = req.params
        const [rows] = await pool.execute("SELECT * FROM tasks WHERE task_id = ?", [id])
        const task = rows[0]
        if (!task) {
            return res.status(404).json({ message: "Task not found" })
        }
        res.status(200).json({ task })
    } catch (error) {
        console.error("Error fetching task:", error)
        res.status(500).json({ message: "Internal server error" })
    }
})
//UPDATE Routes set / PUT /api/tasks/:id 

routes.put("/:id", verifyToken, async (req, res) => {
    try {
        const { role } = req.user
        const { id } = req.params

        if (role === "staff") {
            const { track_progress } = req.body
            const [result] = await pool.execute(
                "UPDATE tasks SET track_progress = ? WHERE task_id = ?",
                [track_progress, id]
            )
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Task not found" })
            }
            res.status(200).json({ message: "Task progress updated successfully" })

        } else {
            const { task_name, task_deadline, track_progress } = req.body
            const [result] = await pool.execute(
                "UPDATE tasks SET task_name = ?, task_deadline = ?, track_progress = ? WHERE task_id = ?",
                [task_name, task_deadline, track_progress, id]
            )
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Task not found" })
            }
            res.status(200).json({ message: "Task updated successfully" })
        }

    } catch (error) {
        console.error("Error updating task:", error)
        res.status(500).json({ message: "Internal server error" })
    }
})

//DELETE /api/tasks/:id
routes.delete("/:id", verifyToken, verifyRole("manager", "superadmin"), async (req, res) => {
    try {
        const { id } = req.params
        const [result] = await pool.execute("DELETE FROM tasks WHERE task_id = ?", [id])
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Task not found" })
        }
        res.status(200).json({ message: "Task deleted successfully" })
    } catch (error) {
        console.error("Error deleting task:", error)
        res.status(500).json({ message: "Internal server error" })
    }
})

// ASSIGN STAFF TO TASK
// POST /api/tasks/:id/assign
routes.post("/:id/assign", verifyToken, verifyRole("manager", "superadmin"), async (req, res) => {
    try {
        // Step 1 — get Task_id from params
        const { id } = req.params
        // Step 2 — get user_id from req.body (staff to assign)
        const { user_id } = req.body
        // Step 3 — check if Task exists
        const [taskRows] = await pool.execute("SELECT * FROM tasks WHERE task_id = ?", [id])
        if (taskRows.length === 0) {
            return res.status(404).json({ message: "Task not found" })
        }
        // Step 4 — check if staff is already assigned to this Task
        const [assignmentRows] = await pool.execute(
            "SELECT * FROM task_assignments WHERE task_id = ? AND user_id = ?", 
            [id, user_id]
        )
        if (assignmentRows.length > 0) {
            return res.status(400).json({ message: "Staff is already assigned to this Task" })
        }
        // Step 5 — insert into task_assignments table
        await pool.execute(
            "INSERT INTO task_assignments (task_id, user_id) VALUES (?, ?)",
            [id, user_id]
        )

        // Step 6 — AUTO CREATE NOTIFICATION ← new!
        const task_name = taskRows[0].task_name  // ← already fetched in step 3!
        await pool.execute(
            "INSERT INTO notifications (user_id, message, is_read) VALUES (?, ?, ?)",
            [user_id, `You have been assigned a new task: ${task_name}`, 0]
        )

        // Step 7 — return success response
        res.status(200).json({ message: "Staff assigned to task successfully" })

    } catch (error) {
        console.error("Error assigning staff to task:", error)
        res.status(500).json({ message: "Internal server error" })
    }
})
export default routes