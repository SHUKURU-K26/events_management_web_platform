import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import Login from "./pages/Login"
import Dashboard from "./pages/Dashboard"
import DashboardLayout from "./layouts/DashboardLayout"
import Events from "./pages/Events"
import Transactions from "./pages/Transactions"
import Resources from "./pages/Resources"
import Notifications from "./pages/Notifications"
import Bookings from "./pages/Bookings"
import ProtectedRoute from "./utils/ProtectedRoute"
import Tasks from "./pages/Tasks"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />

        {/* Protected Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardLayout>
              <Dashboard />
            </DashboardLayout>
          </ProtectedRoute>
        } />

        <Route path="/events" element={
          <ProtectedRoute>
            <DashboardLayout>
              <Events />
            </DashboardLayout>
          </ProtectedRoute>
        } />

        <Route path="/tasks" element={
          <ProtectedRoute>
            <DashboardLayout>
              <Tasks />
            </DashboardLayout>
          </ProtectedRoute>
        } />


        <Route path="/resources" element={
          <ProtectedRoute>
            <DashboardLayout>
              <Resources />
            </DashboardLayout>
          </ProtectedRoute>
        } />


        <Route path="/transactions" element={
        <ProtectedRoute>
          <DashboardLayout>
            <Transactions />
          </DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/notifications" element={
        <ProtectedRoute>
          <DashboardLayout>
            <Notifications />
          </DashboardLayout>
        </ProtectedRoute>
      } />


      <Route path="/bookings" element={
        <ProtectedRoute>
          <DashboardLayout>
            <Bookings />
          </DashboardLayout>
        </ProtectedRoute>
      } />
   
      </Routes>
    </BrowserRouter>
  )
}

export default App