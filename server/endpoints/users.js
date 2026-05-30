import express from "express"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import  pool  from "../config/db.js" // ✅ correct path
import { verifyToken, verifyRole } from "../authMiddleware.js"  

const router = express.Router()

// REGISTER ROUTE
// POST /api/users/register
router.post("/register", async (req, res) => {

    try {
        // Step 1 — extract data from request body
        const { firstname, lastname, username, password, role } = req.body
        // Step 2 — check if username already exists in DB
        const [rows] = await pool.execute("SELECT * FROM users WHERE username = ?", [username])  
        // Step 3 — if exists, return error response
        if (rows.length > 0) {
            return res.status(400).json({ message: "Username already exists" })
        }

        // Step 4 — hash the password
        const hashedPassword = await bcrypt.hash(password, 10)

        // Step 5 — insert new user into database
        await pool.execute("INSERT INTO users (firstname, lastname, username, password, role) VALUES (?, ?, ?, ?, ?)", [firstname, lastname, username, hashedPassword, role])
        
        // Step 6 — return success response
        res.status(201).json({ message: "User registered successfully" })
    }
     catch (error) {
        console.error("Error in /register route:", error)
        res.status(500).json({ message: "Internal server error" })
    } 

})


// POST /api/users/login
router.post("/login", async (req, res) => {
    try {
        // Step 1 — extract username and password from req.body
        const { username, password } = req.body
        // Step 2 — check if username exists in database
        // hint: SELECT * FROM users WHERE username = ?
        const [rows] = await pool.execute("SELECT * FROM users WHERE username = ?", [username])
        const user = rows[0]  // get the first user (if exists)
        // Step 3 — if user NOT found, return error response
        if (!user) {
            return res.status(400).json({ message: "Invalid username or password" })
        }
        // Step 4 — compare password with hashed password in DB
        // hint: bcrypt.compare(password, user.password)
        const isMatch = await bcrypt.compare(password, user.password)

        // Step 5 — if password wrong, return error response
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid username or password" })
        }

        // Step 6 — generate JWT token
        const token = jwt.sign(
            {
             user_id: user.user_id, 
             username: user.username, 
             role: user.role 
            }, 
             process.env.JWT_SECRET,
              
             { expiresIn: "24h" })

        // Step 7 — return success response with token and user info
        res.json({ token, user: { user_id: user.user_id, username: user.username, role: user.role } })

    } catch (error) {
        console.error("Error in /login route:", error)
        res.status(500).json({ message: "Internal server error" })
    }
})

// GET ALL STAFF USERS
// GET /api/users/staff
router.get("/staff", verifyToken, verifyRole("manager", "superadmin"), async (req, res) => {
    try {
        const [rows] = await pool.execute(
            "SELECT user_id, firstname, lastname, username, role FROM users WHERE role = 'staff'"
        )
        res.status(200).json({ staff: rows })
    } catch (error) {
        console.error("Error fetching staff:", error)
        res.status(500).json({ message: "Internal server error" })
    }
})

// TEST PROTECTED ROUTE  ← add this here
router.get("/me", verifyToken, (req, res) => {
    res.json({ 
        message: "Protected route works!",
        user: req.user 
    })
})

export default router