import dotenv from "dotenv"
dotenv.config()
import express from "express"
import  setMiddleware  from "./middleware.js"
import userRoutes from "./endpoints/users.js"
import eventRoutes from "./endpoints/events.js"
import taskRoutes from "./endpoints/tasks.js"
import resourceRoutes from "./endpoints/resources.js"
import transactionRoutes from "./endpoints/transactions.js"
import notificationRoutes from "./endpoints/notifications.js"
import dashboardRoutes from "./endpoints/dashboard.js"
import bookingRoutes from "./endpoints/bookings.js"

const server = express()

// Middleware Setup
setMiddleware(server)

// Routes Setup
server.use("/api/users", userRoutes)
server.use("/api/events", eventRoutes)
server.use("/api/tasks", taskRoutes)
server.use("/api/resources", resourceRoutes)
server.use("/api/transactions", transactionRoutes)
server.use("/api/notifications", notificationRoutes)
server.use("/api/dashboard", dashboardRoutes)
server.use("/api/bookings", bookingRoutes)
// Server PORT Listening
server.listen(process.env.PORT || 5000, () => {
    console.log(`Server is listening on port ${process.env.PORT || 5000}`)
})