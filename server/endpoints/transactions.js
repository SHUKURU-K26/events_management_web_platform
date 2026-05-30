import express from "express"
import  pool  from "../config/db.js"
import { verifyToken, verifyRole } from "../authMiddleware.js"

const routes = express.Router()
// CREATE TRANSACTION
routes.post("/", verifyToken, verifyRole("manager", "superadmin"), async (req, res) => {
    try {
        // Step 1 — extract transaction data from req.body
        const { transaction_category, transaction_name, transaction_amount, date_of_transaction, event_id } = req.body
        const { user_id } = req.user  // get user_id from token, not body!
        // Step 2 — insert into transactions table    
        const [result] = await pool.execute(
            "INSERT INTO transactions (transaction_category, transaction_name, transaction_amount, date_of_transaction, event_id, user_id) VALUES (?, ?, ?, ?, ?, ?)",
            [transaction_category, transaction_name, transaction_amount, date_of_transaction, event_id || null, user_id]
        )
        const newTransactionId = result.insertId

        // Step 3 — return success response
        res.status(201).json({ message: "Transaction created successfully", transactionId: newTransactionId })
    } catch (error) {
        console.error("Error creating transaction:", error)
        res.status(500).json({ message: "Internal server error" })
    }
})

// all roles that can see = manager + superadmin
routes.get("/", verifyToken, verifyRole("manager", "superadmin"), async (req, res) => {
    try {
        // Join transactions with events to get event_name, and return all transactions
        const [rows] = await pool.execute(
            `SELECT t.*, e.event_name 
             FROM transactions t
             LEFT JOIN events e ON t.event_id = e.event_id`
        )
        res.status(200).json({ transactions: rows })
    } catch (error) {
        console.error("Error fetching transactions:", error)
        res.status(500).json({ message: "Internal server error" })
    }
})

//Get a single transaction by id
routes.get("/:id", verifyToken, verifyRole("manager", "superadmin"), async (req, res) => {
    try {
        const { id } = req.params
        const [rows] = await pool.execute("SELECT * FROM transactions WHERE t_id = ?", [id])
        const transaction = rows[0]
        if (!transaction) {
            return res.status(404).json({ message: "Transaction not found" })
        }
        res.status(200).json({ transaction })
    } catch (error) {
        console.error("Error fetching transaction:", error)
        res.status(500).json({ message: "Internal server error" })
     }  
})
//UPDATE TRANSACTION
routes.put("/:id", verifyToken, verifyRole("manager", "superadmin"), async (req, res) => {
    try {
        const { id } = req.params
        const { transaction_category, transaction_name, transaction_amount, date_of_transaction, event_id } = req.body
        const [result] = await pool.execute(
            "UPDATE transactions SET transaction_category = ?, transaction_name = ?, transaction_amount = ?, date_of_transaction = ?, event_id = ? WHERE t_id = ?",
            [transaction_category, transaction_name, transaction_amount, date_of_transaction, event_id || null, id]
        )
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Transaction not found" })
        }
        res.status(200).json({ message: "Transaction updated successfully" })
    } catch (error) {
        console.error("Error updating transaction:", error)
        res.status(500).json({ message: "Internal server error" })
     }
})
//DELETE TRANSACTION
routes.delete("/:id", verifyToken, verifyRole("manager", "superadmin"), async (req, res) => {
    try {
        const { id } = req.params
        const [result] = await pool.execute("DELETE FROM transactions WHERE t_id = ?", [id])
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Transaction not found" })
        }
        res.status(200).json({ message: "Transaction deleted successfully" })
    } catch (error) {
        console.error("Error deleting transaction:", error)
        res.status(500).json({ message: "Internal server error" })
     }
})
export default routes