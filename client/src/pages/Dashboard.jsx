import { useEffect, useState } from "react"
import axios from "axios"
import {AreaChart, Area, XAxis, YAxis, CartesianGrid,Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend} from "recharts"
import { CalendarDays, CheckSquare, Package, TrendingUp, TrendingDown, Clock, AlertCircle, Bell } from "lucide-react"
    
    const api = (token) => axios.create({
      baseURL: "http://localhost:3000/api",
      headers: { Authorization: `Bearer ${token}` }
    })
    
    const monthlyData = [
      { month: "Jan", revenue: 1200000, expenses: 800000 },
      { month: "Feb", revenue: 1800000, expenses: 1000000 },
      { month: "Mar", revenue: 1500000, expenses: 900000 },
      { month: "Apr", revenue: 2200000, expenses: 1200000 },
      { month: "May", revenue: 3000000, expenses: 1500000 },
      { month: "Jun", revenue: 2800000, expenses: 1300000 },
    ]
    
    const COLORS = ["#6366f1", "#f43f5e", "#10b981"]
    
    export default function Dashboard() {
            const [stats, setStats] = useState(null)
            const [loading, setLoading] = useState(true)
            const [error, setError] = useState("")
            
            useEffect(() => {
                const token = localStorage.getItem("token")
                api(token).get("/dashboard")
                .then(res => setStats(res.data))
                .catch(() => setError("Failed to load dashboard data"))
                .finally(() => setLoading(false))
            }, [])
            
            if (loading) return (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", flexDirection: "column", gap: "16px" }}>
                <div style={{ width: "40px", height: "40px", border: "3px solid #e2e8f0", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                <p style={{ color: "#94a3b8", fontSize: "14px" }}>Loading dashboard...</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
                </div>
            )
            
            if (error) return (
                <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "20px", background: "#fef2f2", borderRadius: "12px", color: "#dc2626" }}>
                <AlertCircle size={20} />
                <p>{error}</p>
                </div>
            )
            
            const user = JSON.parse(localStorage.getItem("user") || "{}")
            const isStaff = user.role === "staff"

            const statCards = isStaff ? [
                {
                    label: "My Events",
                    value: stats?.total_events ?? 0,
                    sub: "Events assigned to me",
                    icon: CalendarDays,
                    color: "#6366f1",
                    bg: "#eef2ff"
                },
                {
                    label: "My Tasks",
                    value: stats?.total_tasks ?? 0,
                    sub: `${stats?.pending_tasks ?? 0} pending`,
                    icon: CheckSquare,
                    color: "#f59e0b",
                    bg: "#fffbeb"
                },
                {
                    label: "Pending Tasks",
                    value: stats?.pending_tasks ?? 0,
                    sub: "Tasks not yet started",
                    icon: Clock,
                    color: "#ef4444",
                    bg: "#fef2f2"
                },
                {
                    label: "Notifications",
                    value: stats?.unread_notifications ?? 0,
                    sub: "Unread notifications",
                    icon: Bell,
                    color: "#10b981",
                    bg: "#ecfdf5"
                },
            ] : [
                // existing manager cards...
                {
                    label: "Total Events",
                    value: stats?.total_events ?? 0,
                    sub: `${stats?.upcoming_events ?? 0} upcoming`,
                    icon: CalendarDays,
                    color: "#6366f1",
                    bg: "#eef2ff"
                },
                {
                    label: "Total Tasks",
                    value: stats?.total_tasks ?? 0,
                    sub: `${stats?.pending_tasks ?? 0} pending`,
                    icon: CheckSquare,
                    color: "#f59e0b",
                    bg: "#fffbeb"
                },
                {
                    label: "Resources",
                    value: stats?.total_resources ?? 0,
                    sub: `${stats?.available_resources ?? 0} available`,
                    icon: Package,
                    color: "#10b981",
                    bg: "#ecfdf5"
                },
                {
                    label: "Total Revenue",
                    value: `${(stats?.total_revenue ?? 0).toLocaleString()} RWF`,
                    sub: `Expenses: ${(stats?.total_expenses ?? 0).toLocaleString()} RWF`,
                    icon: TrendingUp,
                    color: "#3b82f6",
                    bg: "#eff6ff"
                },
            ]
            
            const pieData = [
                { name: "Available", value: stats?.available_resources ?? 0 },
                { name: "In Use", value: (stats?.total_resources ?? 0) - (stats?.available_resources ?? 0) },
                { name: "Pending Tasks", value: stats?.pending_tasks ?? 0 },
            ]
            
            return (
                <>
                <style>{`
                    .dash-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
                    gap: 16px;
                    margin-bottom: 28px;
                    }
                    .stat-card {
                    background: white;
                    border-radius: 14px;
                    padding: 20px;
                    border: 1px solid #f1f5f9;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    transition: transform 0.15s, box-shadow 0.15s;
                    }
                    .stat-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 24px #0000000d;
                    }
                    .stat-icon {
                    width: 44px; height: 44px;
                    border-radius: 10px;
                    display: flex; align-items: center; justify-content: center;
                    }
                    .stat-value {
                    font-size: 26px;
                    font-weight: 700;
                    color: #0f172a;
                    letter-spacing: -0.5px;
                    line-height: 1;
                    }
                    .stat-label {
                    font-size: 13px;
                    color: #64748b;
                    font-weight: 500;
                    }
                    .stat-sub {
                    font-size: 12px;
                    color: #94a3b8;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    }
                    .charts-grid {
                    display: grid;
                    grid-template-columns: 1fr 340px;
                    gap: 20px;
                    margin-bottom: 28px;
                    }
                    .chart-card {
                    background: white;
                    border-radius: 14px;
                    padding: 24px;
                    border: 1px solid #f1f5f9;
                    }
                    .chart-title {
                    font-size: 15px;
                    font-weight: 700;
                    color: #0f172a;
                    margin-bottom: 4px;
                    }
                    .chart-sub {
                    font-size: 12px;
                    color: #94a3b8;
                    margin-bottom: 20px;
                    }
                    .section-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 16px;
                    }
                    .section-title {
                    font-size: 16px;
                    font-weight: 700;
                    color: #0f172a;
                    }
                    .badge {
                    padding: 3px 10px;
                    border-radius: 20px;
                    font-size: 11px;
                    font-weight: 600;
                    }
                    .badge-pending { background: #fef3c7; color: #d97706; }
                    .badge-inprogress { background: #dbeafe; color: #2563eb; }
                    .badge-completed { background: #dcfce7; color: #16a34a; }
                    .badge-cancelled { background: #fee2e2; color: #dc2626; }
                    .quick-stats {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
                    gap: 12px;
                    }
                    .quick-stat {
                    background: #f8fafc;
                    border-radius: 10px;
                    padding: 16px;
                    border: 1px solid #f1f5f9;
                    }
                    .quick-stat-label {
                    font-size: 12px;
                    color: #94a3b8;
                    margin-bottom: 6px;
                    font-weight: 500;
                    }
                    .quick-stat-value {
                    font-size: 20px;
                    font-weight: 700;
                    color: #0f172a;
                    }
                    @media (max-width: 900px) {
                    .charts-grid {
                        grid-template-columns: 1fr;
                    }
                    }
                    @media (max-width: 480px) {
                    .stat-value {
                        font-size: 22px;
                    }
                    }
                `}</style>
            
                {/* Page Header */}
                <div style={{ marginBottom: "24px" }}>
                    <h1 style={{ fontSize: "24px", fontWeight: "700", color: "#0f172a", marginBottom: "4px", letterSpacing: "-0.5px" }}>
                    Dashboard
                    </h1>
                    <p style={{ fontSize: "14px", color: "#94a3b8" }}>
                    Welcome back! Here's what's happening today.
                    </p>
                </div>
            
                {/* Stat Cards */}
                <div className="dash-grid">
                    {statCards.map((card, i) => {
                    const Icon = card.icon
                    return (
                        <div className="stat-card" key={i}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <div className="stat-icon" style={{ background: card.bg }}>
                            <Icon size={20} color={card.color} strokeWidth={2} />
                            </div>
                        </div>
                        <div>
                            <p className="stat-value">{card.value}</p>
                            <p className="stat-label">{card.label}</p>
                        </div>
                        <p className="stat-sub">
                            <Clock size={12} />
                            {card.sub}
                        </p>
                        </div>
                    )
                    })}
                </div>
            
                {/* Charts */}
                <div className="charts-grid">
            
                    {/* Area Chart */}
                    <div className="chart-card">
                    <p className="chart-title">Revenue vs Expenses</p>
                    <p className="chart-sub">Monthly financial overview</p>
                    <ResponsiveContainer width="100%" height={240}>
                        <AreaChart data={monthlyData}>
                        <defs>
                            <linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="expenses" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000000).toFixed(1)}M`} />
                        <Tooltip formatter={(v) => `${v.toLocaleString()} RWF`} contentStyle={{ borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "13px" }} />
                        <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} fill="url(#revenue)" name="Revenue" />
                        <Area type="monotone" dataKey="expenses" stroke="#f43f5e" strokeWidth={2} fill="url(#expenses)" name="Expenses" />
                        </AreaChart>
                    </ResponsiveContainer>
                    </div>
            
                    {/* Pie Chart */}
                    <div className="chart-card">
                    <p className="chart-title">Resource & Task Overview</p>
                    <p className="chart-sub">Current status breakdown</p>
                    <ResponsiveContainer width="100%" height={240}>
                        <PieChart>
                        <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={4}
                            dataKey="value"
                        >
                            {pieData.map((_, index) => (
                            <Cell key={index} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "13px" }} />
                        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px" }} />
                        </PieChart>
                    </ResponsiveContainer>
                    </div>
                </div>
            
                {/* Quick Stats */}
                <div className="chart-card">
                    <div className="section-header">
                    <p className="section-title">Quick Overview</p>
                    </div>
                    <div className="quick-stats">
                    {[
                        { label: "Upcoming Events", value: stats?.upcoming_events ?? 0, icon: CalendarDays, color: "#6366f1" },
                        { label: "Pending Tasks", value: stats?.pending_tasks ?? 0, icon: CheckSquare, color: "#f59e0b" },
                        { label: "Available Resources", value: stats?.available_resources ?? 0, icon: Package, color: "#10b981" },
                        { label: "Net Balance", value: `${((stats?.total_revenue ?? 0) - (stats?.total_expenses ?? 0)).toLocaleString()} RWF`, icon: TrendingUp, color: "#3b82f6" },
                    ].map((item, i) => {
                        const Icon = item.icon
                        return (
                        <div className="quick-stat" key={i}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                            <Icon size={14} color={item.color} />
                            <p className="quick-stat-label" style={{ margin: 0 }}>{item.label}</p>
                            </div>
                            <p className="quick-stat-value">{item.value}</p>
                        </div>
                        )
                    })}
                    </div>
                </div>
                </>
            )
    }