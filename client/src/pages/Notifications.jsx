import { useEffect, useState } from "react"
import axios from "axios"
import { Bell, CheckCheck, Clock, Inbox } from "lucide-react"

const api = () => axios.create({
  baseURL: "http://localhost:3000/api",
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
})

export default function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchNotifications = async () => {
    try {
      const res = await api().get("/notifications")
      setNotifications(res.data.notifications)
    } catch {
      console.error("Failed to fetch notifications")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchNotifications() }, [])

  const markAsRead = async (id) => {
    try {
      await api().put(`/notifications/${id}`)
      setNotifications(prev =>
        prev.map(n => n.n_id === id ? { ...n, is_read: 1 } : n)
      )
    } catch {
      console.error("Failed to mark as read")
    }
  }

  const markAllAsRead = async () => {
    const unread = notifications.filter(n => !n.is_read)
    await Promise.all(unread.map(n => api().put(`/notifications/${n.n_id}`)))
    setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })))
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    if (mins < 1) return "Just now"
    if (mins < 60) return `${mins}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  return (
    <>
      <style>{`
        .nt-header {
          display: flex; align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 20px; gap: 12px; flex-wrap: wrap;
        }
        .btn-markall {
          display: flex; align-items: center; gap: 8px;
          padding: 9px 16px;
          background: white; color: #6366f1;
          border: 1.5px solid #6366f1; border-radius: 10px;
          font-size: 13px; font-weight: 600; cursor: pointer;
          white-space: nowrap; transition: all 0.15s;
        }
        .btn-markall:hover { background: #eef2ff; }
        .nt-tabs {
          display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap;
        }
        .nt-tab {
          padding: 7px 16px; border-radius: 20px;
          font-size: 13px; font-weight: 600;
          cursor: pointer; border: 1.5px solid #e2e8f0;
          background: white; color: #64748b;
          transition: all 0.15s;
        }
        .nt-tab.active {
          background: #6366f1; color: white; border-color: #6366f1;
        }
        .nt-list {
          background: white; border-radius: 14px;
          border: 1px solid #f1f5f9; overflow: hidden;
        }
        .nt-item {
          display: flex; align-items: flex-start; gap: 14px;
          padding: 16px 20px;
          border-bottom: 1px solid #f8fafc;
          cursor: pointer; transition: background 0.15s;
          position: relative;
        }
        .nt-item:last-child { border-bottom: none; }
        .nt-item:hover { background: #fafafa; }
        .nt-item.unread { background: #f8faff; }
        .nt-item.unread:hover { background: #f0f0ff; }
        .nt-dot {
          position: absolute; top: 20px; right: 20px;
          width: 8px; height: 8px; border-radius: 50%;
          background: #6366f1;
        }
        .nt-icon-wrap {
          width: 40px; height: 40px; border-radius: 10px;
          background: #eef2ff;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .nt-icon-wrap.read { background: #f1f5f9; }
        .nt-message {
          font-size: 14px; color: #0f172a;
          font-weight: 500; margin-bottom: 4px;
          line-height: 1.4; padding-right: 20px;
        }
        .nt-message.read { color: #64748b; font-weight: 400; }
        .nt-time {
          font-size: 12px; color: #94a3b8;
          display: flex; align-items: center; gap: 4px;
        }
        .nt-markread {
          font-size: 11px; color: #6366f1;
          font-weight: 600; background: none; border: none;
          cursor: pointer; padding: 0; margin-top: 6px;
          display: inline-block;
        }
        .nt-empty {
          padding: 80px 20px; text-align: center;
        }
        .nt-summary {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 12px; margin-bottom: 20px;
        }
        .nt-summary-card {
          background: white; border-radius: 12px;
          border: 1px solid #f1f5f9; padding: 16px 20px;
          display: flex; align-items: center; gap: 12px;
        }
        .nt-summary-icon {
          width: 40px; height: 40px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .nt-summary-val {
          font-size: 22px; font-weight: 700; color: #0f172a;
        }
        .nt-summary-label { font-size: 12px; color: #94a3b8; }

        @media (max-width: 480px) {
          .nt-item { padding: 14px 16px; }
          .nt-summary { grid-template-columns: 1fr 1fr; }
        }
      `}</style>

      <div>
        {/* Header */}
        <div className="nt-header">
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: "700", color: "#0f172a", marginBottom: "4px", letterSpacing: "-0.5px" }}>Notifications</h1>
            <p style={{ fontSize: "13px", color: "#94a3b8" }}>
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}` : "All caught up!"}
            </p>
          </div>
          {unreadCount > 0 && (
            <button className="btn-markall" onClick={markAllAsRead}>
              <CheckCheck size={15} /> Mark all as read
            </button>
          )}
        </div>

        {/* Summary */}
        <div className="nt-summary">
          <div className="nt-summary-card">
            <div className="nt-summary-icon" style={{ background: "#eef2ff" }}>
              <Bell size={18} color="#6366f1" />
            </div>
            <div>
              <p className="nt-summary-val">{notifications.length}</p>
              <p className="nt-summary-label">Total</p>
            </div>
          </div>
          <div className="nt-summary-card">
            <div className="nt-summary-icon" style={{ background: "#fef3c7" }}>
              <Bell size={18} color="#d97706" />
            </div>
            <div>
              <p className="nt-summary-val">{unreadCount}</p>
              <p className="nt-summary-label">Unread</p>
            </div>
          </div>
        </div>

        {/* Notifications List */}
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8", background: "white", borderRadius: "14px" }}>
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="nt-empty" style={{ background: "white", borderRadius: "14px", border: "1px solid #f1f5f9" }}>
            <div style={{ width: "56px", height: "56px", background: "#f1f5f9", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <Inbox size={26} color="#cbd5e1" />
            </div>
            <p style={{ fontWeight: "600", color: "#64748b", marginBottom: "6px", fontSize: "16px" }}>No notifications yet</p>
            <p style={{ fontSize: "13px", color: "#94a3b8" }}>You'll see notifications here when tasks or events are assigned to you</p>
          </div>
        ) : (
          <div className="nt-list">
            {notifications.map(n => (
              <div
                key={n.n_id}
                className={`nt-item ${!n.is_read ? "unread" : ""}`}
                onClick={() => !n.is_read && markAsRead(n.n_id)}
              >
                <div className={`nt-icon-wrap ${n.is_read ? "read" : ""}`}>
                  <Bell size={18} color={n.is_read ? "#94a3b8" : "#6366f1"} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p className={`nt-message ${n.is_read ? "read" : ""}`}>{n.message}</p>
                  <p className="nt-time">
                    <Clock size={11} />
                    {timeAgo(n.created_at)}
                  </p>
                  {!n.is_read && (
                    <button className="nt-markread" onClick={e => { e.stopPropagation(); markAsRead(n.n_id) }}>
                      Mark as read
                    </button>
                  )}
                </div>
                {!n.is_read && <div className="nt-dot" />}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}