import { createContext, useContext, useState, useEffect } from "react"

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)

  const loadUser = () => {
    const stored = localStorage.getItem("user")
    if (stored) {
      setUser(JSON.parse(stored))
    } else {
      setUser(null)
    }
    setReady(true)
  }

  useEffect(() => {
    loadUser()

    // Listen for storage changes — fires when login saves new user!
    window.addEventListener("storage", loadUser)
    return () => window.removeEventListener("storage", loadUser)
  }, [])

  const logout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    setUser(null)
    window.location.href = "/login"
  }

  if (!ready) return null

  return (
    <AuthContext.Provider value={{ user, logout, loadUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)