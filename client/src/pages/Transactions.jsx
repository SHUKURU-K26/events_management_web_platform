import { useEffect, useState } from "react"
import axios from "axios"
import {
  Plus, Trash2, Edit2, X, Search,
  TrendingUp, TrendingDown, ArrowLeftRight,
  DollarSign
} from "lucide-react"

const api = () => axios.create({
  baseURL: "http://localhost:3000/api",
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
})

const emptyForm = {
  transaction_category: "expense",
  transaction_name: "",
  transaction_amount: "",
  date_of_transaction: "",
  event_id: ""
}

const Modal = ({ title, onClose, children }) => (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "#00000055",
      zIndex: 200, display: "flex", alignItems: "center",
      justifyContent: "center", padding: "16px"
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "white", borderRadius: "16px",
        width: "100%", maxWidth: "480px", padding: "24px",
        boxShadow: "0 20px 60px #00000025",
        maxHeight: "90vh", overflowY: "auto"
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <p style={{ fontSize: "18px", fontWeight: "700", color: "#0f172a" }}>{title}</p>
          <button onClick={onClose} style={{
            background: "none", border: "none", cursor: "pointer",
            color: "#94a3b8", padding: "4px", borderRadius: "6px",
            display: "flex", alignItems: "center"
          }}><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  )

  const CategoryBadge = ({ category }) => (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "5px",
      padding: "4px 10px", borderRadius: "20px",
      fontSize: "12px", fontWeight: "600", whiteSpace: "nowrap",
      background: category === "revenue" ? "#dcfce7" : "#fee2e2",
      color: category === "revenue" ? "#16a34a" : "#dc2626"
    }}>
      {category === "revenue"
        ? <TrendingUp size={11} />
        : <TrendingDown size={11} />
      }
      {category}
    </span>
  )
  

