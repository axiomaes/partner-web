import { Route, Routes, Navigate, Link } from "react-router-dom";
import Home from "./pages/Home";
import CustomerOTP from "./pages/CustomerOTP";
import LoginStaff from "./pages/LoginStaff";
import Dashboard from "./pages/Dashboard";
import Unauthorized from "./pages/Unauthorized";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow">
        <nav className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link to="/" className="font-semibold">AxiomaPartner</Link>
          <div className="ml-auto flex gap-3 text-sm">
            <Link to="/customer-auth" className="text-blue-600">Acceso clientes</Link>
            <Link to="/login" className="text-blue-600">Staff</Link>
          </div>
        </nav>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/customer-auth" element={<CustomerOTP />} />
          <Route path="/login" element={<LoginStaff />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Protegidas: admin u operador (BARBER) */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute roles={["ADMIN", "BARBER"]}>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
