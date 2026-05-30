import express from "express"
import  pool  from "../config/db.js"
import { verifyToken, verifyRole } from "../authMiddleware.js"
const routes =express.Router()

//Create Resources
routes.post("/", verifyToken, verifyRole("manager", "superadmin"), async (req, res) => {
    try {
        // Step 1 — extract Resources data from req.body
        const { resource_name, resource_category, resource_serialNumber, resource_status } = req.body        
        // Step 2 — insert into Resources table
        const [result] = await pool.execute(
            "INSERT INTO resources (resource_name, resource_category, resource_serialNumber, resource_status) VALUES (?, ?, ?, ?)",
            [resource_name, resource_category, resource_serialNumber, "available"]
        )
        const newResourceId = result.insertId
        res.status(201).json({ message: `${resource_name} is created as a New resource`, ResourceId: newResourceId })
    } catch (error) {
        console.error("Error creating resource:", error)
        res.status(500).json({ message: "Internal server error" })
    }
})

//Get All Resources All users can see all resources
// GET /api/resources
routes.get("/", verifyToken, async (req, res) => {  // ← no verifyRole here!
    try {       
        // get all resources
        const [result] = await pool.execute("SELECT * FROM resources")      
        res.status(200).json({ resources: result })
    } catch (error) {
        console.error("Error fetching resources:", error)
        res.status(500).json({ message: "Internal server error" })
    }
})

//GET    /api/resources/:id  → get single resource
routes.get("/:id", verifyToken, async (req, res) => {
    try {
        const { id } = req.params   
        const [rows] = await pool.execute("SELECT * FROM resources WHERE resource_id = ?", [id])
        const resource = rows[0]
        if (!resource) {
            return res.status(404).json({ message: "Resource not found" })
        }
        res.status(200).json({ resource })
    } catch (error) {
        console.error("Error fetching resource:", error)
        res.status(500).json({ message: "Internal server error" })
     }
})

//UPDATE RESOURCE
routes.put("/:id", verifyToken, verifyRole("manager", "superadmin"), async (req, res) => {
    try {
        const { id } = req.params
        const { resource_name, resource_category, resource_serialNumber, resource_status } = req.body
        const [result] = await pool.execute(
            "UPDATE resources SET resource_name = ?, resource_category = ?, resource_serialNumber = ?, resource_status = ? WHERE resource_id = ?",
            [resource_name, resource_category, resource_serialNumber, resource_status, id]
        )
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Resource not found" })
        }
        res.status(200).json({ message: "Resource updated successfully" })
    } catch (error) {
        console.error("Error updating resource:", error)
        res.status(500).json({ message: "Internal server error" })
    }
})

//Delete Resource
routes.delete("/:id", verifyToken, verifyRole("manager", "superadmin"), async (req, res) => {
    try {
        const { id } = req.params
        const [result] = await pool.execute("DELETE FROM resources WHERE resource_id = ?", [id])  // ← capture result!
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Resource not found" })
        }
        res.status(200).json({ message: "Resource deleted successfully" })
    } catch (error) {
        console.error("Error deleting resource:", error)
        res.status(500).json({ message: "Internal server error" })
    }
})

//Assign Resource to Resource_assignment table
routes.post("/:id/assign", verifyToken, verifyRole("manager", "superadmin"), async (req, res) => {
    try {
        const { id } = req.params  // resource_id from URL
        const { event_id } = req.body

        // Check if resource exists
        const [rows] = await pool.execute(
            "SELECT * FROM resources WHERE resource_id = ?", [id]
        )
        const resource = rows[0]
        if (!resource) {
            return res.status(404).json({ message: "Resource not found" })
        }

        // Check if resource is available
        if (resource.resource_status !== "available") {
            return res.status(400).json({ message: "Resource is not available" })
        }

        // Insert into resource_assignments
        await pool.execute(
            "INSERT INTO resource_assignments (resource_id, event_id) VALUES (?, ?)",
            [id, event_id]
        )

        // Update resource status to inuse
        await pool.execute(
            "UPDATE resources SET resource_status = ? WHERE resource_id = ?",
            ["inuse", id]
        )

        res.status(201).json({ message: "Resource assigned to event successfully" })

    } catch (error) {
        console.error("Error assigning resource:", error)
        res.status(500).json({ message: "Internal server error" })
    }
})

//Return Resource to available
routes.post("/:id/return", verifyToken, verifyRole("manager", "superadmin"), async (req, res) => {
    try {
        const { id } = req.params

        // Check if resource exists
        const [rows] = await pool.execute(
            "SELECT * FROM resources WHERE resource_id = ?", [id]
        )
        const resource = rows[0]
        if (!resource) {
            return res.status(404).json({ message: "Resource not found" })
        }

        // Check if resource is actually inuse
        if (resource.resource_status !== "inuse") {
            return res.status(400).json({ message: "Resource is not currently in use" })
        }

        // Update returned_at in resource_assignments
        await pool.execute(
            "UPDATE resource_assignments SET returned_at = NOW() WHERE resource_id = ? AND returned_at IS NULL",
            [id]
        )

        // Update resource status back to available
        await pool.execute(
            "UPDATE resources SET resource_status = ? WHERE resource_id = ?",
            ["available", id]
        )

        res.status(200).json({ message: "Resource returned successfully" })

    } catch (error) {
        console.error("Error returning resource:", error)
        res.status(500).json({ message: "Internal server error" })
    }
})

routes.get("/:id/assignment", verifyToken, verifyRole("manager", "superadmin"), async (req, res) => {
    try {
        const { id } = req.params
        const [rows] = await pool.execute(
            `SELECT ra.*, e.event_name, e.event_start_date, 
             e.event_end_date, e.status as event_status
             FROM resource_assignments ra
             JOIN events e ON ra.event_id = e.event_id
             WHERE ra.resource_id = ? AND ra.returned_at IS NULL`,
            [id]
        )
        res.status(200).json({ assignment: rows[0] || null })
    } catch (error) {
        console.error("Error fetching resource assignment:", error)
        res.status(500).json({ message: "Internal server error" })
    }
})

export default routes