export default function Transactions() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterCategory, setFilterCategory] = useState("all")
  const [showCreate, setShowCreate] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [selectedTx, setSelectedTx] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState("")
  const [formLoading, setFormLoading] = useState(false)
  const [events, setEvents] = useState([])

  const fetchTransactions = async () => {
    try {
      const res = await api().get("/transactions")
      console.log("First transaction:", res.data.transactions[0])  // ← add this
      setTransactions(res.data.transactions)
    } catch {
      console.error("Failed to fetch transactions")
    } finally {
      setLoading(false)
    }
  }

  // Fetch events for the dropdown in the form
   const fetchEvents = async () => {
    try {
        const res = await api().get("/events")
        setEvents(res.data.events)
    } catch {
        console.error("Failed to fetch events")
    }
}
  useEffect(() => { fetchTransactions(); fetchEvents() }, [])

  const handleCreate = async () => {
    const error = validateForm()
    if (error) { setFormError(error); return }  // ← add this
    setFormLoading(true)
    setFormError("")
    try {
      await api().post("/transactions", {
        ...form,
        event_id: form.event_id || null
      })
      setShowCreate(false)
      setForm(emptyForm)
      fetchTransactions()
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to create transaction")
    } finally {
      setFormLoading(false)
    }
  }

  const handleEdit = async () => {
    const error = validateForm()
    if (error) { setFormError(error); return }  // ← add this
    
    setFormLoading(true)
    setFormError("")
    try {
      await api().put(`/transactions/${selectedTx.t_id}`, {
        ...form,
        event_id: form.event_id || null
      })
      setShowEdit(false)
      fetchTransactions()
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to update transaction")
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this transaction?")) return
    try {
      await api().delete(`/transactions/${id}`)
      fetchTransactions()
    } catch {
      alert("Failed to delete transaction")
    }
  }

  const openEdit = (tx) => {
    setSelectedTx(tx)
    setForm({
      transaction_category: tx.transaction_category,
      transaction_name: tx.transaction_name,
      transaction_amount: tx.transaction_amount,
      date_of_transaction: tx.date_of_transaction?.split("T")[0],
      event_id: tx.event_id || ""
    })
    setFormError("")
    setShowEdit(true)
  }

  const validateForm = () => {
    if (!form.transaction_name.trim()) return "Transaction name is required"
    if (!form.transaction_amount || Number(form.transaction_amount) <= 0) return "Amount must be greater than 0"
    if (!form.date_of_transaction) return "Date is required"
    return null
}

  const filtered = transactions.filter(t => {
    const matchSearch = t.transaction_name.toLowerCase().includes(search.toLowerCase())
    const matchCat = filterCategory === "all" || t.transaction_category === filterCategory
    return matchSearch && matchCat
  })

  // Summary stats
  const totalRevenue = transactions
    .filter(t => t.transaction_category === "revenue")
    .reduce((sum, t) => sum + Number(t.transaction_amount), 0)

  const totalExpenses = transactions
    .filter(t => t.transaction_category === "expense")
    .reduce((sum, t) => sum + Number(t.transaction_amount), 0)

  const netBalance = totalRevenue - totalExpenses

  return (
    <>
      <style>{`
        .tx-header {
          display: flex; align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 20px; gap: 12px; flex-wrap: wrap;
        }
        .btn-primary {
          display: flex; align-items: center; gap: 8px;
          padding: 10px 16px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white; border: none; border-radius: 10px;
          font-size: 14px; font-weight: 600; cursor: pointer;
          white-space: nowrap; flex-shrink: 0;
        }
        .btn-sm {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 6px 10px; border-radius: 7px;
          font-size: 12px; font-weight: 500; cursor: pointer;
          border: 1px solid #e2e8f0; background: #f8fafc; color: #475569;
          white-space: nowrap;
        }
        .btn-sm-danger {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 6px 10px; border-radius: 7px;
          font-size: 12px; font-weight: 500; cursor: pointer;
          border: 1px solid #fecaca; background: #fef2f2; color: #dc2626;
        }

        /* SUMMARY CARDS */
        .tx-summary {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px; margin-bottom: 20px;
        }
        .tx-summary-card {
          background: white; border-radius: 12px;
          border: 1px solid #f1f5f9; padding: 16px 20px;
          display: flex; align-items: center; gap: 14px;
        }
        .tx-summary-icon {
          width: 40px; height: 40px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .tx-summary-val {
          font-size: 18px; font-weight: 700;
          color: #0f172a; margin-bottom: 2px;
          white-space: nowrap; overflow: hidden;
          text-overflow: ellipsis;
        }
        .tx-summary-label { font-size: 12px; color: #94a3b8; }

        /* TOOLBAR */
        .tx-toolbar {
          display: flex; gap: 10px;
          margin-bottom: 16px; flex-wrap: wrap;
        }
        .tx-search {
          display: flex; align-items: center; gap: 8px;
          padding: 9px 14px; background: white;
          border: 1px solid #e2e8f0; border-radius: 10px;
          flex: 1; min-width: 0;
        }
        .tx-search input {
          border: none; outline: none; font-size: 14px;
          color: #0f172a; background: transparent; width: 100%;
        }
        .tx-search input::placeholder { color: #94a3b8; }
        .tx-filter {
          padding: 9px 14px; background: white;
          border: 1px solid #e2e8f0; border-radius: 10px;
          font-size: 14px; color: #475569; outline: none; cursor: pointer;
        }

        /* TABLE */
        .tx-table-wrap {
          background: white; border-radius: 14px;
          border: 1px solid #f1f5f9; overflow: hidden;
        }
        .tx-table-scroll { overflow-x: auto; }
        .tx-table { width: 100%; border-collapse: collapse; min-width: 580px; }
        .tx-table th {
          padding: 11px 14px; text-align: left;
          font-size: 11px; font-weight: 600; color: #94a3b8;
          letter-spacing: 0.5px; text-transform: uppercase;
          background: #f8fafc; border-bottom: 1px solid #f1f5f9;
          white-space: nowrap;
        }
        .tx-table td {
          padding: 13px 14px; font-size: 14px;
          color: #374151; border-bottom: 1px solid #f8fafc;
          vertical-align: middle;
        }
        .tx-table tr:last-child td { border-bottom: none; }
        .tx-table tr:hover td { background: #fafafa; }
        .tx-actions { display: flex; gap: 6px; align-items: center; }

        /* MOBILE CARDS */
        .tx-cards { display: none; padding: 12px; gap: 10px; flex-direction: column; }
        .tx-card {
          background: white; border-radius: 12px;
          border: 1px solid #f1f5f9; padding: 16px;
          box-shadow: 0 1px 4px #0000000a;
        }
        .tx-card-top {
          display: flex; align-items: flex-start;
          justify-content: space-between; gap: 8px; margin-bottom: 12px;
        }
        .tx-card-name { font-weight: 700; color: #0f172a; font-size: 15px; }
        .tx-card-grid {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 10px; margin-bottom: 12px;
        }
        .tx-card-label {
          font-size: 10px; color: #94a3b8; font-weight: 600;
          text-transform: uppercase; letter-spacing: 0.5px;
          display: block; margin-bottom: 2px;
        }
        .tx-card-val { font-size: 13px; color: #374151; font-weight: 500; }
        .tx-card-actions { display: flex; gap: 8px; flex-wrap: wrap; }

        /* EMPTY */
        .tx-empty { padding: 60px 20px; text-align: center; }

        /* MODAL */
        .mf-group { margin-bottom: 14px; }
        .mf-label {
          display: block; font-size: 13px; font-weight: 600;
          color: #374151; margin-bottom: 6px;
        }
        .mf-input {
          width: 100%; padding: 10px 14px;
          border: 1.5px solid #e2e8f0; border-radius: 8px;
          font-size: 14px; color: #0f172a; outline: none;
          background: #f8fafc; box-sizing: border-box;
          font-family: inherit; transition: border-color 0.15s;
        }
        .mf-input:focus { border-color: #6366f1; background: white; }
        .mf-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .mf-error {
          padding: 10px 14px; background: #fef2f2;
          border: 1px solid #fecaca; border-radius: 8px;
          color: #dc2626; font-size: 13px; margin-bottom: 14px;
        }
        .mf-footer {
          display: flex; gap: 10px;
          justify-content: flex-end; margin-top: 20px;
        }
        .mf-cancel {
          padding: 10px 16px; background: #f8fafc;
          border: 1px solid #e2e8f0; border-radius: 8px;
          font-size: 14px; font-weight: 500; color: #475569;
          cursor: pointer; font-family: inherit;
        }
        .mf-submit {
          padding: 10px 20px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white; border: none; border-radius: 8px;
          font-size: 14px; font-weight: 600; cursor: pointer;
          font-family: inherit;
        }
        .mf-submit:disabled { opacity: 0.6; cursor: not-allowed; }

        /* RESPONSIVE */
        @media (max-width: 768px) {
          .tx-summary { grid-template-columns: 1fr; }
          .tx-summary-card { padding: 14px 16px; }
        }
        @media (max-width: 640px) {
          .tx-table-scroll { display: none; }
          .tx-cards { display: flex; }
          .tx-toolbar { flex-direction: column; }
          .tx-filter { width: 100%; }
          .mf-row { grid-template-columns: 1fr; }
        }
        @media (max-width: 400px) {
          .tx-card-grid { grid-template-columns: 1fr; }
          .tx-summary { grid-template-columns: 1fr; }
        }
      `}</style>

      <div>
        {/* Header */}
        <div className="tx-header">
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: "700", color: "#0f172a", marginBottom: "4px", letterSpacing: "-0.5px" }}>Transactions</h1>
            <p style={{ fontSize: "13px", color: "#94a3b8" }}>{filtered.length} transaction{filtered.length !== 1 ? "s" : ""} found</p>
          </div>
          <button className="btn-primary" onClick={() => { setForm(emptyForm); setFormError(""); setShowCreate(true) }}>
            <Plus size={15} /> New Transaction
          </button>
        </div>

        {/* Summary Cards */}
        <div className="tx-summary">
          {[
            {
              label: "Total Revenue",
              value: `${totalRevenue.toLocaleString()} RWF`,
              icon: TrendingUp, iconBg: "#dcfce7", iconColor: "#16a34a"
            },
            {
              label: "Total Expenses",
              value: `${totalExpenses.toLocaleString()} RWF`,
              icon: TrendingDown, iconBg: "#fee2e2", iconColor: "#dc2626"
            },
            {
              label: "Net Balance",
              value: `${netBalance.toLocaleString()} RWF`,
              icon: DollarSign,
              iconBg: netBalance >= 0 ? "#dbeafe" : "#fef3c7",
              iconColor: netBalance >= 0 ? "#2563eb" : "#d97706"
            },
          ].map((card, i) => {
            const Icon = card.icon
            return (
              <div className="tx-summary-card" key={i}>
                <div className="tx-summary-icon" style={{ background: card.iconBg }}>
                  <Icon size={18} color={card.iconColor} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <p className="tx-summary-val">{card.value}</p>
                  <p className="tx-summary-label">{card.label}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Toolbar */}
        <div className="tx-toolbar">
          <div className="tx-search">
            <Search size={15} color="#94a3b8" />
            <input placeholder="Search transactions..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="tx-filter" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
            <option value="all">All Types</option>
            <option value="revenue">Revenue</option>
            <option value="expense">Expense</option>
          </select>
        </div>

        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8", background: "white", borderRadius: "14px" }}>Loading transactions...</div>
        ) : filtered.length === 0 ? (
          <div className="tx-empty" style={{ background: "white", borderRadius: "14px", border: "1px solid #f1f5f9" }}>
            <div style={{ width: "48px", height: "48px", background: "#f1f5f9", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
              <ArrowLeftRight size={22} color="#cbd5e1" />
            </div>
            <p style={{ fontWeight: "600", color: "#64748b", marginBottom: "4px" }}>No transactions found</p>
            <p style={{ fontSize: "13px", color: "#94a3b8" }}>Add your first transaction to get started</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="tx-table-wrap">
              <div className="tx-table-scroll">
                <table className="tx-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Name</th>
                      <th>Type</th>
                      <th>Amount</th>
                      <th>Date</th>
                      <th>Event</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((tx, i) => (
                      <tr key={tx.t_id}>
                        <td style={{ color: "#94a3b8", fontSize: "12px" }}>{i + 1}</td>
                        <td style={{ fontWeight: "600", color: "#0f172a" }}>{tx.transaction_name}</td>
                        <td><CategoryBadge category={tx.transaction_category} /></td>
                        <td style={{ fontWeight: "600", color: tx.transaction_category === "revenue" ? "#16a34a" : "#dc2626" }}>
                          {tx.transaction_category === "revenue" ? "+" : "-"}{Number(tx.transaction_amount).toLocaleString()} RWF
                        </td>
                        <td>{tx.date_of_transaction?.split("T")[0]}</td>
                        <td>{tx.event_name || <span style={{ color: "#cbd5e1" }}>—</span>}</td>
                        <td>
                          <div className="tx-actions">
                            <button className="btn-sm" onClick={() => openEdit(tx)}><Edit2 size={12} />Edit</button>
                            <button className="btn-sm-danger" onClick={() => handleDelete(tx.t_id)}><Trash2 size={12} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards */}
            <div className="tx-cards">
              {filtered.map(tx => (
                <div className="tx-card" key={tx.t_id}>
                  <div className="tx-card-top">
                    <p className="tx-card-name">{tx.transaction_name}</p>
                    <CategoryBadge category={tx.transaction_category} />
                  </div>
                  <div className="tx-card-grid">
                    <div>
                      <span className="tx-card-label">Amount</span>
                      <span className="tx-card-val" style={{ color: tx.transaction_category === "revenue" ? "#16a34a" : "#dc2626", fontWeight: "700" }}>
                        {tx.transaction_category === "revenue" ? "+" : "-"}{Number(tx.transaction_amount).toLocaleString()} RWF
                      </span>
                    </div>
                    <div>
                      <span className="tx-card-label">Date</span>
                      <span className="tx-card-val">{tx.date_of_transaction?.split("T")[0]}</span>
                    </div>
                    <div>
                      <span className="tx-card-label">Event</span>
                      <span className="tx-card-val">{tx.event_name || "—"}</span>
                    </div>
                  </div>
                  <div className="tx-card-actions">
                    <button className="btn-sm" onClick={() => openEdit(tx)}><Edit2 size={12} />Edit</button>
                    <button className="btn-sm-danger" onClick={() => handleDelete(tx.t_id)}><Trash2 size={12} /></button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* CREATE MODAL */}
      {showCreate && (
        <Modal title="Add Transaction" onClose={() => setShowCreate(false)}>
          {formError && <div className="mf-error">{formError}</div>}
              
          <div className="mf-group">
              <label className="mf-label">Category</label>
              <select className="mf-input" value={form.transaction_category} onChange={e => setForm({ ...form, transaction_category: e.target.value })}>
                  <option value="expense">Expense</option>
                  <option value="revenue">Revenue</option>
              </select>
          </div>
          <div className="mf-group">
              <label className="mf-label">Transaction Name <span style={{ color: "#ef4444" }}>*</span></label>
              <input
                  className="mf-input"
                  placeholder="e.g. Venue Rental, Client Payment"
                  value={form.transaction_name}
                  onChange={e => setForm({ ...form, transaction_name: e.target.value })}
              />
          </div>
          <div className="mf-row">
              <div className="mf-group">
                  <label className="mf-label">Amount (RWF) <span style={{ color: "#ef4444" }}>*</span></label>
                  <input
                      type="number"
                      className="mf-input"
                      placeholder="e.g. 500000"
                      value={form.transaction_amount}
                      onChange={e => setForm({ ...form, transaction_amount: e.target.value })}
                  />
              </div>
              <div className="mf-group">
                  <label className="mf-label">Date <span style={{ color: "#ef4444" }}>*</span></label>
                  <input
                      type="date"
                      className="mf-input"
                      value={form.date_of_transaction}
                      onChange={e => setForm({ ...form, date_of_transaction: e.target.value })}
                  />
              </div>
          </div>
            <div className="mf-group">
                <label className="mf-label">Link to Event <span style={{ color: "#94a3b8", fontWeight: "400" }}>(optional)</span></label>
                <select
                    className="mf-input"
                    value={form.event_id}
                    onChange={e => setForm({ ...form, event_id: e.target.value })}
                >
                    <option value="">No event — general transaction</option>
                    {events.map(event => (
                        <option key={event.event_id} value={event.event_id}>
                            {event.event_name} — {event.event_start_date?.slice(0, 10)}
                        </option>
                    ))}
                </select>
            </div>

          <div className="mf-footer">
            <button className="mf-cancel" onClick={() => setShowCreate(false)}>Cancel</button>
            <button className="mf-submit" disabled={formLoading} onClick={handleCreate}>{formLoading ? "Saving..." : "Add Transaction"}</button>
          </div>
        </Modal>
      )}

      {/* EDIT MODAL */}
      {showEdit && (
        <Modal title="Edit Transaction" onClose={() => setShowEdit(false)}>
          {formError && <div className="mf-error">{formError}</div>}
            <div className="mf-group">
                <label className="mf-label">Category</label>
                <select className="mf-input" value={form.transaction_category} onChange={e => setForm({ ...form, transaction_category: e.target.value })}>
                    <option value="expense">Expense</option>
                    <option value="revenue">Revenue</option>
                </select>
            </div>
            <div className="mf-group">
                <label className="mf-label">Transaction Name <span style={{ color: "#ef4444" }}>*</span></label>
                <input
                    className="mf-input"
                    placeholder="e.g. Venue Rental, Client Payment"
                    value={form.transaction_name}
                    onChange={e => setForm({ ...form, transaction_name: e.target.value })}
                />
            </div>
            <div className="mf-row">
                <div className="mf-group">
                    <label className="mf-label">Amount (RWF) <span style={{ color: "#ef4444" }}>*</span></label>
                    <input
                        type="number"
                        className="mf-input"
                        placeholder="e.g. 500000"
                        value={form.transaction_amount}
                        onChange={e => setForm({ ...form, transaction_amount: e.target.value })}
                    />
                </div>
                <div className="mf-group">
                    <label className="mf-label">Date <span style={{ color: "#ef4444" }}>*</span></label>
                    <input
                        type="date"
                        className="mf-input"
                        value={form.date_of_transaction}
                        onChange={e => setForm({ ...form, date_of_transaction: e.target.value })}
                    />
                </div>
            </div>
             <div className="mf-group">
                  <label className="mf-label">Link to Event <span style={{ color: "#94a3b8", fontWeight: "400" }}>(optional)</span></label>
                  <select
                      className="mf-input"
                      value={form.event_id}
                      onChange={e => setForm({ ...form, event_id: e.target.value })}
                  >
                      <option value="">No event — general transaction</option>
                      {events.map(event => (
                          <option key={event.event_id} value={event.event_id}>
                              {event.event_name} — {event.event_start_date?.slice(0, 10)}
                          </option>
                      ))}
                  </select>
              </div>
            
          <div className="mf-footer">
            <button className="mf-cancel" onClick={() => setShowEdit(false)}>Cancel</button>
            <button className="mf-submit" disabled={formLoading} onClick={handleEdit}>{formLoading ? "Saving..." : "Save Changes"}</button>
          </div>
        </Modal>
      )}
    </>
  )
}