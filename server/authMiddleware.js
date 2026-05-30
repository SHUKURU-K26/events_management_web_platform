import jwt from "jsonwebtoken"
import dotenv from "dotenv"
dotenv.config()

const verifyToken = (req, res, next) => {

    // Step 1 — get the authorization header
    const authHeader = req.headers.authorization

    // Step 2 — if no header, block access
    if (!authHeader) {
        return res.status(401).json({ message: "No token provided" })
    }

    // Step 3 — extract token from "Bearer eyJhbGci..."
    const token = authHeader.split(" ")[1]

    // Step 4 — verify the token
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {

        // if token is invalid or expired
        if (err) {
            return res.status(401).json({ message: "Invalid or expired token" })
        }

        // Step 5 — attach user info to request
        req.user = decoded

        // Step 6 — continue to the actual route
        next()
    })
}


// Middleware to check if user has required role(s)
const verifyRole = (...allowedRoles) => {
    return (req, res, next) => {

        // Step 1 — get role from req.user
        // hint: verifyToken already attached req.user!
            const userRole = req.user.role            
            
        // Step 2 — check if user role is in allowedRoles
        // hint: allowedRoles.includes(req.user.role)
                    
        if (!allowedRoles.includes(userRole)) {
             return res.status(401).json({ message: "Access denied: insufficient permissions" })
        }                                
        // Step 4 — if allowed, call next()
        next()
    }
}

export { verifyToken, verifyRole }