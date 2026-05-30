import express from "express"
import pool from "../config/db.js"
import { verifyToken, verifyRole } from "../authMiddleware.js"

const router = express.Router()

// CREATE BOOKING
// POST /api/bookings
router.post("/", verifyToken, verifyRole("manager", "superadmin"), async (req, res) => {
    try {
        // Step 1 — extract booking data from req.body
        // fields: client_name, client_phone, event_type, event_date, location, description
        const { client_name, client_phone, event_type, event_date, location, description } = req.body
        
        // Step 2 — get created_by from token
        const created_by = req.user.user_id

        // Step 3 — insert into bookings table
        const [result] = await pool.execute(
            "INSERT INTO bookings (client_name, client_phone, event_type, event_date, location, description, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [client_name, client_phone, event_type, event_date, location, description, created_by]
        )
        const newBookingId = result.insertId
        // status defaults to "pending" automatically
        
        // Step 4 — return success response
        res.status(201).json({ id: newBookingId, message: "Booking created successfully" })

    } catch (error) {
        console.error("Error creating booking:", error)
        res.status(500).json({ message: "Internal server error" })
    }
})

//GET All  Bookings
router.get("/", verifyToken, verifyRole("manager", "superadmin"), async (req, res) => {
    try {
        const [bookings] = await pool.execute("SELECT * FROM bookings")
        res.status(200).json(bookings)
    } catch (error) {
        console.error("Error fetching bookings:", error)
        res.status(500).json({ message: "Internal server error" })
    }
})


//GET single booking by id
router.get("/:id", verifyToken, verifyRole("manager", "superadmin"), async (req, res) => {
    try {
        const { id } = req.params
        const [rows] = await pool.execute("SELECT * FROM bookings WHERE booking_id = ?", [id])
        const booking = rows[0]
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" })
        }
        res.status(200).json(booking)
    }
    catch (error) {
    console.error("Error fetching booking:", error)
        res.status(500).json({ message: "Internal server error" })
     }
})

//UPDATE BOOKING
router.put("/:id", verifyToken, verifyRole("manager", "superadmin"), async (req, res) => {
    try {
        const { id } = req.params
        const { client_name, client_phone, event_type, event_date, location, description, status, event_id } = req.body

        const [result] = await pool.execute(
            "UPDATE bookings SET client_name = ?, client_phone = ?, event_type = ?, event_date = ?, location = ?, description = ?, status = ?, event_id = ? WHERE booking_id = ?",
            [client_name, client_phone, event_type, event_date, location, description, status, event_id || null, id]
        )

        // AUTO CANCEL EVENT AND RELEASE RESOURCES when booking is cancelled
        if (status === "cancelled") {
                // Get the booking to find linked event_id
                const [bookingRows] = await pool.execute(
                    "SELECT event_id FROM bookings WHERE booking_id = ?", [id]
                )
                const linkedEventId = bookingRows[0]?.event_id

                if (linkedEventId) {
                    // Cancel the linked event
                    await pool.execute(
                        "UPDATE events SET status = 'cancelled' WHERE event_id = ?",
                        [linkedEventId]
                    )

                    // Get all resources assigned to that event
                    const [assignedResources] = await pool.execute(
                        "SELECT resource_id FROM resource_assignments WHERE event_id = ? AND returned_at IS NULL",
                        [linkedEventId]
                    )

                    if (assignedResources.length > 0) {
                        // Return all resources to available
                        for (const r of assignedResources) {
                            await pool.execute(
                                "UPDATE resources SET resource_status = 'available' WHERE resource_id = ?",
                                [r.resource_id]
                            )
                        }

                        // Mark all assignments as returned
                        await pool.execute(
                            "UPDATE resource_assignments SET returned_at = NOW() WHERE event_id = ? AND returned_at IS NULL",
                            [linkedEventId]
                        )
                    }
                }
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Booking not found" })
        }

        res.status(200).json({ message: "Booking updated successfully" })
    } catch (error) {
        console.error("Error updating booking:", error)
        res.status(500).json({ message: "Internal server error" })
    }
})

// DELETE BOOKING
router.delete("/:id", verifyToken, verifyRole("manager", "superadmin"), async (req, res) => {
    try {
        const { id } = req.params
        const [result] = await pool.execute("DELETE FROM bookings WHERE booking_id = ?", [id])
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Booking not found" })
        }
        res.status(200).json({ message: "Booking deleted successfully" })
    } catch (error) {
        console.error("Error deleting booking:", error)
        res.status(500).json({ message: "Internal server error" })
    }
})

export default router