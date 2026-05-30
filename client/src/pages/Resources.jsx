import { useEffect, useState } from "react"
import axios from "axios"
import {
  Plus, Trash2, Edit2, X, Search,
  Package, CheckCircle, AlertCircle,
  RotateCcw, Link2, Eye
} from "lucide-react"

const api = () => axios.create({
  baseURL: "http://localhost:3000/api",
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
})

const statusStyles = {
  available: { bg: "#dcfce7", color: "#16a34a", icon: CheckCircle },
  inuse: { bg: "#dbeafe", color: "#2563eb", icon: AlertCircle },
  damaged: { bg: "#fee2e2", color: "#dc2626", icon: AlertCircle },
}

const emptyForm = {
  resource_name: "",
  resource_category: "",
  resource_serialNumber: ""
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

export default function Resources() {
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [showCreate, setShowCreate] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showAssign, setShowAssign] = useState(false)
  const [selectedResource, setSelectedResource] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [assignEventId, setAssignEventId] = useState("")
  const [formError, setFormError] = useState("")
  const [formLoading, setFormLoading] = useState(false)
  const [events, setEvents] = useState([])
  const [showAssignment, setShowAssignment] = useState(false)
  const [currentAssignment, setCurrentAssignment] = useState(null)
  const [assignmentLoading, setAssignmentLoading] = useState(false)

  const user = JSON.parse(localStorage.getItem("user") || "{}")
  const isManager = user.role === "manager" || user.role === "superadmin"

  const fetchResources = async () => {
    try {
      const res = await api().get("/resources")
      setResources(res.data.resources)
    } catch {
      console.error("Failed to fetch resources")
    } finally {
      setLoading(false)
    }
  }
   
  const fetchEvents = async () => {
    try {
        const res = await api().get("/events")
        // Only show pending and inprogress events
        setEvents(res.data.events.filter(e => 
            e.status === "pending" || e.status === "inprogress"
        ))
    } catch {
        console.error("Failed to fetch events")
    }
}

 const viewAssignment = async (resource) => {
    setSelectedResource(resource)
    setShowAssignment(true)
    setAssignmentLoading(true)
    try {
        const res = await api().get(`/resources/${resource.resource_id}/assignment`)
        setCurrentAssignment(res.data.assignment)
    } catch {
        setCurrentAssignment(null)
    } finally {
        setAssignmentLoading(false)
    }
}

useEffect(() => {
    fetchResources()
    if (isManager) fetchEvents()  // ← add this
}, [])

  useEffect(() => { fetchResources() }, [])

  const handleCreate = async () => {
    setFormLoading(true)
    setFormError("")
    try {
      await api().post("/resources", form)
      setShowCreate(false)
      setForm(emptyForm)
      fetchResources()
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to create resource")
    } finally {
      setFormLoading(false)
    }
  }

  const handleEdit = async () => {
    setFormLoading(true)
    setFormError("")
    try {
      await api().put(`/resources/${selectedResource.resource_id}`, form)
      setShowEdit(false)
      fetchResources()
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to update resource")
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this resource?")) return
    try {
      await api().delete(`/resources/${id}`)
      fetchResources()
    } catch {
      alert("Failed to delete resource")
    }
  }

  const handleAssign = async () => {
    setFormLoading(true)
    setFormError("")
    try {
      await api().post(`/resources/${selectedResource.resource_id}/assign`, { event_id: assignEventId })
      setShowAssign(false)
      setAssignEventId("")
      fetchResources()
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to assign resource")
    } finally {
      setFormLoading(false)
    }
  }

  const handleReturn = async (id) => {
    if (!window.confirm("Mark this resource as returned?")) return
    try {
      await api().post(`/resources/${id}/return`)
      fetchResources()
    } catch {
      alert("Failed to return resource")
    }
  }

  const openEdit = (resource) => {
    setSelectedResource(resource)
    setForm({
      resource_name: resource.resource_name,
      resource_category: resource.resource_category,
      resource_serialNumber: resource.resource_serialNumber,
      resource_status: resource.resource_status
    })
    setFormError("")
    setShowEdit(true)
  }

  const filtered = resources.filter(r => {
    const matchSearch =
      r.resource_name.toLowerCase().includes(search.toLowerCase()) ||
      r.resource_category.toLowerCase().includes(search.toLowerCase()) ||
      r.resource_serialNumber.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === "all" || r.resource_status === filterStatus
    return matchSearch && matchStatus
  })

  // Stats
  const total = resources.length
  const available = resources.filter(r => r.resource_status === "available").length
  const inuse = resources.filter(r => r.resource_status === "inuse").length
  const damaged = resources.filter(r => r.resource_status === "damaged").length

  const StatusBadge = ({ status }) => {
    const s = statusStyles[status] || statusStyles.available
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
        .rs-header {
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
        .btn-sm-success {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 6px 10px; border-radius: 7px;
          font-size: 12px; font-weight: 500; cursor: pointer;
          border: 1px solid #bbf7d0; background: #f0fdf4; color: #16a34a;
          white-space: nowrap;
        }

        /* STATS */
        .rs-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px; margin-bottom: 20px;
        }
        .rs-stat {
          background: white; border-radius: 12px;
          border: 1px solid #f1f5f9; padding: 16px;
          text-align: center;
        }
        .rs-stat-val {
          font-size: 24px; font-weight: 700;
          color: #0f172a; margin-bottom: 4px;
        }
        .rs-stat-label { font-size: 12px; color: #94a3b8; font-weight: 500; }

        /* TOOLBAR */
        .rs-toolbar {
          display: flex; gap: 10px;
          margin-bottom: 16px; flex-wrap: wrap;
        }
        .rs-search {
          display: flex; align-items: center; gap: 8px;
          padding: 9px 14px; background: white;
          border: 1px solid #e2e8f0; border-radius: 10px;
          flex: 1; min-width: 0;
        }
        .rs-search input {
          border: none; outline: none; font-size: 14px;
          color: #0f172a; background: transparent; width: 100%;
        }
        .rs-search input::placeholder { color: #94a3b8; }
        .rs-filter {
          padding: 9px 14px; background: white;
          border: 1px solid #e2e8f0; border-radius: 10px;
          font-size: 14px; color: #475569; outline: none; cursor: pointer;
        }

        /* TABLE */
        .rs-table-wrap {
          background: white; border-radius: 14px;
          border: 1px solid #f1f5f9; overflow: hidden;
        }
        .rs-table-scroll { overflow-x: auto; }
        .rs-table { width: 100%; border-collapse: collapse; min-width: 580px; }
        .rs-table th {
          padding: 11px 14px; text-align: left;
          font-size: 11px; font-weight: 600; color: #94a3b8;
          letter-spacing: 0.5px; text-transform: uppercase;
          background: #f8fafc; border-bottom: 1px solid #f1f5f9;
          white-space: nowrap;
        }
        .rs-table td {
          padding: 13px 14px; font-size: 14px;
          color: #374151; border-bottom: 1px solid #f8fafc;
          vertical-align: middle;
        }
        .rs-table tr:last-child td { border-bottom: none; }
        .rs-table tr:hover td { background: #fafafa; }
        .rs-actions { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
        .serial {
          font-family: monospace; font-size: 12px;
          background: #f8fafc; padding: 3px 8px;
          border-radius: 6px; border: 1px solid #f1f5f9;
          color: #475569;
        }

        /* MOBILE CARDS */
        .rs-cards { display: none; padding: 12px; gap: 10px; flex-direction: column; }
        .rs-card {
          background: white; border-radius: 12px;
          border: 1px solid #f1f5f9; padding: 16px;
          box-shadow: 0 1px 4px #0000000a;
        }
        .rs-card-top {
          display: flex; align-items: flex-start;
          justify-content: space-between; gap: 8px; margin-bottom: 12px;
        }
        .rs-card-name { font-weight: 700; color: #0f172a; font-size: 15px; }
        .rs-card-cat { font-size: 12px; color: #94a3b8; margin-top: 2px; }
        .rs-card-grid {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 10px; margin-bottom: 12px;
        }
        .rs-card-label {
          font-size: 10px; color: #94a3b8; font-weight: 600;
          text-transform: uppercase; letter-spacing: 0.5px;
          display: block; margin-bottom: 2px;
        }
        .rs-card-val { font-size: 13px; color: #374151; font-weight: 500; }
        .rs-card-actions { display: flex; gap: 8px; flex-wrap: wrap; }

        /* EMPTY */
        .rs-empty { padding: 60px 20px; text-align: center; }

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

        /* RESPONSIVE */
        @media (max-width: 900px) {
          .rs-stats { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 640px) {
          .rs-table-scroll { display: none; }
          .rs-cards { display: flex; }
          .rs-toolbar { flex-direction: column; }
          .rs-filter { width: 100%; }
          .rs-stats { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 400px) {
          .rs-stats { grid-template-columns: repeat(2, 1fr); }
          .rs-card-grid { grid-template-columns: 1fr; }
        }
        .modal-box {
        background: white;
        border-radius: 16px;
        width: 100%;
        max-width: 480px;
        padding: 24px;
        box-shadow: 0 20px 60px #00000025;
        max-height: 90vh;
        overflow-y: auto;
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
      .modal-close:hover { background: #f1f5f9; }
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
      
      .mf-submit:disabled {
       opacity: 0.6; 
       cursor: not-allowed; 
      }
    `}</style>

      <div>
        {/* Header */}
        <div className="rs-header">
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: "700", color: "#0f172a", marginBottom: "4px", letterSpacing: "-0.5px" }}>Resources</h1>
            <p style={{ fontSize: "13px", color: "#94a3b8" }}>{filtered.length} resource{filtered.length !== 1 ? "s" : ""} found</p>
          </div>
          {isManager && (
            <button className="btn-primary" onClick={() => { setForm(emptyForm); setFormError(""); setShowCreate(true) }}>
              <Plus size={15} /> New Resource
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="rs-stats">
          {[
            { label: "Total", value: total, color: "#6366f1" },
            { label: "Available", value: available, color: "#16a34a" },
            { label: "In Use", value: inuse, color: "#2563eb" },
            { label: "Damaged", value: damaged, color: "#dc2626" },
          ].map((s, i) => (
            <div className="rs-stat" key={i}>
              <p className="rs-stat-val" style={{ color: s.color }}>{s.value}</p>
              <p className="rs-stat-label">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="rs-toolbar">
          <div className="rs-search">
            <Search size={15} color="#94a3b8" />
            <input required placeholder="Search by name, category or serial..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="rs-filter" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="all">All Status</option>
            <option value="available">Available</option>
            <option value="inuse">In Use</option>
            <option value="damaged">Damaged</option>
          </select>
        </div>

        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8", background: "white", borderRadius: "14px" }}>Loading resources...</div>
        ) : filtered.length === 0 ? (
          <div className="rs-empty" style={{ background: "white", borderRadius: "14px", border: "1px solid #f1f5f9" }}>
            <div style={{ width: "48px", height: "48px", background: "#f1f5f9", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
              <Package size={22} color="#cbd5e1" />
            </div>
            <p style={{ fontWeight: "600", color: "#64748b", marginBottom: "4px" }}>No resources found</p>
            <p style={{ fontSize: "13px", color: "#94a3b8" }}>{isManager ? "Register your first resource" : "No resources available"}</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="rs-table-wrap">
              <div className="rs-table-scroll">
                <table className="rs-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Resource Name</th>
                      <th>Category</th>
                      <th>Serial Number</th>
                      <th>Status</th>
                      {isManager && <th>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((resource, i) => (
                      <tr key={resource.resource_id}>
                        <td style={{ color: "#94a3b8", fontSize: "12px" }}>{i + 1}</td>
                        <td style={{ fontWeight: "600", color: "#0f172a" }}>{resource.resource_name}</td>
                        <td>{resource.resource_category}</td>
                        <td><span className="serial">{resource.resource_serialNumber}</span></td>
                        <td><StatusBadge status={resource.resource_status} /></td>
                        {isManager && (
                          <td>
                            <div className="rs-actions">
                              <button className="btn-sm" onClick={() => openEdit(resource)}><Edit2 size={12} />Edit</button>                                
                              {resource.resource_status === "available" && (
                                  <button
                                      className="btn-sm"
                                      onClick={() => { setSelectedResource(resource); setAssignEventId(""); setFormError(""); setShowAssign(true) }}
                                  >
                                      <Link2 size={12} />Assign
                                  </button>
                              )}
                              
                              {resource.resource_status === "inuse" && (
                                  <button
                                      className="btn-sm"
                                      onClick={() => viewAssignment(resource)}
                                  >
                                      <Eye size={12} />View
                                  </button>
                              )}

                              {resource.resource_status === "inuse" && (
                                <button className="btn-sm-success" onClick={() => handleReturn(resource.resource_id)}>
                                  <RotateCcw size={12} />Return
                                </button>
                              )}
                              <button className="btn-sm-danger" onClick={() => handleDelete(resource.resource_id)}><Trash2 size={12} /></button>
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
            <div className="rs-cards">
              {filtered.map(resource => (
                <div className="rs-card" key={resource.resource_id}>
                  <div className="rs-card-top">
                    <div>
                      <p className="rs-card-name">{resource.resource_name}</p>
                      <p className="rs-card-cat">{resource.resource_category}</p>
                    </div>
                    <StatusBadge status={resource.resource_status} />
                  </div>
                  <div className="rs-card-grid">
                    <div>
                      <span className="rs-card-label">Serial Number</span>
                      <span className="rs-card-val" style={{ fontFamily: "monospace", fontSize: "12px" }}>{resource.resource_serialNumber}</span>
                    </div>
                    <div>
                      <span className="rs-card-label">Category</span>
                      <span className="rs-card-val">{resource.resource_category}</span>
                    </div>
                  </div>
                  {isManager && (
                    <div className="rs-card-actions">
                      <button className="btn-sm" onClick={() => openEdit(resource)}><Edit2 size={12} />Edit</button>

                      {resource.resource_status === "available" && (
                          <button
                              className="btn-sm"
                              onClick={() => { setSelectedResource(resource); setAssignEventId(""); setFormError(""); setShowAssign(true) }}
                          >
                              <Link2 size={12} />Assign
                          </button>
                      )}

                      {resource.resource_status === "inuse" && (
                          <button
                              className="btn-sm"
                              onClick={() => viewAssignment(resource)}
                          >
                              <Eye size={12} />View
                          </button>
                      )}
                      {resource.resource_status === "inuse" && (
                        <button className="btn-sm-success" onClick={() => handleReturn(resource.resource_id)}>
                          <RotateCcw size={12} />Return
                        </button>
                      )}
                      <button className="btn-sm-danger" onClick={() => handleDelete(resource.resource_id)}><Trash2 size={12} /></button>
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
        <Modal title="Register New Resource" onClose={() => setShowCreate(false)}>
          {formError && <div className="mf-error">{formError}</div>}
          <div className="mf-group">
            <label className="mf-label">Resource Name</label>
            <input className="mf-input" placeholder="e.g. Canon Camera" value={form.resource_name} onChange={e => setForm({ ...form, resource_name: e.target.value })} />
          </div>
          <div className="mf-group">
            <label className="mf-label">Category</label>
            <input className="mf-input" placeholder="e.g. Cameras, Speakers, Vehicles" value={form.resource_category} onChange={e => setForm({ ...form, resource_category: e.target.value })} />
          </div>
          <div className="mf-group">
            <label className="mf-label">Serial Number</label>
            <input className="mf-input" placeholder="e.g. CAM-001" value={form.resource_serialNumber} onChange={e => setForm({ ...form, resource_serialNumber: e.target.value })} />
          </div>
          <div className="mf-footer">
            <button className="mf-cancel" onClick={() => setShowCreate(false)}>Cancel</button>
            <button className="mf-submit" disabled={formLoading} onClick={handleCreate}>{formLoading ? "Creating..." : "Register Resource"}</button>
          </div>
        </Modal>
      )}

      {/* EDIT MODAL */}
      {showEdit && (
        <Modal title="Edit Resource" onClose={() => setShowEdit(false)}>
          {formError && <div className="mf-error">{formError}</div>}
          <div className="mf-group">
            <label className="mf-label">Resource Name</label>
            <input className="mf-input" required value={form.resource_name} onChange={e => setForm({ ...form, resource_name: e.target.value })} />
          </div>
          <div className="mf-group">
            <label className="mf-label">Category</label>
            <input className="mf-input" required value={form.resource_category} onChange={e => setForm({ ...form, resource_category: e.target.value })} />
          </div>
          <div className="mf-group">
            <label className="mf-label">Serial Number</label>
            <input className="mf-input" required value={form.resource_serialNumber} onChange={e => setForm({ ...form, resource_serialNumber: e.target.value })} />
          </div>
          <div className="mf-group">
            <label className="mf-label">Status</label>
            <select className="mf-input" value={form.resource_status} onChange={e => setForm({ ...form, resource_status: e.target.value })}>
              <option value="available">Available</option>
              <option value="inuse">In Use</option>
              <option value="damaged">Damaged</option>
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
          <div className="modal-overlay" onClick={() => setShowAssign(false)} style={{ position: "fixed", inset: 0, background: "#00000055", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
              <div className="modal-box" onClick={e => e.stopPropagation()}>
                  <div className="modal-header">
                      <p className="modal-title">Assign Resource to Event</p>
                      <button className="modal-close" onClick={() => setShowAssign(false)}><X size={18} /></button>
                  </div>
                  <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "16px" }}>
                      Assigning: <strong style={{ color: "#0f172a" }}>{selectedResource?.resource_name}</strong>
                      <span style={{ fontFamily: "monospace", fontSize: "11px", background: "#f8fafc", padding: "2px 8px", borderRadius: "6px", marginLeft: "8px", border: "1px solid #f1f5f9" }}>
                          {selectedResource?.resource_serialNumber}
                      </span>
                  </p>
                  {formError && <div className="mf-error">{formError}</div>}
                  <div className="mf-group">
                      <label className="mf-label">Select Event <span style={{ color: "#ef4444" }}>*</span></label>
                      {events.length === 0 ? (
                          <p style={{ padding: "12px", background: "#f8fafc", borderRadius: "8px", color: "#94a3b8", fontSize: "13px" }}>
                              No active events available
                          </p>
                      ) : (
                          <select
                              className="mf-input"
                              value={assignEventId}
                              onChange={e => setAssignEventId(e.target.value)}
                          >
                              <option value="">Select an event...</option>
                              {events.map(event => (
                                  <option key={event.event_id} value={event.event_id}>
                                      {event.event_name} — {event.event_start_date?.slice(0, 10)}
                                  </option>
                              ))}
                          </select>
                      )}
                  </div>
                  <div className="mf-footer">
                      <button className="mf-cancel" onClick={() => setShowAssign(false)}>Cancel</button>
                      <button
                          className="mf-submit"
                          disabled={formLoading || !assignEventId}
                          onClick={handleAssign}
                      >
                          {formLoading ? "Assigning..." : "Assign Resource"}
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* VIEW ASSIGNMENT MODAL */}
                  
  {showAssignment && (
    <div
      onClick={() => setShowAssignment(false)}
      style={{ position: "fixed", inset: 0, background: "#00000055", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: "white", borderRadius: "16px", width: "100%", maxWidth: "480px", padding: "24px", boxShadow: "0 20px 60px #00000025", maxHeight: "90vh", overflowY: "auto" }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <p style={{ fontSize: "18px", fontWeight: "700", color: "#0f172a" }}>Resource Assignment</p>
          <button
            onClick={() => setShowAssignment(false)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: "4px", borderRadius: "6px", display: "flex", alignItems: "center" }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        {assignmentLoading ? (
          <p style={{ textAlign: "center", color: "#94a3b8", padding: "20px" }}>Loading...</p>
        ) : !currentAssignment ? (
          <div style={{ textAlign: "center", padding: "30px 0" }}>
            <div style={{ width: "44px", height: "44px", background: "#f1f5f9", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
              <Package size={20} color="#cbd5e1" />
            </div>
            <p style={{ color: "#64748b", fontWeight: "600", marginBottom: "4px" }}>No active assignment</p>
            <p style={{ color: "#94a3b8", fontSize: "13px" }}>This resource is not assigned to any event</p>
          </div>
        ) : (
          <div style={{ background: "#f8fafc", borderRadius: "12px", padding: "16px", border: "1px solid #f1f5f9" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <p style={{ fontSize: "11px", color: "#94a3b8", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>Assigned To Event</p>
                <p style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a" }}>{currentAssignment.event_name}</p>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <p style={{ fontSize: "11px", color: "#94a3b8", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>Start Date</p>
                  <p style={{ fontSize: "14px", color: "#374151", fontWeight: "500" }}>{currentAssignment.event_start_date?.slice(0, 10)}</p>
                </div>
                <div>
                  <p style={{ fontSize: "11px", color: "#94a3b8", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>End Date</p>
                  <p style={{ fontSize: "14px", color: "#374151", fontWeight: "500" }}>{currentAssignment.event_end_date?.slice(0, 10)}</p>
                </div>
                <div>
                  <p style={{ fontSize: "11px", color: "#94a3b8", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>Event Status</p>
                  <p style={{ fontSize: "14px", color: "#374151", fontWeight: "500", textTransform: "capitalize" }}>{currentAssignment.event_status}</p>
                </div>
                <div>
                  <p style={{ fontSize: "11px", color: "#94a3b8", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>Assigned At</p>
                  <p style={{ fontSize: "14px", color: "#374151", fontWeight: "500" }}>{currentAssignment.assigned_at?.slice(0, 10)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "20px" }}>
          <button
            onClick={() => setShowAssignment(false)}
            style={{ padding: "10px 16px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "14px", fontWeight: "500", color: "#475569", cursor: "pointer", fontFamily: "inherit" }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )}    
</>
  )
}