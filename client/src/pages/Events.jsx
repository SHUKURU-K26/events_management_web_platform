import { useEffect, useState } from "react"
import axios from "axios"
import {
  Plus, Trash2, Edit2, UserPlus, X,
  CalendarDays, Clock, CheckCircle,
  XCircle, AlertCircle, Search, CheckCheck, Users
} from "lucide-react"

const api = () => axios.create({
  baseURL: "http://localhost:3000/api",
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
})

const statusStyles = {
  pending: { bg: "#fef3c7", color: "#d97706", icon: Clock },
  inprogress: { bg: "#dbeafe", color: "#2563eb", icon: AlertCircle },
  completed: { bg: "#dcfce7", color: "#16a34a", icon: CheckCircle },
  cancelled: { bg: "#fee2e2", color: "#dc2626", icon: XCircle },
}

const emptyForm = {
  event_name: "", event_start_date: "",
  event_end_date: "", event_budget: ""
}

// Fix date timezone issue — show date as stored, not shifted

const formatDate = (dateStr) => {
  if (!dateStr) return ""
  // Just slice the first 10 characters — no timezone conversion at all!
  return dateStr.slice(0, 10)
}

// Modal defined OUTSIDE component to prevent focus loss
const Modal = ({ title, onClose, children }) => (
  <div
    onClick={onClose}
    style={{
      position: "fixed", inset: 0, background: "#00000055",
      zIndex: 200, display: "flex", alignItems: "center",
      justifyContent: "center", padding: "16px"
    }}
  >
    <div
      onClick={e => e.stopPropagation()}
      style={{
        background: "white", borderRadius: "16px",
        width: "100%", maxWidth: "480px", padding: "24px",
        boxShadow: "0 20px 60px #00000025",
        maxHeight: "90vh", overflowY: "auto"
      }}
    >
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

// StatusBadge defined OUTSIDE component
const StatusBadge = ({ status }) => {
  const s = statusStyles[status] || statusStyles.pending
  const Icon = s.icon
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "5px",
      padding: "4px 10px", borderRadius: "20px",
      fontSize: "12px", fontWeight: "600",
      background: s.bg, color: s.color, whiteSpace: "nowrap"
    }}>
      <Icon size={11} />{status}
    </span>
  )
}


export default function Events() {
  const [events, setEvents] = useState([])
  const [staffList, setStaffList] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [showCreate, setShowCreate] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showAssign, setShowAssign] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [assignUserId, setAssignUserId] = useState("")
  const [formError, setFormError] = useState("")
  const [formLoading, setFormLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState("")
  const [showAssignments, setShowAssignments] = useState(false)
  const [assignments, setAssignments] = useState([])
  const [assignmentsLoading, setAssignmentsLoading] = useState(false)

  const user = JSON.parse(localStorage.getItem("user") || "{}")
  const isManager = user.role === "manager" || user.role === "superadmin"

  const showSuccess = (msg) => {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(""), 3000)
  }

  const fetchEvents = async () => {
    try {
      const res = await api().get("/events")
      console.log("Raw date from API:", res.data.events[0]?.event_start_date)      
      setEvents(res.data.events)
    } catch {
      console.error("Failed to fetch events")
    } finally {
      setLoading(false)
    }
  }
  

  const fetchStaff = async () => {
    try {
      const res = await api().get("/users/staff")
      setStaffList(res.data.staff)
    } catch {
      console.error("Failed to fetch staff")
    }
  }

  useEffect(() => {
    fetchEvents()
    if (isManager) fetchStaff()
  }, [])

  // VALIDATION
// VALIDATION
const validateForm = () => {
    if (!form.event_name.trim()) return "Event name is required"
    if (!form.event_start_date) return "Start date is required"
    if (!form.event_end_date) return "End date is required"
    if (!form.event_budget || Number(form.event_budget) <= 0) return "Budget must be greater than 0"

    const today = new Date().toISOString().split("T")[0]

    if (form.event_start_date < today) return "Start date cannot be in the past"
    if (form.event_end_date < form.event_start_date) return "End date cannot be before start date"
    if (form.event_end_date === form.event_start_date) return "End date must be after start date"

    return null
}

