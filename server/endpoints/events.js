import express from "express"
import pool from "../config/db.js"
import { verifyToken, verifyRole } from "../authMiddleware.js"

const router = express.Router()

// POST /api/events

// CREATE EVENT
router.post("/", verifyToken, verifyRole("manager", "superadmin"), async (req, res) => {
    try {
        // Step 1 — extract event data from req.body
        // hint: event_name, event_start_date, event_end_date, event_budget
        const { event_name, event_start_date, event_end_date, event_budget } = req.body

        // Declare variable to — determine event status based on start date
        const today = new Date().toISOString().split("T")[0]
        const status = event_start_date === today ? "inprogress" : "pending"
            
        // Step 2 — insert into events table
        const [result] = await pool.execute(
            "INSERT INTO events (event_name, event_start_date, event_end_date, event_budget, status) VALUES (?, ?, ?, ?, ?)",
            [event_name, event_start_date, event_end_date, event_budget, status]
        )
        const newEventId = result.insertId

        // Step 3 — return success response
        res.status(201).json({ message: "Event created successfully", eventId: newEventId })

    } catch (error) {
        console.error("Error creating event:", error)
        res.status(500).json({ message: "Internal server error" })
    }
})

// GET ALL EVENTS
router.get("/", verifyToken, async (req, res) => {
    try {
        const {role, user_id} = req.user        
        let rows

        if (role === "staff") {            
            const [result] = await pool.execute(
                `SELECT e.* FROM events e 
                 JOIN event_assignments ea ON e.event_id = ea.event_id 
                 WHERE ea.user_id = ?`,
                [user_id]
            )
            rows = result

        } else {
            const [result] = await pool.execute("SELECT * FROM events")
            rows = result
        }

        res.status(200).json({ events: rows })

    } catch (error) {
        console.error("Error fetching events:", error)
        res.status(500).json({ message: "Internal server error" })
    }
})

//GET EVENT BY ID
// GET /api/events/:id
router.get("/:id", verifyToken, async (req, res) => {
    try {
        const { id } = req.params
        const [result] = await pool.execute("SELECT * FROM events WHERE event_id = ?", [id])
        if (result.length === 0) {
            return res.status(404).json({ message: "Event not found" })
        }
        res.status(200).json({ event: result[0] })
    } catch (error) {
        console.error("Error fetching event:", error)
        res.status(500).json({ message: "Internal server error" })
    }
})

// GET ASSIGNMENTS FOR AN EVENT
// GET /api/events/:id/assignments
router.get("/:id/assignments", verifyToken, verifyRole("manager", "superadmin"), async (req, res) => {
    try {
        const { id } = req.params
        const [rows] = await pool.execute(
            `SELECT u.user_id, u.firstname, u.lastname, u.username, u.role, 
             ea.assigned_at 
             FROM event_assignments ea
             JOIN users u ON ea.user_id = u.user_id
             WHERE ea.event_id = ?`,
            [id]
        )
        res.status(200).json({ assignments: rows })
    } catch (error) {
        console.error("Error fetching assignments:", error)
        res.status(500).json({ message: "Internal server error" })
    }
})

// UPDATE EVENT
router.put("/:id", verifyToken, verifyRole("manager", "superadmin"), async (req, res) => {
    try {
        const { id } = req.params
        const { event_name, event_start_date, event_end_date, event_budget, status } = req.body
        const [result] = await pool.execute(  // ← capture result!
            "UPDATE events SET event_name = ?, event_start_date = ?, event_end_date = ?, event_budget = ?, status = ? WHERE event_id = ?",
            [event_name, event_start_date, event_end_date, event_budget, status, id]
        )
    // AUTO RETURN RESOURCES when event is completed
        if (status === "completed") {
            // Get all resources assigned to this event
            const [assignedResources] = await pool.execute(
                "SELECT resource_id FROM resource_assignments WHERE event_id = ? AND returned_at IS NULL",
                [id]
            )
            
            if (assignedResources.length > 0) {
                // Update each resource status to available
                for (const r of assignedResources) {
                    await pool.execute(
                        "UPDATE resources SET resource_status = 'available' WHERE resource_id = ?",
                        [r.resource_id]
                    )
                }
                // Mark all assignments as returned
                await pool.execute(
                    "UPDATE resource_assignments SET returned_at = NOW() WHERE event_id = ? AND returned_at IS NULL",
                    [id]
                )
            }
        }
                if (result.affectedRows === 0) {
                    return res.status(404).json({ message: "Event not found" })
                }
                res.status(200).json({ message: "Event updated successfully" })
            } catch (error) {
                console.error("Error updating event:", error)
                res.status(500).json({ message: "Internal server error" })
            }
})

// DELETE EVENT
router.delete("/:id", verifyToken, verifyRole("manager", "superadmin"), async (req, res) => {
    try {
        const { id } = req.params
        const [result] = await pool.execute("DELETE FROM events WHERE event_id = ?", [id])  // ← capture result!
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Event not found" })
        }
        res.status(200).json({ message: "Event deleted successfully" })
    } catch (error) {
        console.error("Error deleting event:", error)
        res.status(500).json({ message: "Internal server error" })
    }
})


// ASSIGN STAFF TO EVENT
// POST /api/events/:id/assign
router.post("/:id/assign", verifyToken, verifyRole("manager", "superadmin"), async (req, res) => {
    try {
        // Step 1 — get event_id from params
        const { id } = req.params
        // Step 2 — get user_id from req.body (staff to assign)
        const { user_id } = req.body
        // Step 3 — check if event exists
        const [eventRows] = await pool.execute("SELECT * FROM events WHERE event_id = ?", [id])
        if (eventRows.length === 0) {
            return res.status(404).json({ message: "Event not found" })
        }
        // Step 4 — check if staff is already assigned to this event
        const [assignmentRows] = await pool.execute(
            "SELECT * FROM event_assignments WHERE event_id = ? AND user_id = ?", 
            [id, user_id]
        )
        if (assignmentRows.length > 0) {
            return res.status(400).json({ message: "Staff is already assigned to this event" })
        }
        // Step 5 — insert into event_assignments table
        const [result] = await pool.execute(
            "INSERT INTO event_assignments (event_id, user_id) VALUES (?, ?)",
            [id, user_id]
        )
        // Step 6 — AUTO CREATE NOTIFICATION ← new!        
        const event_name = eventRows[0].event_name  // ← already fetched in step 3!
        await pool.execute(
            "INSERT INTO notifications (user_id, message, is_read) VALUES (?, ?, ?)",
            [user_id, `You have been assigned to a new event: ${event_name}`, 0]
        )

        // Step 7 — return success response
        res.status(200).json({ message: "Staff assigned to event successfully" })

    } catch (error) {
        console.error("Error assigning staff to event:", error)
        res.status(500).json({ message: "Internal server error" })
    }
})
export default router