import { useState, useEffect } from "react"
import axios from "axios"
import { NavLink, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import {LayoutDashboard,CalendarDays,CheckSquare,BookOpen,Package,ArrowLeftRight,Bell,LogOut,Menu,X,ChevronRight} from "lucide-react"

const navItems = [
  { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/events", icon: CalendarDays, label: "Events" },
  { path: "/tasks", icon: CheckSquare, label: "Tasks" },
  { path: "/resources", icon: Package, label: "Resources" },
  { path: "/transactions", icon: ArrowLeftRight, label: "Transactions" },
  { path: "/notifications", icon: Bell, label: "Notifications" },
  { path: "/bookings", icon: BookOpen, label: "Bookings" },
]

const managerOnlyItems = ["/transactions", "/bookings"]

export default function DashboardLayout({ children }) {
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const navigate = useNavigate()

  const filteredNav = navItems.filter(item => {
    if (managerOnlyItems.includes(item.path)) {
      return user?.role === "manager" || user?.role === "superadmin"
    }
    return true
  })
  
useEffect(() => {
  const fetchUnread = async () => {
        try {
        const token = localStorage.getItem("token")
        const res = await axios.get("http://localhost:3000/api/notifications", {
            headers: { Authorization: `Bearer ${token}` }
        })
        const unread = res.data.notifications.filter(n => !n.is_read).length
        setUnreadCount(unread)
        } catch {}
    }
    fetchUnread()
}, [])
  
  return (
    <>
      <style>{`
        .layout-wrapper {
          display: flex;
          min-height: 100vh;
          background: #f1f5f9;
        }
        .sidebar {
          width: 240px;
          background: #0f1117;
          display: flex;
          flex-direction: column;
          position: fixed;
          top: 0; left: 0;
          height: 100vh;
          z-index: 100;
          transition: transform 0.3s ease;
        }
        .sidebar-logo {
          padding: 24px 20px;
          border-bottom: 1px solid #ffffff10;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .logo-icon {
          width: 36px; height: 36px;
          border-radius: 10px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          display: flex; align-items: center; justify-content: center;
          font-size: 16px; font-weight: 700; color: white;
          flex-shrink: 0;
        }
        .logo-text {
          font-size: 18px; font-weight: 700;
          color: white; letter-spacing: -0.5px;
        }
        .sidebar-nav {
          flex: 1;
          padding: 16px 12px;
          overflow-y: auto;
        }
        .nav-label {
          font-size: 10px;
          font-weight: 600;
          color: #475569;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          padding: 0 8px;
          margin-bottom: 8px;
          margin-top: 16px;
        }
        .nav-link {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 8px;
          color: #94a3b8;
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 4px;
          transition: all 0.15s;
        }
        .nav-link:hover {
          background: #ffffff0d;
          color: #e2e8f0;
        }
        .nav-link.active {
          background: #6366f120;
          color: #a5b4fc;
        }
        .nav-link.active .nav-arrow {
          opacity: 1;
        }
        .nav-arrow {
          margin-left: auto;
          opacity: 0;
          transition: opacity 0.15s;
        }
        .sidebar-footer {
          padding: 16px 12px;
          border-top: 1px solid #ffffff10;
        }
        .user-card {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 8px;
          margin-bottom: 8px;
        }
        .user-avatar {
          width: 32px; height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 700; color: white;
          flex-shrink: 0;
        }
        .user-info { flex: 1; min-width: 0; }
        .user-name {
          font-size: 13px; font-weight: 600;
          color: #e2e8f0;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .user-role {
          font-size: 11px; color: #64748b;
          text-transform: capitalize;
        }
        .logout-btn {
          width: 100%;
          padding: 9px 12px;
          background: transparent;
          border: 1px solid #ffffff15;
          border-radius: 8px;
          color: #94a3b8;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          text-align: left;
          transition: all 0.15s;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .logout-btn:hover {
          background: #ff444415;
          border-color: #ff444430;
          color: #f87171;
        }
        .main-content {
          margin-left: 240px;
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }
        .topbar {
          background: white;
          border-bottom: 1px solid #e2e8f0;
          padding: 0 24px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0;
          z-index: 50;
        }
        .topbar-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .hamburger {
          display: none;
          background: none;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          cursor: pointer;
          padding: 6px;
          color: #64748b;
          transition: all 0.15s;
          align-items: center;
          justify-content: center;
        }
        .hamburger:hover {
          background: #f8fafc;
        }
        .page-title {
          font-size: 18px;
          font-weight: 700;
          color: #0f172a;
          letter-spacing: -0.3px;
        }
        .topbar-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .notif-btn {
          position: relative;
          background: none;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 8px;
          cursor: pointer;
          color: #64748b;
          transition: all 0.15s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .notif-btn:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
        }
        .notif-badge {
          position: absolute;
          top: -4px; right: -4px;
          width: 16px; height: 16px;
          border-radius: 50%;
          background: #ef4444;
          color: white;
          font-size: 9px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .role-badge {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-transform: capitalize;
        }
        .role-superadmin { background: #fef3c7; color: #d97706; }
        .role-manager { background: #dbeafe; color: #2563eb; }
        .role-staff { background: #dcfce7; color: #16a34a; }
        .page-content {
          padding: 28px 24px;
          flex: 1;
        }
        .sidebar-overlay {
          display: none;
          position: fixed;
          inset: 0;
          background: #00000060;
          z-index: 99;
        }
        @media (max-width: 768px) {
          .sidebar {
            transform: translateX(-100%);
          }
          .sidebar.open {
            transform: translateX(0);
          }
          .sidebar-overlay.open {
            display: block;
          }
          .main-content {
            margin-left: 0;
          }
          .hamburger {
            display: flex;
          }
          .page-content {
            padding: 20px 16px;
          }
        }
      `}</style>

      <div className="layout-wrapper">

        {/* Overlay */}
        <div
          className={`sidebar-overlay ${sidebarOpen ? "open" : ""}`}
          onClick={() => setSidebarOpen(false)}
        />

        {/* SIDEBAR */}
        <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>

          {/* Logo */}
          <div className="sidebar-logo">
            <div className="logo-icon">S</div>
            <span className="logo-text">SERM</span>
          </div>

          {/* Nav */}
          <nav className="sidebar-nav">
            <p className="nav-label">Main Menu</p>
            {filteredNav.map(item => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon size={17} strokeWidth={1.8} />
                  {item.label}
                  <ChevronRight size={14} className="nav-arrow" />
                </NavLink>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="sidebar-footer">
            <div className="user-card">
              <div className="user-avatar">
                {user?.username?.charAt(0).toUpperCase()}
              </div>
              <div className="user-info">
                <p className="user-name">{user?.username}</p>
                <p className="user-role">{user?.role}</p>
              </div>
            </div>
            <button className="logout-btn" onClick={logout}>
              <LogOut size={15} strokeWidth={1.8} />
              Sign out
            </button>
          </div>
        </aside>

        {/* MAIN */}
        <div className="main-content">

          {/* TOPBAR */}
          <header className="topbar">
            <div className="topbar-left">
              <button
                className="hamburger"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
              <span className="page-title">SERM Platform</span>
            </div>
            <div className="topbar-right">
                <button className="notif-btn" onClick={() => navigate("/notifications")}>
                    <Bell size={18} strokeWidth={1.8} />
                    {unreadCount > 0 && (
                        <span className="notif-badge">{unreadCount}</span>
                    )}
                </button>
              <span className={`role-badge role-${user?.role}`}>
                {user?.role}
              </span>
            </div>
          </header>

          {/* PAGE CONTENT */}
          <main className="page-content">
            {children}
          </main>

        </div>
      </div>
    </>
  )
}