import { useEffect, useState } from "react"
import axios from "axios"
import {Plus, Trash2, Edit2, UserPlus, X,CheckSquare, Clock, CheckCircle,XCircle, AlertCircle, Search} from "lucide-react"

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

const emptyForm = { task_name: "", task_deadline: "", event_id: "" }

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


export default function Tasks() {
  const [tasks, setTasks] = useState([])
  const [staffList, setStaffList] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [showCreate, setShowCreate] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showAssign, setShowAssign] = useState(false)
  const [selectedTask, setSelectedTask] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [assignUserId, setAssignUserId] = useState("")
  const [formError, setFormError] = useState("")
  const [formLoading, setFormLoading] = useState(false)
  const [events, setEvents] = useState([])

  const user = JSON.parse(localStorage.getItem("user") || "{}")
  const isManager = user.role === "manager" || user.role === "superadmin"
  const isStaff = user.role === "staff"

  const fetchTasks = async () => {
    try {
      const res = await api().get("/tasks")
      setTasks(res.data.tasks)
    } catch {
      console.error("Failed to fetch tasks")
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

  const fetchEvents = async () => {
    try {
        const res = await api().get("/events")
        setEvents(res.data.events.filter(e =>
            e.status === "pending" || e.status === "inprogress"
        ))
    } catch {
        console.error("Failed to fetch events")
    }
}

  useEffect(() => {
    fetchTasks()
    if (isManager) {
      fetchStaff()
      fetchEvents()
    }
  }, [])

  const handleCreate = async () => {
    setFormLoading(true)
    setFormError("")
    try {
      await api().post("/tasks", { ...form, event_id: form.event_id || null })
      setShowCreate(false)
      setForm(emptyForm)
      fetchTasks()
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to create task")
    } finally {
      setFormLoading(false)
    }
  }

  const handleEdit = async () => {
    setFormLoading(true)
    setFormError("")
    try {
      await api().put(`/tasks/${selectedTask.task_id}`, form)
      setShowEdit(false)
      fetchTasks()
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to update task")
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this task?")) return
    try {
      await api().delete(`/tasks/${id}`)
      fetchTasks()
    } catch {
      alert("Failed to delete task")
    }
  }

  const handleAssign = async () => {
    setFormLoading(true)
    setFormError("")
    try {
      await api().post(`/tasks/${selectedTask.task_id}/assign`, { user_id: assignUserId })
      setShowAssign(false)
      setAssignUserId("")
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to assign staff")
    } finally {
      setFormLoading(false)
    }
  }

  const handleProgressUpdate = async (task, newProgress) => {
    try {
      await api().put(`/tasks/${task.task_id}`, { track_progress: newProgress })
      fetchTasks()
    } catch {
      alert("Failed to update progress")
    }
  }

  const openEdit = (task) => {
    setSelectedTask(task)
    setForm({
      task_name: task.task_name,
      task_deadline: task.task_deadline?.split("T")[0],
      track_progress: task.track_progress,
      event_id: task.event_id || ""
    })
    setFormError("")
    setShowEdit(true)
  }

  const filtered = tasks.filter(t => {
    const matchSearch = t.task_name.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === "all" || t.track_progress === filterStatus
    return matchSearch && matchStatus
  })

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
        .tk-header {
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
        .tk-toolbar {
          display: flex; gap: 10px;
          margin-bottom: 16px; flex-wrap: wrap;
        }
        .tk-search {
          display: flex; align-items: center; gap: 8px;
          padding: 9px 14px; background: white;
          border: 1px solid #e2e8f0; border-radius: 10px;
          flex: 1; min-width: 0;
        }
        .tk-search input {
          border: none; outline: none; font-size: 14px;
          color: #0f172a; background: transparent; width: 100%;
        }
        .tk-search input::placeholder { color: #94a3b8; }
        .tk-filter {
          padding: 9px 14px; background: white;
          border: 1px solid #e2e8f0; border-radius: 10px;
          font-size: 14px; color: #475569; outline: none; cursor: pointer;
        }

        /* TABLE */
        .tk-table-wrap {
          background: white; border-radius: 14px;
          border: 1px solid #f1f5f9; overflow: hidden;
        }
        .tk-table-scroll { overflow-x: auto; }
        .tk-table { width: 100%; border-collapse: collapse; min-width: 580px; }
        .tk-table th {
          padding: 11px 14px; text-align: left;
          font-size: 11px; font-weight: 600; color: #94a3b8;
          letter-spacing: 0.5px; text-transform: uppercase;
          background: #f8fafc; border-bottom: 1px solid #f1f5f9;
          white-space: nowrap;
        }
        .tk-table td {
          padding: 13px 14px; font-size: 14px;
          color: #374151; border-bottom: 1px solid #f8fafc;
          vertical-align: middle;
        }
        .tk-table tr:last-child td { border-bottom: none; }
        .tk-table tr:hover td { background: #fafafa; }
        .tk-actions { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }

        /* MOBILE CARDS */
        .tk-cards { display: none; padding: 12px; gap: 10px; flex-direction: column; }
        .tk-card {
          background: white; border-radius: 12px;
          border: 1px solid #f1f5f9; padding: 16px;
          box-shadow: 0 1px 4px #0000000a;
        }
        .tk-card-top {
          display: flex; align-items: flex-start;
          justify-content: space-between; gap: 8px; margin-bottom: 12px;
        }
        .tk-card-name { font-weight: 700; color: #0f172a; font-size: 15px; }
        .tk-card-grid {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 10px; margin-bottom: 12px;
        }
        .tk-card-label {
          font-size: 10px; color: #94a3b8; font-weight: 600;
          text-transform: uppercase; letter-spacing: 0.5px;
          display: block; margin-bottom: 2px;
        }
        .tk-card-val { font-size: 13px; color: #374151; font-weight: 500; }
        .tk-card-actions { display: flex; gap: 8px; flex-wrap: wrap; }

        /* PROGRESS SELECT for staff */
        .progress-select {
          padding: 5px 10px; border-radius: 8px;
          border: 1px solid #e2e8f0; font-size: 12px;
          color: #475569; background: #f8fafc;
          outline: none; cursor: pointer;
        }

        /* EMPTY */
        .tk-empty { padding: 60px 20px; text-align: center; }

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
        .staff-list {
          border: 1.5px solid #e2e8f0; border-radius: 8px;
          max-height: 220px; overflow-y: auto; background: white;
        }
        .staff-option {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 14px; cursor: pointer;
          transition: background 0.1s;
          border: 1.5px solid transparent; border-radius: 8px;
        }
        .staff-option:hover { background: #f8fafc; }
        .staff-option.selected { background: #eef2ff; border-color: #6366f1; }
        .staff-avatar {
          width: 32px; height: 32px; border-radius: 50%;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 700; color: white; flex-shrink: 0;
        }

        /* RESPONSIVE */
        @media (max-width: 640px) {
          .tk-table-scroll { display: none; }
          .tk-cards { display: flex; }
          .tk-toolbar { flex-direction: column; }
          .tk-filter { width: 100%; }
        }
        @media (max-width: 400px) {
          .tk-card-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div>
        {/* Header */}
        <div className="tk-header">
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: "700", color: "#0f172a", marginBottom: "4px", letterSpacing: "-0.5px" }}>Tasks</h1>
            <p style={{ fontSize: "13px", color: "#94a3b8" }}>{filtered.length} task{filtered.length !== 1 ? "s" : ""} found</p>
          </div>
          {isManager && (
            <button className="btn-primary" onClick={() => { setForm(emptyForm); setFormError(""); setShowCreate(true) }}>
              <Plus size={15} /> New Task
            </button>
          )}
        </div>

        {/* Toolbar */}
        <div className="tk-toolbar">
          <div className="tk-search">
            <Search size={15} color="#94a3b8" />
            <input placeholder="Search tasks..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="tk-filter" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="inprogress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8", background: "white", borderRadius: "14px" }}>Loading tasks...</div>
        ) : filtered.length === 0 ? (
          <div className="tk-empty" style={{ background: "white", borderRadius: "14px", border: "1px solid #f1f5f9" }}>
            <div style={{ width: "48px", height: "48px", background: "#f1f5f9", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
              <CheckSquare size={22} color="#cbd5e1" />
            </div>
            <p style={{ fontWeight: "600", color: "#64748b", marginBottom: "4px" }}>No tasks found</p>
            <p style={{ fontSize: "13px", color: "#94a3b8" }}>{isManager ? "Create your first task" : "No tasks assigned to you yet"}</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="tk-table-wrap">
              <div className="tk-table-scroll">
                <table className="tk-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Task Name</th>
                      <th>Deadline</th>
                      <th>Event ID</th>
                      <th>Progress</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((task, i) => (
                      <tr key={task.task_id}>
                        <td style={{ color: "#94a3b8", fontSize: "12px" }}>{i + 1}</td>
                        <td style={{ fontWeight: "600", color: "#0f172a" }}>{task.task_name}</td>
                        <td>{task.task_deadline?.split("T")[0]}</td>
                        <td>{task.event_id || <span style={{ color: "#cbd5e1" }}>—</span>}</td>
                        <td><StatusBadge status={task.track_progress} /></td>
                        <td>
                          <div className="tk-actions">
                            {isStaff && (
                              <select
                                className="progress-select"
                                value={task.track_progress}
                                onChange={e => handleProgressUpdate(task, e.target.value)}
                              >
                                <option value="pending">Pending</option>
                                <option value="inprogress">In Progress</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                            )}
                            {isManager && (
                              <>
                                <button className="btn-sm" onClick={() => openEdit(task)}><Edit2 size={12} />Edit</button>
                                <button className="btn-sm"
                                    onClick={() => { setSelectedTask(task); setAssignUserId(""); setFormError(""); setShowAssign(true) }}
                                    disabled={task.track_progress === "cancelled"}
                                    style={{ opacity: task.track_progress === "cancelled" ? 0.4 : 1, cursor: task.track_progress === "cancelled" ? "not-allowed" : "pointer" }}>
                                    <UserPlus size={12} />Assign
                                  </button>
                                <button className="btn-sm-danger" onClick={() => handleDelete(task.task_id)}><Trash2 size={12} /></button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards */}
            <div className="tk-cards">
              {filtered.map(task => (
                <div className="tk-card" key={task.task_id}>
                  <div className="tk-card-top">
                    <p className="tk-card-name">{task.task_name}</p>
                    <StatusBadge status={task.track_progress} />
                  </div>
                  <div className="tk-card-grid">
                    <div>
                      <span className="tk-card-label">Deadline</span>
                      <span className="tk-card-val">{task.task_deadline?.split("T")[0]}</span>
                    </div>
                    <div>
                      <span className="tk-card-label">Event</span>
                      <span className="tk-card-val">{task.event_id || "—"}</span>
                    </div>
                  </div>
                  <div className="tk-card-actions">
                    {isStaff && (
                      <select
                        className="progress-select"
                        value={task.track_progress}
                        onChange={e => handleProgressUpdate(task, e.target.value)}
                      >
                        <option value="pending">Pending</option>
                        <option value="inprogress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    )}
                    {isManager && (
                      <>
                        <button className="btn-sm" onClick={() => openEdit(task)}><Edit2 size={12} />Edit</button>
                          <button className="btn-sm"
                            onClick={() => { setSelectedTask(task); setAssignUserId(""); setFormError(""); setShowAssign(true) }}
                            disabled={task.track_progress === "cancelled"}
                            style={{ opacity: task.track_progress === "cancelled" ? 0.4 : 1, cursor: task.track_progress === "cancelled" ? "not-allowed" : "pointer" }}
                          >
                            <UserPlus size={12} />Assign
                          </button>                        
                        <button className="btn-sm-danger" onClick={() => handleDelete(task.task_id)}><Trash2 size={12} /></button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* CREATE MODAL */}
      {showCreate && (
        <Modal title="Create New Task" onClose={() => setShowCreate(false)}>
          {formError && <div className="mf-error">{formError}</div>}
          <div className="mf-group">
            <label className="mf-label">Task Name</label>
            <input className="mf-input" placeholder="e.g. Setup Stage Lighting" value={form.task_name} onChange={e => setForm({ ...form, task_name: e.target.value })} />
          </div>
          <div className="mf-group">
            <label className="mf-label">Deadline</label>
            <input type="date" className="mf-input" value={form.task_deadline} onChange={e => setForm({ ...form, task_deadline: e.target.value })} />
          </div>

          <div className="mf-group">
              <label className="mf-label">Link to Event <span style={{ color: "#94a3b8", fontWeight: "400" }}>(optional)</span></label>
              <select className="mf-input" value={form.event_id} onChange={e => setForm({ ...form, event_id: e.target.value })}>
                  <option value="">Select the Event to Link if applicable</option>
                  {events.map(event => (
                      <option key={event.event_id} value={event.event_id}>
                          {event.event_name} — {event.event_start_date?.slice(0, 10)}
                      </option>
                  ))}
              </select>
          </div>

          <div className="mf-footer">
            <button className="mf-cancel" onClick={() => setShowCreate(false)}>Cancel</button>
            <button className="mf-submit" disabled={formLoading} onClick={handleCreate}>{formLoading ? "Creating..." : "Create Task"}</button>
          </div>
        </Modal>
      )}

      {/* EDIT MODAL */}
      {showEdit && (
        <Modal title="Edit Task" onClose={() => setShowEdit(false)}>
          {formError && <div className="mf-error">{formError}</div>}
          <div className="mf-group">
            <label className="mf-label">Task Name</label>
            <input className="mf-input" value={form.task_name} onChange={e => setForm({ ...form, task_name: e.target.value })} />
          </div>
          <div className="mf-group">
            <label className="mf-label">Deadline</label>
            <input type="date" className="mf-input" value={form.task_deadline} onChange={e => setForm({ ...form, task_deadline: e.target.value })} />
          </div>
          <div className="mf-group">
            <label className="mf-label">Progress</label>
            <select className="mf-input" value={form.track_progress} onChange={e => setForm({ ...form, track_progress: e.target.value })}>
              <option value="pending">Pending</option>
              <option value="inprogress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="mf-footer">
            <button className="mf-cancel" onClick={() => setShowEdit(false)}>Cancel</button>
            <button className="mf-submit" disabled={formLoading} onClick={handleEdit}>{formLoading ? "Saving..." : "Save Changes"}</button>
          </div>
        </Modal>
      )}

      {/* ASSIGN MODAL */}
      {showAssign && (
        <Modal title="Assign Staff to Task" onClose={() => setShowAssign(false)}>
          <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "16px" }}>
            Assigning to: <strong style={{ color: "#0f172a" }}>{selectedTask?.task_name}</strong>
          </p>
          {formError && <div className="mf-error">{formError}</div>}
          <div className="mf-group">
            <label className="mf-label">Select Staff Member</label>
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
                    <p style={{ fontSize: "14px", fontWeight: "600", color: "#0f172a", marginBottom: "2px" }}>{staff.firstname} {staff.lastname}</p>
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
            <button className="mf-submit" disabled={formLoading || !assignUserId} onClick={handleAssign}>{formLoading ? "Assigning..." : "Assign Staff"}</button>
          </div>
        </Modal>
      )}
    </>
  )
}