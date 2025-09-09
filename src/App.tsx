// partner-web/src/App.tsx
import { useState } from "react";
import { Route, Routes, Navigate, Link, NavLink } from "react-router-dom";

// Páginas públicas
import Home from "./pages/Home";
import CustomerOTP from "./pages/CustomerOTP";
import LoginStaff from "./pages/LoginStaff";
import Unauthorized from "./pages/Unauthorized";

// Panel (protegido negocio)
import Dashboard from "./pages/Dashboard";
import CustomersNew from "./pages/CustomersNew";
import CustomerDetail from "./pages/CustomerDetail";
import StaffNew from "./pages/StaffNew";

// CPanel (superadmin)
import CPanelAdminDashboard from "./pages/CPanelAdminDashboard";

import ProtectedRoute from "./components/ProtectedRoute";

export default function App(): JSX.Element {
  const [open, setOpen] = useState<boolean>(false);

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
            <NavLink to="/" className={navClass}>Inicio</NavLink>
            <NavLink to="/customer-auth" className={navClass}>Acceso clientes</NavLink>
            <NavLink to="/login" className={navClass}>Staff</NavLink>
            {/* Panel de negocio */}
            <NavLink to="/app" className={navClass}>Panel</NavLink>
            {/* CPanel (solo SUPERADMIN; el enlace puede mostrarse, el guard controla el acceso) */}
            <NavLink to="/cpanel" className={navClass}>CPanel</NavLink>
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
              <NavLink to="/" className={navClass} onClick={() => setOpen(false)}>Inicio</NavLink>
              <NavLink to="/customer-auth" className={navClass} onClick={() => setOpen(false)}>Acceso clientes</NavLink>
              <NavLink to="/login" className={navClass} onClick={() => setOpen(false)}>Staff</NavLink>
              <NavLink to="/app" className={navClass} onClick={() => setOpen(false)}>Panel</NavLink>
              {/* CPanel en móvil */}
              <NavLink to="/cpanel" className={navClass} onClick={() => setOpen(false)}>CPanel</NavLink>
            </div>
          </div>
        )}
      </header>

      {/* CONTENIDO */}
      <main className="flex-1 container-app py-6 sm:py-8">
        <Routes>
          {/* Públicas */}
          <Route path="/" element={<Home />} />
          <Route path="/customer-auth" element={<CustomerOTP />} />
          <Route path="/login" element={<LoginStaff />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Panel protegido bajo /app/* */}
          <Route
            path="/app"
            element={
              <ProtectedRoute roles={["ADMIN", "BARBER"]}>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/customers"
            element={
              <ProtectedRoute roles={["ADMIN", "BARBER"]}>
                {/* Si no tienes listado, puedes dejar temporalmente el “nuevo cliente” */}
                <CustomersNew />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/customers/new"
            element={
              <ProtectedRoute roles={["ADMIN", "BARBER"]}>
                <CustomersNew />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/customers/:id"
            element={
              <ProtectedRoute roles={["ADMIN", "BARBER"]}>
                <CustomerDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/staff/new"
            element={
              <ProtectedRoute roles={["ADMIN"]}>
                <StaffNew />
              </ProtectedRoute>
            }
          />

          {/* CPanel (SUPERADMIN) */}
          <Route
            path="/cpanel"
            element={
              <ProtectedRoute roles={["SUPERADMIN"]}>
                <CPanelAdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* FOOTER */}
      <footer className="mt-6">
        <div className="container-app py-6 text-xs text-slate-500">
          <div className="bg-white rounded-2xl shadow border border-slate-100">
            <div className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <p>© {new Date().getFullYear()} La Cubierta Barbería · Plataforma Axioma Partner</p>
              <p className="text-slate-400">Hecho con <span className="text-brand-gold">★</span> por Axioma Creativa</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
