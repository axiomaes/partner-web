// partner-web/src/App.tsx
import { useState } from "react";
import { Route, Routes, Navigate, Link, NavLink, useNavigate } from "react-router-dom";

// Páginas públicas
import LoginStaff from "./pages/LoginStaff";
import CustomerOTP from "./pages/CustomerOTP";
import Unauthorized from "./pages/Unauthorized";

// Panel (protegido negocio)
import Dashboard from "./pages/Dashboard";
import CustomersNew from "./pages/CustomersNew";
import CustomerDetail from "./pages/CustomerDetail";
import StaffNew from "./pages/StaffNew";
import StaffCheckin from "./pages/StaffCheckin"; // 👈 añadido

// CPanel (superadmin)
import CPanelAdminDashboard from "./pages/CPanelAdminDashboard";

// Guards
import ProtectedRoute from "./components/ProtectedRoute";
import ProtectedCpanelRoute from "./components/ProtectedCpanelRoute";

import { useSession, isSuperAdmin, clearSession } from "@/shared/auth";
import { postLoginPathByRole } from "@/shared/api";

function Header({
  isAuth,
  isSuper,
  onLogout,
  setOpen,
}: {
  isAuth: boolean;
  isSuper: boolean;
  onLogout: () => void;
  setOpen: (v: (old: boolean) => boolean) => void;
}) {
  const navClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? "nav-link-active" : "nav-link";

  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-brand-primary to-brand-primary-dark text-white shadow">
      <div className="container-app h-14 flex items-center justify-between gap-3">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 font-semibold tracking-wide"
          onClick={() => setOpen(() => false)}
        >
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/15">
            ✂️
          </span>
          <span className="hidden xs:block">Axioma Loyalty</span>
        </Link>

        {/* Navegación desktop */}
        <nav className="hidden sm:flex items-center gap-2 text-sm">
          {!isAuth ? (
            <NavLink to="/login" className={navClass}>
              Entrar
            </NavLink>
          ) : (
            <>
              <NavLink to="/app" className={navClass}>
                Panel
              </NavLink>
              <NavLink to="/staff/checkin" className={navClass}>
                Check-in
              </NavLink>
              {isSuper && (
                <NavLink to="/cpanel" className={navClass}>
                  CPanel
                </NavLink>
              )}
              <button
                className="nav-link-base hover:bg-white/10 rounded-md px-3 py-1"
                onClick={onLogout}
              >
                Cerrar sesión
              </button>
            </>
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
    </header>
  );
}

export default function App(): JSX.Element {
  const [open, setOpen] = useState(false);
  const s = useSession();
  const nav = useNavigate();

  if (!s.ready) {
    return (
      <div className="min-h-dvh grid place-items-center bg-brand-cream">
        <div className="text-sm text-slate-500">Cargando…</div>
      </div>
    );
  }

  const isAuth = !!s.token;
  const isSuper = isSuperAdmin(s);

  const handleLogout = () => {
    clearSession();
    nav("/login", { replace: true });
    setOpen(() => false);
  };

  return (
    <div className="min-h-dvh flex flex-col bg-brand-cream">
      <Header isAuth={isAuth} isSuper={isSuper} onLogout={handleLogout} setOpen={setOpen} />

      {/* Menú móvil */}
      {open && (
        <div className="sm:hidden bg-brand-primary-dark/95 text-white border-t border-white/10 shadow-lg backdrop-blur">
          <div className="container-app py-2 flex flex-col">
            {!isAuth ? (
              <NavLink to="/login" className={({ isActive }) => (isActive ? "nav-link-active" : "nav-link")} onClick={() => setOpen(false)}>
                Entrar
              </NavLink>
            ) : (
              <>
                <NavLink to="/app" className={({ isActive }) => (isActive ? "nav-link-active" : "nav-link")} onClick={() => setOpen(false)}>
                  Panel
                </NavLink>
                <NavLink to="/staff/checkin" className={({ isActive }) => (isActive ? "nav-link-active" : "nav-link")} onClick={() => setOpen(false)}>
                  Check-in
                </NavLink>
                {isSuper && (
                  <NavLink to="/cpanel" className={({ isActive }) => (isActive ? "nav-link-active" : "nav-link")} onClick={() => setOpen(false)}>
                    CPanel
                  </NavLink>
                )}
                <button className="nav-link text-left" onClick={handleLogout}>
                  Cerrar sesión
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* CONTENIDO */}
      <main className="flex-1 container-app py-6 sm:py-8">
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route
            path="/login"
            element={
              isAuth
                ? <Navigate to={postLoginPathByRole ? postLoginPathByRole(s.role) : (isSuper ? "/cpanel" : "/app")} replace />
                : <LoginStaff />
            }
          />

          {/* Portal clientes */}
          <Route path="/customer-auth" element={<CustomerOTP />} />
          <Route path="/portal" element={<CustomerOTP />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Panel negocio */}
          <Route path="/app" element={<ProtectedRoute roles={["OWNER", "ADMIN", "BARBER"]}><Dashboard /></ProtectedRoute>} />
          <Route path="/app/customers" element={<ProtectedRoute roles={["OWNER", "ADMIN", "BARBER"]}><CustomersNew /></ProtectedRoute>} />
          <Route path="/app/customers/new" element={<ProtectedRoute roles={["OWNER", "ADMIN", "BARBER"]}><CustomersNew /></ProtectedRoute>} />
          <Route path="/app/customers/:id" element={<ProtectedRoute roles={["OWNER", "ADMIN", "BARBER"]}><CustomerDetail /></ProtectedRoute>} />
          <Route path="/app/staff/new" element={<ProtectedRoute roles={["ADMIN"]}><StaffNew /></ProtectedRoute>} />

          {/* Staff Check-in */}
          <Route path="/staff/checkin" element={<ProtectedRoute roles={["OWNER", "ADMIN", "BARBER", "SUPERADMIN"]}><StaffCheckin /></ProtectedRoute>} />

          {/* CPanel súperadmin */}
          <Route path="/cpanel/*" element={<ProtectedCpanelRoute><CPanelAdminDashboard /></ProtectedCpanelRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </main>

      {/* FOOTER */}
      <footer className="mt-6">
        <div className="container-app py-6 text-xs text-slate-500">
          <div className="bg-white rounded-2xl shadow border border-slate-100">
            <div className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <p>© {new Date().getFullYear()} Axioma Loyalty</p>
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
