import express from "express"
import pool from "../config/db.js"
import { verifyToken, verifyRole } from "../authMiddleware.js"

const router = express.Router()

// GENERATE OTP
router.post("/generate", verifyToken, verifyRole("manager", "superadmin"), async (req, res) => {
    try {
        const user_id = req.user.user_id

        // Generate random 6 digit code
        const code = Math.floor(100000 + Math.random() * 900000).toString()

        // Expires in 24 hours
        const expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000)
            .toISOString().slice(0, 19).replace("T", " ")

        await pool.execute(
            "INSERT INTO otps (code, created_by, expires_at) VALUES (?, ?, ?)",
            [code, user_id, expires_at]
        )

        res.status(201).json({ code, message: "OTP generated successfully" })

    } catch (error) {
        console.error("Error generating OTP:", error)
        res.status(500).json({ message: "Internal server error" })
    }
})

// GET ALL OTPS (for history list)
router.get("/", verifyToken, verifyRole("manager", "superadmin"), async (req, res) => {
    try {
        const [rows] = await pool.execute(
            "SELECT * FROM otps ORDER BY created_at DESC LIMIT 10"
        )
        res.status(200).json({ otps: rows })
    } catch (error) {
        console.error("Error fetching OTPs:", error)
        res.status(500).json({ message: "Internal server error" })
    }
})

// VERIFY OTP (used during registration)
router.post("/verify", async (req, res) => {
    try {
        const { code } = req.body

        const [rows] = await pool.execute(
            "SELECT * FROM otps WHERE code = ?", [code]
        )
        const otp = rows[0]

        if (!otp) {
            return res.status(400).json({ message: "Invalid OTP code" })
        }

        if (otp.is_used) {
            return res.status(400).json({ message: "This OTP has already been used" })
        }

        const now = new Date()
        const expires = new Date(otp.expires_at)
        if (now > expires) {
            return res.status(400).json({ message: "This OTP has expired" })
        }

        res.status(200).json({ valid: true, message: "OTP is valid" })

    } catch (error) {
        console.error("Error verifying OTP:", error)
        res.status(500).json({ message: "Internal server error" })
    }
})

export default router