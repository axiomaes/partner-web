// partner-web/src/App.tsx
import { useState } from "react";
import { Route, Routes, Navigate, Link, NavLink } from "react-router-dom";
import Home from "./pages/Home";
import CustomerOTP from "./pages/CustomerOTP";
import LoginStaff from "./pages/LoginStaff";
import Dashboard from "./pages/Dashboard";
import Unauthorized from "./pages/Unauthorized";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminPanel from "./pages/AdminPanel"; // <-- nuevo
import { useSession, isAdmin as isAdminFn } from "@/shared/auth"; // <-- para mostrar link condicional

export default function App(): JSX.Element {
  const [open, setOpen] = useState<boolean>(false);

  const { role } = useSession();
  const isAdmin = isAdminFn(role);

  const navClass = ({ isActive }: { isActive: boolean }): string =>
    isActive ? "nav-link-active" : "nav-link";

  return (
    <div className="min-h-dvh flex flex-col bg-brand-cream">
      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-brand-primary to-brand-primary-dark text-white shadow">
        <div className="container-app h-14 flex items-center justify-between gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 font-semibold tracking-wide"
            onClick={() => setOpen(false)}
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/15">
              ✂️
            </span>
            <span className="hidden xs:block">La Cubierta Barbería</span>
          </Link>

          {/* Navegación desktop */}
          <nav className="hidden sm:flex items-center gap-2 text-sm">
            <NavLink to="/" className={navClass}>
              Inicio
            </NavLink>
            <NavLink to="/customer-auth" className={navClass}>
              Acceso clientes
            </NavLink>
            <NavLink to="/login" className={navClass}>
              Staff
            </NavLink>
            <NavLink to="/dashboard" className={navClass}>
              Panel
            </NavLink>
            {isAdmin && (
              <NavLink to="/admin" className={navClass}>
                Admin
              </NavLink>
            )}
          </nav>

          {/* Botón menú móvil */}
          <button
            aria-label="Abrir menú"
            className="sm:hidden nav-link-base text-white hover:bg-white/10"
            onClick={() => setOpen((v) => !v)}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Menú móvil */}
        {open && (
          <div className="sm:hidden bg-brand-primary-dark/95 text-white border-t border-white/10 shadow-lg backdrop-blur">
            <div className="container-app py-2 flex flex-col">
              <NavLink to="/" className={navClass} onClick={() => setOpen(false)}>
                Inicio
              </NavLink>
              <NavLink to="/customer-auth" className={navClass} onClick={() => setOpen(false)}>
                Acceso clientes
              </NavLink>
              <NavLink to="/login" className={navClass} onClick={() => setOpen(false)}>
                Staff
              </NavLink>
              <NavLink to="/dashboard" className={navClass} onClick={() => setOpen(false)}>
                Panel
              </NavLink>
              {isAdmin && (
                <NavLink to="/admin" className={navClass} onClick={() => setOpen(false)}>
                  Admin
                </NavLink>
              )}
            </div>
          </div>
        )}
      </header>

      {/* CONTENIDO */}
      <main className="flex-1 container-app py-6 sm:py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/customer-auth" element={<CustomerOTP />} />
          <Route path="/login" element={<LoginStaff />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Panel staff/admin (ambos roles) */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute roles={["ADMIN", "BARBER"]}>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Admin Panel (solo ADMIN) */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={["ADMIN"]}>
                <AdminPanel />
              </ProtectedRoute>
            }
          />
          {/* Alias de compatibilidad */}
          <Route path="/app/admin" element={<Navigate to="/admin" replace />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* FOOTER */}
      <footer className="mt-6">
        <div className="container-app py-6 text-xs text-slate-500">
          <div className="bg-white rounded-2xl shadow border border-slate-100">
            <div className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <p>© {new Date().getFullYear()} La Cubierta Barbería · Plataforma Axioma Partner</p>
              <p className="text-slate-400">
                Hecho con <span className="text-brand-gold">★</span> por Axioma Creativa
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
