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

// Guards
import ProtectedRoute from "./components/ProtectedRoute";
import ProtectedCpanelRoute from "./components/ProtectedCpanelRoute";

// 🔧 Limpia SW/cachés en cliente
import DisablePWA from "./components/DisablePWA";

import { useSession, isSuperAdmin } from "@/shared/auth";

export default function App(): JSX.Element {
  const [open, setOpen] = useState(false);
  const s = useSession();

  // Evita “parpadeo” por redirecciones hasta que la sesión esté hidratada
  if (!s.ready) {
    return (
      <div className="min-h-dvh grid place-items-center bg-brand-cream">
        <div className="text-sm text-slate-500">Cargando…</div>
      </div>
    );
  }

  const isAuth = !!s.token;
  const isSuper = isSuperAdmin(s);
  // Lista blanca opcional para CPanel (además del guard)
  const isAllowedSuper = isSuper && s.email?.toLowerCase() === "admin@axioma-creativa.es";

  const navClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? "nav-link-active" : "nav-link";

  return (
    <div className="min-h-dvh flex flex-col bg-brand-cream">
      {/* Mata SW/caches en clientes que aún lo tengan */}
      <DisablePWA />

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
                {isAllowedSuper && (
                  <NavLink to="/cpanel" className={navClass}>
                    CPanel
                  </NavLink>
                )}
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

        {/* Menú móvil */}
        {open && (
          <div className="sm:hidden bg-brand-primary-dark/95 text-white border-t border-white/10 shadow-lg backdrop-blur">
            <div className="container-app py-2 flex flex-col">
              {!isAuth ? (
                <NavLink to="/login" className={navClass} onClick={() => setOpen(false)}>
                  Entrar
                </NavLink>
              ) : (
                <>
                  <NavLink to="/app" className={navClass} onClick={() => setOpen(false)}>
                    Panel
                  </NavLink>
                  {isAllowedSuper && (
                    <NavLink to="/cpanel" className={navClass} onClick={() => setOpen(false)}>
                      CPanel
                    </NavLink>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* CONTENIDO */}
      <main className="flex-1 container-app py-6 sm:py-8">
        <Routes>
          {/* Router inteligente */}
          <Route path="/" element={<Home />} />

          {/* Público portal OTP */}
          <Route path="/customer-auth" element={<CustomerOTP />} />
          <Route path="/login" element={<LoginStaff />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Panel negocio (OWNER/ADMIN/BARBER) */}
          <Route
            path="/app"
            element={
              <ProtectedRoute roles={["OWNER", "ADMIN", "BARBER"]}>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/customers"
            element={
              <ProtectedRoute roles={["OWNER", "ADMIN", "BARBER"]}>
                <CustomersNew />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/customers/new"
            element={
              <ProtectedRoute roles={["OWNER", "ADMIN", "BARBER"]}>
                <CustomersNew />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/customers/:id"
            element={
              <ProtectedRoute roles={["OWNER", "ADMIN", "BARBER"]}>
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

          {/* CPanel súperadmin allowlisted */}
          <Route
            path="/cpanel/*"
            element={
              <ProtectedCpanelRoute>
                <CPanelAdminDashboard />
              </ProtectedCpanelRoute>
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
