import { useEffect, useState } from "react"
import axios from "axios"
import {
  Plus, Trash2, Edit2, X, Search,
  BookOpen, Clock, CheckCircle,
  XCircle, AlertCircle, Phone, MapPin, Calendar
} from "lucide-react"

const api = () => axios.create({
  baseURL: "http://localhost:3000/api",
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
})

const statusStyles = {
  pending: { bg: "#fef3c7", color: "#d97706", icon: Clock },
  approved: { bg: "#dcfce7", color: "#16a34a", icon: CheckCircle },
  rejected: { bg: "#fee2e2", color: "#dc2626", icon: XCircle },
  cancelled: { bg: "#f1f5f9", color: "#64748b", icon: AlertCircle },
}

const emptyForm = {
  client_name: "",
  client_phone: "",
  event_type: "",
  event_date: "",
  location: "",
  description: "",
  status: "pending",
  event_id: ""
}

export default function Bookings() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [showCreate, setShowCreate] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState("")
  const [formLoading, setFormLoading] = useState(false)
  const [events, setEvents] = useState([])

  const fetchBookings = async () => {
    try {
      const res = await api().get("/bookings")
      setBookings(res.data)
    } catch {
      console.error("Failed to fetch bookings")
    } finally {
      setLoading(false)
    }
  }

  const fetchEvents = async () => {
    try {
        const res = await api().get("/events")
        setEvents(res.data.events)
    } catch {
        console.error("Failed to fetch events")
    }
}

  useEffect(() => { fetchBookings(); fetchEvents() }, [])

  const handleCreate = async () => {
    setFormLoading(true)
    setFormError("")
    try {
      await api().post("/bookings", form)
      setShowCreate(false)
      setForm(emptyForm)
      fetchBookings()
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to create booking")
    } finally {
      setFormLoading(false)
    }
  }

  const handleEdit = async () => {
    setFormLoading(true)
    setFormError("")
    try {
      await api().put(`/bookings/${selectedBooking.booking_id}`, {
        ...form,
        event_id: form.event_id || null
      })
      setShowEdit(false)
      fetchBookings()
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to update booking")
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this booking?")) return
    try {
      await api().delete(`/bookings/${id}`)
      fetchBookings()
    } catch {
      alert("Failed to delete booking")
    }
  }

  const openEdit = (booking) => {
    setSelectedBooking(booking)
    setForm({
      client_name: booking.client_name,
      client_phone: booking.client_phone,
      event_type: booking.event_type,
      event_date: booking.event_date?.split("T")[0],
      location: booking.location,
      description: booking.description || "",
      status: booking.status,
      event_id: booking.event_id || ""
    })
    setFormError("")
    setShowEdit(true)
  }

  const filtered = bookings.filter(b => {
    const matchSearch =
      b.client_name.toLowerCase().includes(search.toLowerCase()) ||
      b.event_type.toLowerCase().includes(search.toLowerCase()) ||
      b.location.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === "all" || b.status === filterStatus
    return matchSearch && matchStatus
  })

  const total = bookings.length
  const pending = bookings.filter(b => b.status === "pending").length
  const approved = bookings.filter(b => b.status === "approved").length
  const rejected = bookings.filter(b => b.status === "rejected").length

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

  return (
    <>
      <style>{`
        .bk-header {
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
        .bk-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px; margin-bottom: 20px;
        }
        .bk-stat {
          background: white; border-radius: 12px;
          border: 1px solid #f1f5f9; padding: 16px;
          text-align: center;
        }
        .bk-stat-val {
          font-size: 24px; font-weight: 700;
          color: #0f172a; margin-bottom: 4px;
        }
        .bk-stat-label { font-size: 12px; color: #94a3b8; }
        .bk-toolbar {
          display: flex; gap: 10px;
          margin-bottom: 16px; flex-wrap: wrap;
        }
        .bk-search {
          display: flex; align-items: center; gap: 8px;
          padding: 9px 14px; background: white;
          border: 1px solid #e2e8f0; border-radius: 10px;
          flex: 1; min-width: 0;
        }
        .bk-search input {
          border: none; outline: none; font-size: 14px;
          color: #0f172a; background: transparent; width: 100%;
        }
        .bk-search input::placeholder { color: #94a3b8; }
        .bk-filter {
          padding: 9px 14px; background: white;
          border: 1px solid #e2e8f0; border-radius: 10px;
          font-size: 14px; color: #475569; outline: none; cursor: pointer;
        }
        .bk-table-wrap {
          background: white; border-radius: 14px;
          border: 1px solid #f1f5f9; overflow: hidden;
        }
        .bk-table-scroll { overflow-x: auto; }
        .bk-table { width: 100%; border-collapse: collapse; min-width: 640px; }
        .bk-table th {
          padding: 11px 14px; text-align: left;
          font-size: 11px; font-weight: 600; color: #94a3b8;
          letter-spacing: 0.5px; text-transform: uppercase;
          background: #f8fafc; border-bottom: 1px solid #f1f5f9;
          white-space: nowrap;
        }
        .bk-table td {
          padding: 13px 14px; font-size: 14px;
          color: #374151; border-bottom: 1px solid #f8fafc;
          vertical-align: middle;
        }
        .bk-table tr:last-child td { border-bottom: none; }
        .bk-table tr:hover td { background: #fafafa; }
        .bk-actions { display: flex; gap: 6px; align-items: center; }
        .bk-cards { display: none; padding: 12px; gap: 10px; flex-direction: column; }
        .bk-card {
          background: white; border-radius: 12px;
          border: 1px solid #f1f5f9; padding: 16px;
          box-shadow: 0 1px 4px #0000000a;
        }
        .bk-card-top {
          display: flex; align-items: flex-start;
          justify-content: space-between; gap: 8px; margin-bottom: 12px;
        }
        .bk-card-name { font-weight: 700; color: #0f172a; font-size: 15px; }
        .bk-card-type { font-size: 12px; color: #6366f1; font-weight: 600; margin-top: 2px; }
        .bk-card-info { display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; }
        .bk-card-info-row { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #64748b; }
        .bk-card-actions { display: flex; gap: 8px; flex-wrap: wrap; }
        .bk-empty { padding: 60px 20px; text-align: center; }
        .modal-overlay {
          position: fixed; inset: 0; background: #00000055;
          zIndex: 200; display: flex; align-items: center;
          justify-content: center; padding: 16px;
        }
        .modal-box {
          background: white; border-radius: 16px;
          width: 100%; max-width: 520px; padding: 24px;
          box-shadow: 0 20px 60px #00000025;
          max-height: 90vh; overflow-y: auto;
        }
        .modal-header {
          display: flex; align-items: center;
          justify-content: space-between; margin-bottom: 20px;
        }
        .modal-title { font-size: 18px; font-weight: 700; color: #0f172a; }
        .modal-close {
          background: none; border: none; cursor: pointer;
          color: #94a3b8; padding: 4px; border-radius: 6px;
          display: flex; align-items: center;
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
        @media (max-width: 900px) {
          .bk-stats { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 640px) {
          .bk-table-scroll { display: none; }
          .bk-cards { display: flex; }
          .bk-toolbar { flex-direction: column; }
          .bk-filter { width: 100%; }
          .mf-row { grid-template-columns: 1fr; }
          .bk-stats { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>

      <div>
        {/* Header */}
        <div className="bk-header">
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: "700", color: "#0f172a", marginBottom: "4px", letterSpacing: "-0.5px" }}>Bookings</h1>
            <p style={{ fontSize: "13px", color: "#94a3b8" }}>{filtered.length} booking{filtered.length !== 1 ? "s" : ""} found</p>
          </div>
          <button className="btn-primary" onClick={() => { setForm(emptyForm); setFormError(""); setShowCreate(true) }}>
            <Plus size={15} /> New Booking
          </button>
        </div>

        {/* Stats */}
        <div className="bk-stats">
          {[
            { label: "Total", value: total, color: "#6366f1" },
            { label: "Pending", value: pending, color: "#d97706" },
            { label: "Approved", value: approved, color: "#16a34a" },
            { label: "Rejected", value: rejected, color: "#dc2626" },
          ].map((s, i) => (
            <div className="bk-stat" key={i}>
              <p className="bk-stat-val" style={{ color: s.color }}>{s.value}</p>
              <p className="bk-stat-label">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="bk-toolbar">
          <div className="bk-search">
            <Search size={15} color="#94a3b8" />
            <input placeholder="Search by client, event type or location..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="bk-filter" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8", background: "white", borderRadius: "14px" }}>Loading bookings...</div>
        ) : filtered.length === 0 ? (
          <div className="bk-empty" style={{ background: "white", borderRadius: "14px", border: "1px solid #f1f5f9" }}>
            <div style={{ width: "48px", height: "48px", background: "#f1f5f9", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
              <BookOpen size={22} color="#cbd5e1" />
            </div>
            <p style={{ fontWeight: "600", color: "#64748b", marginBottom: "4px" }}>No bookings found</p>
            <p style={{ fontSize: "13px", color: "#94a3b8" }}>Create your first booking to get started</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="bk-table-wrap">
              <div className="bk-table-scroll">
                <table className="bk-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Client Name</th>
                      <th>Phone</th>
                      <th>Event Type</th>
                      <th>Event Date</th>
                      <th>Location</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((booking, i) => (
                      <tr key={booking.booking_id}>
                        <td style={{ color: "#94a3b8", fontSize: "12px" }}>{i + 1}</td>
                        <td style={{ fontWeight: "600", color: "#0f172a" }}>{booking.client_name}</td>
                        <td>{booking.client_phone}</td>
                        <td>
                          <span style={{ padding: "3px 10px", background: "#eef2ff", color: "#6366f1", borderRadius: "20px", fontSize: "12px", fontWeight: "600" }}>
                            {booking.event_type}
                          </span>
                        </td>
                        <td>{booking.event_date?.split("T")[0]}</td>
                        <td>{booking.location}</td>
                        <td><StatusBadge status={booking.status} /></td>
                        <td>
                          <div className="bk-actions">
                            <button className="btn-sm" onClick={() => openEdit(booking)}><Edit2 size={12} />Edit</button>
                            <button className="btn-sm-danger" onClick={() => handleDelete(booking.booking_id)}><Trash2 size={12} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards */}
            <div className="bk-cards">
              {filtered.map(booking => (
                <div className="bk-card" key={booking.booking_id}>
                  <div className="bk-card-top">
                    <div>
                      <p className="bk-card-name">{booking.client_name}</p>
                      <p className="bk-card-type">{booking.event_type}</p>
                    </div>
                    <StatusBadge status={booking.status} />
                  </div>
                  <div className="bk-card-info">
                    <div className="bk-card-info-row"><Phone size={13} color="#94a3b8" />{booking.client_phone}</div>
                    <div className="bk-card-info-row"><Calendar size={13} color="#94a3b8" />{booking.event_date?.split("T")[0]}</div>
                    <div className="bk-card-info-row"><MapPin size={13} color="#94a3b8" />{booking.location}</div>
                  </div>
                  <div className="bk-card-actions">
                    <button className="btn-sm" onClick={() => openEdit(booking)}><Edit2 size={12} />Edit</button>
                    <button className="btn-sm-danger" onClick={() => handleDelete(booking.booking_id)}><Trash2 size={12} /></button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* CREATE MODAL — form fields inline, NOT in a sub-component */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)} style={{ position: "fixed", inset: 0, background: "#00000055", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <p className="modal-title">New Booking</p>
              <button className="modal-close" onClick={() => setShowCreate(false)}><X size={18} /></button>
            </div>
            {formError && <div className="mf-error">{formError}</div>}
            <div className="mf-row">
              <div className="mf-group">
                <label className="mf-label">Client Name</label>
                <input className="mf-input" placeholder="e.g. Shukuru Kamanzi" value={form.client_name} onChange={e => setForm({ ...form, client_name: e.target.value })} />
              </div>
              <div className="mf-group">
                <label className="mf-label">Client Phone</label>
                <input className="mf-input" placeholder="+250 788 000 000" value={form.client_phone} onChange={e => setForm({ ...form, client_phone: e.target.value })} />
              </div>
            </div>
            <div className="mf-row">
              <div className="mf-group">
                <label className="mf-label">Event Type</label>
                <select className="mf-input" value={form.event_type} onChange={e => setForm({ ...form, event_type: e.target.value })}>
                  <option value="">Select type...</option>
                  <option value="Wedding">Wedding</option>
                  <option value="Concert">Concert</option>
                  <option value="Corporate">Corporate</option>
                  <option value="Birthday">Birthday</option>
                  <option value="Conference">Conference</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="mf-group">
                <label className="mf-label">Event Date</label>
                <input type="date" className="mf-input" value={form.event_date} onChange={e => setForm({ ...form, event_date: e.target.value })} />
              </div>
            </div>
            <div className="mf-group">
              <label className="mf-label">Location</label>
              <input className="mf-input" placeholder="e.g. Kigali Convention Center" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
            </div>
            <div className="mf-group">
              <label className="mf-label">Description <span style={{ color: "#94a3b8", fontWeight: "400" }}>(optional)</span></label>
              <textarea className="mf-input" placeholder="Additional details..." rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ resize: "vertical" }} />
            </div>
            <div className="mf-footer">
              <button className="mf-cancel" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="mf-submit" disabled={formLoading} onClick={handleCreate}>{formLoading ? "Creating..." : "Create Booking"}</button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL — form fields inline too */}
      {showEdit && (
        <div className="modal-overlay" onClick={() => setShowEdit(false)} style={{ position: "fixed", inset: 0, background: "#00000055", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <p className="modal-title">Edit Booking</p>
              <button className="modal-close" onClick={() => setShowEdit(false)}><X size={18} /></button>
            </div>
            {formError && <div className="mf-error">{formError}</div>}
            <div className="mf-row">
              <div className="mf-group">
                <label className="mf-label">Client Name</label>
                <input className="mf-input" value={form.client_name} onChange={e => setForm({ ...form, client_name: e.target.value })} />
              </div>
              <div className="mf-group">
                <label className="mf-label">Client Phone</label>
                <input className="mf-input" value={form.client_phone} onChange={e => setForm({ ...form, client_phone: e.target.value })} />
              </div>
            </div>
            <div className="mf-row">
              <div className="mf-group">
                <label className="mf-label">Event Type</label>
                <select className="mf-input" value={form.event_type} onChange={e => setForm({ ...form, event_type: e.target.value })}>
                  <option value="">Select type...</option>
                  <option value="Wedding">Wedding</option>
                  <option value="Concert">Concert</option>
                  <option value="Corporate">Corporate</option>
                  <option value="Birthday">Birthday</option>
                  <option value="Conference">Conference</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="mf-group">
                <label className="mf-label">Event Date</label>
                <input type="date" className="mf-input" value={form.event_date} onChange={e => setForm({ ...form, event_date: e.target.value })} />
              </div>
            </div>
            <div className="mf-group">
              <label className="mf-label">Location</label>
              <input className="mf-input" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
            </div>
            <div className="mf-group">
              <label className="mf-label">Description <span style={{ color: "#94a3b8", fontWeight: "400" }}>(optional)</span></label>
              <textarea className="mf-input" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ resize: "vertical" }} />
            </div>
            <div className="mf-group">
              <label className="mf-label">Status</label>
              <select className="mf-input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
              <div className="mf-group">
                <label className="mf-label">Link to Event <span style={{ color: "#94a3b8", fontWeight: "400" }}>(optional — after approval)</span></label>
                  <select className="mf-input" value={form.event_id} onChange={e => setForm({ ...form, event_id: e.target.value })}>
                      <option value="">No event linked yet</option>
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
          </div>
        </div>
      )}
    </>
  )
}