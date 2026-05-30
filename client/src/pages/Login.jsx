import { useAuth } from "../context/AuthContext"
import { useState } from "react"
import axios from "axios"
import { useNavigate } from "react-router-dom"

export default function Login() {
  const { loadUser } = useAuth()
  const [form, setForm] = useState({ username: "", password: "" })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const res = await axios.post("http://localhost:3000/api/users/login", form)
      localStorage.setItem("token", res.data.token)
      localStorage.setItem("user", JSON.stringify(res.data.user))
      loadUser()  // update context with new user data
      navigate("/dashboard")
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        .login-wrapper {
          min-height: 100vh;
          display: flex;
          background: #0f1117;
        }
        .login-left {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 60px;
          background: #0f1117;
          border-right: 1px solid #ffffff10;
          position: relative;
          overflow: hidden;
        }
        .login-right {
          width: 480px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 60px;
          background: #ffffff;
        }
        .login-input {
          width: 100%;
          padding: 12px 16px;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          fontSize: 15px;
          color: #0f172a;
          outline: none;
          background: #f8fafc;
          box-sizing: border-box;
          font-size: 15px;
          transition: border-color 0.2s;
        }
        .login-input:focus {
          border-color: #6366f1;
        }
        .login-btn {
          width: 100%;
          padding: 13px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          letter-spacing: 0.3px;
          transition: opacity 0.2s;
        }
        .login-btn:disabled {
          background: #a5b4fc;
          cursor: not-allowed;
        }
        .deco-circle-1 {
          position: absolute;
          width: 400px; height: 400px;
          border-radius: 50%;
          border: 1px solid #6366f115;
          top: -100px; left: -100px;
        }
        .deco-circle-2 {
          position: absolute;
          width: 300px; height: 300px;
          border-radius: 50%;
          border: 1px solid #6366f120;
          bottom: 50px; right: -50px;
        }
        .deco-circle-3 {
          position: absolute;
          width: 200px; height: 200px;
          border-radius: 50%;
          background: #6366f108;
          top: 30%; left: 20%;
        }

        /* TABLET */
        @media (max-width: 900px) {
          .login-left {
            display: none;
          }
          .login-right {
            width: 100%;
            padding: 40px;
          }
        }

        /* MOBILE */
        @media (max-width: 480px) {
          .login-right {
            padding: 32px 24px;
          }
        }
      `}</style>

      <div className="login-wrapper">

        {/* LEFT PANEL - Branding */}
        <div className="login-left">
          <div className="deco-circle-1" />
          <div className="deco-circle-2" />
          <div className="deco-circle-3" />

          {/* Logo */}
          <div style={{ marginBottom: "60px", position: "relative", zIndex: 1 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              <div style={{
                width: "44px", height: "44px", borderRadius: "12px",
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "20px", fontWeight: "700", color: "white"
              }}>S</div>
              <span style={{ fontSize: "22px", fontWeight: "700", color: "white", letterSpacing: "-0.5px" }}>SERM</span>
            </div>
            <p style={{ fontSize: "13px", color: "#6366f1", letterSpacing: "3px", textTransform: "uppercase", fontWeight: "500" }}>
              Smart Event & Resource Management
            </p>
          </div>

          {/* Tagline */}
          <div style={{ position: "relative", zIndex: 1 }}>
            <h1 style={{ fontSize: "42px", fontWeight: "700", color: "white", lineHeight: "1.2", marginBottom: "20px", letterSpacing: "-1px" }}>
              Manage events<br />
              <span style={{ background: "linear-gradient(135deg, #6366f1, #a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                smarter & faster
              </span>
            </h1>
            <p style={{ fontSize: "16px", color: "#94a3b8", lineHeight: "1.7", maxWidth: "380px" }}>
              A unified platform for managing events, staff, resources, and finances — all in one place.
            </p>
          </div>

          {/* Stats */}
          <div style={{ display: "flex", gap: "40px", marginTop: "60px", position: "relative", zIndex: 1, flexWrap: "wrap" }}>
            {[
              { value: "100%", label: "Real-time tracking" },
              { value: "3", label: "Role levels" },
              { value: "∞", label: "Events managed" }
            ].map((stat, i) => (
              <div key={i}>
                <p style={{ fontSize: "28px", fontWeight: "700", color: "white", marginBottom: "4px" }}>{stat.value}</p>
                <p style={{ fontSize: "13px", color: "#64748b" }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT PANEL - Login Form */}
        <div className="login-right">

          {/* Mobile Logo — only shows when left panel is hidden */}
          <div style={{ marginBottom: "32px", display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "36px", height: "36px", borderRadius: "10px",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "16px", fontWeight: "700", color: "white"
            }}>S</div>
            <span style={{ fontSize: "18px", fontWeight: "700", color: "#0f172a" }}>SERM</span>
          </div>

          <div style={{ marginBottom: "36px" }}>
            <h2 style={{ fontSize: "28px", fontWeight: "700", color: "#0f172a", marginBottom: "8px", letterSpacing: "-0.5px" }}>
              Welcome back
            </h2>
            <p style={{ fontSize: "15px", color: "#64748b" }}>Sign in to your SERM account</p>
          </div>

          <form onSubmit={handleSubmit}>

            {/* Username */}
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "8px", letterSpacing: "0.3px" }}>
                Username
              </label>
              <input
                type="text"
                name="username"
                value={form.username}
                onChange={handleChange}
                placeholder="Enter your username"
                required
                className="login-input"
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: "28px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "8px", letterSpacing: "0.3px" }}>
                Password
              </label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
                className="login-input"
              />
            </div>

            {/* Error */}
            {error && (
              <div style={{
                padding: "12px 16px", borderRadius: "10px",
                background: "#fef2f2", border: "1px solid #fecaca",
                color: "#dc2626", fontSize: "14px", marginBottom: "20px"
              }}>{error}</div>
            )}

            {/* Submit */}
            <button type="submit" disabled={loading} className="login-btn">
              {loading ? "Signing in..." : "Sign in"}
            </button>

          </form>

          <p style={{ marginTop: "40px", fontSize: "13px", color: "#94a3b8", textAlign: "center" }}>
            Smart Event & Resource Management Platform © 2026
          </p>
        </div>
      </div>
    </>
  )
}