import { useState } from "react";
import { Route, Routes, Navigate, Link, NavLink } from "react-router-dom";
import Home from "./pages/Home";
import CustomerOTP from "./pages/CustomerOTP";
import LoginStaff from "./pages/LoginStaff";
import Dashboard from "./pages/Dashboard";
import Unauthorized from "./pages/Unauthorized";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App(): JSX.Element {
  const [open, setOpen] = useState<boolean>(false);

  // Base común para links del header
  const navBase =
    "px-2 py-1 rounded transition focus:outline-none focus:ring-2 focus:ring-white/30";

  // NavLink con estado activo/inactivo
  const navClass = ({ isActive }: { isActive: boolean }): string =>
    `${navBase} ${
      isActive
        ? "font-semibold underline decoration-2 underline-offset-4"
        : "opacity-90 hover:bg-white/10"
    }`;

  return (
    <div className="bg-brand-cream flex min-h-dvh flex-col">
      {/* HEADER */}
      <header className="from-brand-primary to-brand-primaryDark sticky top-0 z-40 bg-gradient-to-r text-white shadow">
        <div className="container-app flex h-14 items-center justify-between gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 font-semibold tracking-wide"
            onClick={() => setOpen(false)}
          >
            {/* Placeholder de logo — luego lo reemplazamos por imagen */}
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/15">
              ✂️
            </span>
            <span className="xs:block hidden">La Cubierta Barbería</span>
          </Link>

          {/* Navegación desktop */}
          <nav className="hidden items-center gap-2 text-sm sm:flex">
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
          </nav>

          {/* Botón menú móvil */}
          <button
            aria-label="Abrir menú"
            className={`sm:hidden ${navBase} hover:bg-white/10`}
            onClick={() => setOpen((v) => !v)}
          >
            {/* Ícono hamburguesa simple */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M4 7h16M4 12h16M4 17h16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Menú móvil desplegable */}
        {open && (
          <div className="border-t border-white/10 sm:hidden">
            <div className="container-app flex flex-col py-2">
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
            </div>
          </div>
        )}
      </header>

      {/* CONTENIDO */}
      <main className="section flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/customer-auth" element={<CustomerOTP />} />
          <Route path="/login" element={<LoginStaff />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
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

      {/* FOOTER */}
      <footer className="mt-6">
        <div className="container-app py-6 text-xs text-slate-500">
          <div className="card">
            <div className="card-body flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
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