const viewAssignments = async (event) => {
    setSelectedEvent(event)
    setShowAssignments(true)
    setAssignmentsLoading(true)
    try {
        const res = await api().get(`/events/${event.event_id}/assignments`)
        setAssignments(res.data.assignments)
    } catch {
        setAssignments([])
    } finally {
        setAssignmentsLoading(false)
    }
}

  const handleCreate = async () => {
    const error = validateForm()
    if (error) { setFormError(error); return }
    setFormLoading(true)
    setFormError("")
    try {
      await api().post("/events", form)
      setShowCreate(false)
      setForm(emptyForm)
      fetchEvents()
      showSuccess("Event created successfully!")
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to create event")
    } finally {
      setFormLoading(false)
    }
  }

  const handleEdit = async () => {
    const error = validateForm()
    if (error) { setFormError(error); return }
    setFormLoading(true)
    setFormError("")
    try {
      await api().put(`/events/${selectedEvent.event_id}`, form)
      setShowEdit(false)
      fetchEvents()
      showSuccess("Event updated successfully!")
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to update event")
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this event?")) return
    try {
      await api().delete(`/events/${id}`)
      fetchEvents()
      showSuccess("Event deleted successfully!")
    } catch {
      alert("Failed to delete event")
    }
  }

  const handleAssign = async () => {
    if (!assignUserId) { setFormError("Please select a staff member"); return }
    setFormLoading(true)
    setFormError("")
    try {
      await api().post(`/events/${selectedEvent.event_id}/assign`, { user_id: assignUserId })
      setShowAssign(false)
      setAssignUserId("")
      showSuccess("Staff assigned successfully!")
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to assign staff")
    } finally {
      setFormLoading(false)
    }
  }

  const openEdit = (event) => {
    setSelectedEvent(event)
    setForm({
      event_name: event.event_name,
      event_start_date: formatDate(event.event_start_date),
      event_end_date: formatDate(event.event_end_date),
      event_budget: event.event_budget,
      status: event.status
    })
    setFormError("")
    setShowEdit(true)
  }

  const filtered = events.filter(e => {
    const matchSearch = e.event_name.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === "all" || e.status === filterStatus
    return matchSearch && matchStatus
  })

  return (
    <>
      <style>{`
        .ev-page { width: 100%; }
        .ev-header {
          display: flex; align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 20px; gap: 12px; flex-wrap: wrap;
        }
        .ev-toolbar {
          display: flex; gap: 10px;
          margin-bottom: 16px; flex-wrap: wrap;
        }
        .ev-search {
          display: flex; align-items: center; gap: 8px;
          padding: 9px 14px; background: white;
          border: 1px solid #e2e8f0; border-radius: 10px;
          flex: 1; min-width: 0;
        }
        .ev-search input {
          border: none; outline: none; font-size: 14px;
          color: #0f172a; background: transparent; width: 100%;
          min-width: 0;
        }
        .ev-search input::placeholder { color: #94a3b8; }
        .ev-filter {
          padding: 9px 14px; background: white;
          border: 1px solid #e2e8f0; border-radius: 10px;
          font-size: 14px; color: #475569; outline: none; cursor: pointer;
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
        .ev-table-wrap {
          background: white; border-radius: 14px;
          border: 1px solid #f1f5f9; overflow: hidden;
        }
        .ev-table-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
        .ev-table { width: 100%; border-collapse: collapse; min-width: 580px; }
        .ev-table th {
          padding: 11px 14px; text-align: left;
          font-size: 11px; font-weight: 600; color: #94a3b8;
          letter-spacing: 0.5px; text-transform: uppercase;
          background: #f8fafc; border-bottom: 1px solid #f1f5f9;
          white-space: nowrap;
        }
        .ev-table td {
          padding: 13px 14px; font-size: 14px;
          color: #374151; border-bottom: 1px solid #f8fafc;
          vertical-align: middle;
        }
        .ev-table tr:last-child td { border-bottom: none; }
        .ev-table tr:hover td { background: #fafafa; }
        .ev-actions { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
        .ev-cards { display: none; padding: 12px; gap: 10px; flex-direction: column; }
        .ev-card {
          background: white; border-radius: 12px;
          border: 1px solid #f1f5f9; padding: 16px;
          box-shadow: 0 1px 4px #0000000a;
        }
        .ev-card-top {
          display: flex; align-items: flex-start;
          justify-content: space-between; gap: 8px; margin-bottom: 12px;
        }
        .ev-card-name { font-weight: 700; color: #0f172a; font-size: 15px; line-height: 1.3; }
        .ev-card-grid {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 10px; margin-bottom: 12px;
        }
        .ev-card-field-label {
          font-size: 10px; color: #94a3b8; font-weight: 600;
          text-transform: uppercase; letter-spacing: 0.5px;
          display: block; margin-bottom: 2px;
        }
        .ev-card-field-val { font-size: 13px; color: #374151; font-weight: 500; }
        .ev-card-actions { display: flex; gap: 8px; flex-wrap: wrap; }
        .ev-empty { padding: 60px 20px; text-align: center; }
        .success-toast {
          position: fixed; bottom: 24px; right: 24px;
          background: #0f172a; color: white;
          padding: 12px 20px; border-radius: 12px;
          font-size: 14px; font-weight: 500;
          display: flex; align-items: center; gap: 10px;
          box-shadow: 0 8px 24px #00000030;
          z-index: 999; animation: slideUp 0.3s ease;
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
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
          transition: border-color 0.15s; font-family: inherit;
        }
        .mf-input:focus { border-color: #6366f1; background: white; }
        .mf-input.error { border-color: #f87171; background: #fff5f5; }
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
        .staff-option {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 14px; border-radius: 8px;
          cursor: pointer; transition: background 0.1s;
          border: 1.5px solid transparent;
        }
        .staff-option:hover { background: #f8fafc; }
        .staff-option.selected { background: #eef2ff; border-color: #6366f1; }
        .staff-avatar {
          width: 32px; height: 32px; border-radius: 50%;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 700; color: white; flex-shrink: 0;
        }
        .staff-list {
          border: 1.5px solid #e2e8f0; border-radius: 8px;
          max-height: 220px; overflow-y: auto; background: white;
        }
        @media (max-width: 640px) {
          .ev-table-scroll { display: none; }
          .ev-cards { display: flex; }
          .mf-row { grid-template-columns: 1fr; }
          .ev-toolbar { flex-direction: column; }
          .ev-filter { width: 100%; }
          .success-toast { bottom: 16px; right: 16px; left: 16px; }
        }
        @media (max-width: 400px) {
          .ev-card-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* Success Toast */}
      {successMsg && (
        <div className="success-toast">
          <CheckCheck size={16} color="#4ade80" />
          {successMsg}
        </div>
      )}

      <div className="ev-page">
        {/* Header */}
        <div className="ev-header">
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: "700", color: "#0f172a", marginBottom: "4px", letterSpacing: "-0.5px" }}>Events</h1>
            <p style={{ fontSize: "13px", color: "#94a3b8" }}>{filtered.length} event{filtered.length !== 1 ? "s" : ""} found</p>
          </div>
          {isManager && (
            <button className="btn-primary" onClick={() => { setForm(emptyForm); setFormError(""); setShowCreate(true) }}>
              <Plus size={15} /> New Event
            </button>
          )}
        </div>

        {/* Toolbar */}
        <div className="ev-toolbar">
          <div className="ev-search">
            <Search size={15} color="#94a3b8" />
            <input placeholder="Search events..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="ev-filter" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="inprogress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8", background: "white", borderRadius: "14px" }}>Loading events...</div>
        ) : filtered.length === 0 ? (
          <div className="ev-empty" style={{ background: "white", borderRadius: "14px", border: "1px solid #f1f5f9" }}>
            <div style={{ width: "48px", height: "48px", background: "#f1f5f9", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
              <CalendarDays size={22} color="#cbd5e1" />
            </div>
            <p style={{ fontWeight: "600", color: "#64748b", marginBottom: "4px" }}>No events found</p>
            <p style={{ fontSize: "13px", color: "#94a3b8" }}>{isManager ? "Create your first event to get started" : "No events assigned to you yet"}</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="ev-table-wrap">
              <div className="ev-table-scroll">
                <table className="ev-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Event Name</th>
                      <th>Start Date</th>
                      <th>End Date</th>
                      <th>Budget</th>
                      <th>Status</th>
                      {isManager && <th>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((event, i) => (
                      <tr key={event.event_id}>
                        <td style={{ color: "#94a3b8", fontSize: "12px" }}>{i + 1}</td>
                        <td style={{ fontWeight: "600", color: "#0f172a" }}>{event.event_name}</td>
                        <td>{formatDate(event.event_start_date)}</td>
                        <td>{formatDate(event.event_end_date)}</td>
                        <td style={{ fontWeight: "600" }}>{Number(event.event_budget).toLocaleString()} RWF</td>
                        <td><StatusBadge status={event.status} /></td>
                        {isManager && (
                          <td>
                            <div className="ev-actions">
                              <button className="btn-sm" onClick={() => openEdit(event)}><Edit2 size={12} />Edit</button>

                              <button className="btn-sm" onClick={() => viewAssignments(event)}>
                                  <Users size={12} />Team
                              </button>
                              <button className="btn-sm"
                                onClick={() => { setSelectedEvent(event); setAssignUserId(""); setFormError(""); setShowAssign(true) }}
                                disabled={event.status === "cancelled"}
                                style={{ opacity: event.status === "cancelled" ? 0.4 : 1, cursor: event.status === "cancelled" ? "not-allowed" : "pointer" }}
                              >
                                <UserPlus size={12} />Assign
                                
                              </button>
                              <button className="btn-sm-danger" onClick={() => handleDelete(event.event_id)}><Trash2 size={12} /></button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards */}
            <div className="ev-cards">
              {filtered.map(event => (
                <div className="ev-card" key={event.event_id}>
                  <div className="ev-card-top">
                    <p className="ev-card-name">{event.event_name}</p>
                    <StatusBadge status={event.status} />
                  </div>
                  <div className="ev-card-grid">
                    <div>
                      <span className="ev-card-field-label">Start Date</span>
                      <span className="ev-card-field-val">{formatDate(event.event_start_date)}</span>
                    </div>
                    <div>
                      <span className="ev-card-field-label">End Date</span>
                      <span className="ev-card-field-val">{formatDate(event.event_end_date)}</span>
                    </div>
                    <div>
                      <span className="ev-card-field-label">Budget</span>
                      <span className="ev-card-field-val">{Number(event.event_budget).toLocaleString()} RWF</span>
                    </div>
                  </div>
                  {isManager && (
                    <div className="ev-card-actions">
                      <button className="btn-sm" onClick={() => openEdit(event)}><Edit2 size={12} />Edit</button>
                      <button className="btn-sm" onClick={() => viewAssignments(event)}>
                            <Users size={12} />Team
                      </button>
                      <button className="btn-sm"
                        onClick={() => { setSelectedEvent(event); setAssignUserId(""); setFormError(""); setShowAssign(true) }}
                        disabled={event.status === "cancelled"}
                        style={{ opacity: event.status === "cancelled" ? 0.4 : 1, cursor: event.status === "cancelled" ? "not-allowed" : "pointer" }}
                      >
                        <UserPlus size={12} />Assign
                      </button>
                      <button className="btn-sm-danger" onClick={() => handleDelete(event.event_id)}><Trash2 size={12} /></button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* CREATE MODAL */}
      {showCreate && (
        <Modal title="Create New Event" onClose={() => setShowCreate(false)}>
          {formError && <div className="mf-error">{formError}</div>}
          <div className="mf-group">
            <label className="mf-label">Event Name <span style={{ color: "#ef4444" }}>*</span></label>
            <input
              className={`mf-input ${formError && !form.event_name.trim() ? "error" : ""}`}
              placeholder="e.g. Kigali Music Festival"
              value={form.event_name}
              onChange={e => setForm({ ...form, event_name: e.target.value })}
            />
          </div>
          <div className="mf-row">
            <div className="mf-group">
              <label className="mf-label">Start Date <span style={{ color: "#ef4444" }}>*</span></label>
              <input
                type="date"
                className={`mf-input ${formError && !form.event_start_date ? "error" : ""}`}
                value={form.event_start_date}
                onChange={e => setForm({ ...form, event_start_date: e.target.value })}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div className="mf-group">
              <label className="mf-label">End Date <span style={{ color: "#ef4444" }}>*</span></label>
              <input
                type="date"
                className={`mf-input ${formError && !form.event_end_date ? "error" : ""}`}
                value={form.event_end_date}
                onChange={e => setForm({ ...form, event_end_date: e.target.value })}
                min={form.event_start_date || new Date().toISOString().split("T")[0]}
              />
            </div>
          </div>
          <div className="mf-group">
            <label className="mf-label">Budget (RWF) <span style={{ color: "#ef4444" }}>*</span></label>
            <input
              type="number"
              className={`mf-input ${formError && !form.event_budget ? "error" : ""}`}
              placeholder="e.g. 5000000"
              value={form.event_budget}
              onChange={e => setForm({ ...form, event_budget: e.target.value })}
            />
          </div>
          <p style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "4px" }}>
            <span style={{ color: "#ef4444" }}>*</span> Required fields
          </p>
          <div className="mf-footer">
            <button className="mf-cancel" onClick={() => setShowCreate(false)}>Cancel</button>
            <button className="mf-submit" disabled={formLoading} onClick={handleCreate}>
              {formLoading ? "Creating..." : "Create Event"}
            </button>
          </div>
        </Modal>
      )}

      {/* EDIT MODAL */}
      {showEdit && (
        <Modal title="Edit Event" onClose={() => setShowEdit(false)}>
          {formError && <div className="mf-error">{formError}</div>}
          <div className="mf-group">
            <label className="mf-label">Event Name <span style={{ color: "#ef4444" }}>*</span></label>
            <input
              className={`mf-input ${formError && !form.event_name.trim() ? "error" : ""}`}
              value={form.event_name}
              onChange={e => setForm({ ...form, event_name: e.target.value })}
            />
          </div>
          <div className="mf-row">
            <div className="mf-group">
              <label className="mf-label">Start Date <span style={{ color: "#ef4444" }}>*</span></label>
              <input
                type="date"
                className={`mf-input ${formError && !form.event_start_date ? "error" : ""}`}
                value={form.event_start_date}
                onChange={e => setForm({ ...form, event_start_date: e.target.value })}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div className="mf-group">
              <label className="mf-label">End Date <span style={{ color: "#ef4444" }}>*</span></label>
              <input
                type="date"
                className={`mf-input ${formError && !form.event_end_date ? "error" : ""}`}
                value={form.event_end_date}
                onChange={e => setForm({ ...form, event_end_date: e.target.value })}
                min={form.event_start_date || new Date().toISOString().split("T")[0]}
              />
            </div>
          </div>
          <div className="mf-group">
            <label className="mf-label">Budget (RWF) <span style={{ color: "#ef4444" }}>*</span></label>
            <input
              type="number"
              className={`mf-input ${formError && !form.event_budget ? "error" : ""}`}
              value={form.event_budget}
              onChange={e => setForm({ ...form, event_budget: e.target.value })}
            />
          </div>
          <div className="mf-group">
            <label className="mf-label">Status</label>
            <select className="mf-input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
              <option value="pending">Pending</option>
              <option value="inprogress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="mf-footer">
            <button className="mf-cancel" onClick={() => setShowEdit(false)}>Cancel</button>
            <button className="mf-submit" disabled={formLoading} onClick={handleEdit}>
              {formLoading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </Modal>
      )}

      {/* ASSIGN MODAL */}
      {showAssign && (
        <Modal title="Assign Staff to Event" onClose={() => setShowAssign(false)}>
          <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "16px" }}>
            Assigning to: <strong style={{ color: "#0f172a" }}>{selectedEvent?.event_name}</strong>
          </p>
          {formError && <div className="mf-error">{formError}</div>}
          <div className="mf-group">
            <label className="mf-label">Select Staff Member <span style={{ color: "#ef4444" }}>*</span></label>
            <div className="staff-list">
              {staffList.length === 0 ? (
                <p style={{ padding: "16px", color: "#94a3b8", fontSize: "13px", textAlign: "center" }}>No staff members found</p>
              ) : staffList.map(staff => (
                <div
                  key={staff.user_id}
                  className={`staff-option ${assignUserId === staff.user_id ? "selected" : ""}`}
                  onClick={() => setAssignUserId(staff.user_id)}
                >
                  <div className="staff-avatar">{staff.firstname?.charAt(0).toUpperCase()}</div>
                  <div>
                    <p style={{ fontSize: "14px", fontWeight: "600", color: "#0f172a", marginBottom: "2px" }}>
                      {staff.firstname} {staff.lastname}
                    </p>
                    <p style={{ fontSize: "12px", color: "#94a3b8" }}>@{staff.username}</p>
                  </div>
                  {assignUserId === staff.user_id && (
                    <div style={{ marginLeft: "auto", width: "18px", height: "18px", borderRadius: "50%", background: "#6366f1", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <CheckCircle size={12} color="white" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="mf-footer">
            <button className="mf-cancel" onClick={() => setShowAssign(false)}>Cancel</button>
            <button className="mf-submit" disabled={formLoading || !assignUserId} onClick={handleAssign}>
              {formLoading ? "Assigning..." : "Assign Staff"}
            </button>
          </div>
        </Modal>
      )}

      {/* VIEW ASSIGNMENTS MODAL */}
      
      {showAssignments && (
          <Modal title={`Team — ${selectedEvent?.event_name}`} onClose={() => setShowAssignments(false)}>
              {assignmentsLoading ? (
                  <p style={{ textAlign: "center", color: "#94a3b8", padding: "20px" }}>Loading...</p>
              ) : assignments.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "30px 0" }}>
                      <div style={{ width: "44px", height: "44px", background: "#f1f5f9", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                          <Users size={20} color="#cbd5e1" />
                      </div>
                      <p style={{ color: "#64748b", fontWeight: "600", marginBottom: "4px" }}>No staff assigned yet</p>
                      <p style={{ color: "#94a3b8", fontSize: "13px" }}>Use the Assign button to add staff</p>
                  </div>
              ) : (
                  <div>
                      <p style={{ fontSize: "13px", color: "#94a3b8", marginBottom: "16px" }}>
                          {assignments.length} staff member{assignments.length !== 1 ? "s" : ""} assigned
                      </p>
                      {assignments.map(a => (
                          <div key={a.user_id} style={{
                              display: "flex", alignItems: "center", gap: "12px",
                              padding: "10px 14px", borderRadius: "10px",
                              background: "#f8fafc", marginBottom: "8px",
                              border: "1px solid #f1f5f9"
                          }}>
                              <div style={{
                                  width: "36px", height: "36px", borderRadius: "50%",
                                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                  fontSize: "14px", fontWeight: "700", color: "white", flexShrink: 0
                              }}>
                                  {a.firstname?.charAt(0).toUpperCase()}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                  <p style={{ fontWeight: "600", color: "#0f172a", fontSize: "14px", marginBottom: "2px" }}>
                                      {a.firstname} {a.lastname}
                                  </p>
                                  <p style={{ fontSize: "12px", color: "#94a3b8" }}>@{a.username}</p>
                              </div>
                              <span style={{
                                  fontSize: "11px", color: "#94a3b8",
                                  whiteSpace: "nowrap"
                              }}>
                                  {a.assigned_at?.slice(0, 10)}
                              </span>
                          </div>
                      ))}
                  </div>
              )}
              <div className="mf-footer">
                  <button className="mf-cancel" onClick={() => setShowAssignments(false)}>Close</button>
              </div>
          </Modal>
      )}
    </>
  )
}