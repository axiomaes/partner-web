import { Link, useNavigate } from "react-router-dom";
import { ReactNode, useState } from "react";
import { BRAND } from "@/shared/brand";
import { useSession, clearSession, isAdmin } from "@/shared/auth";

type Props = {
  title?: string;
  subtitle?: React.ReactNode;
  children: ReactNode;
};

export default function AppLayout({ title, subtitle, children }: Props) {
  const s = useSession();
  const nav = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAuth = !!s.token;
  const displayName = s.name || s.email || "Cuenta";
  const admin = isAdmin(s.role);

  const onLogout = () => {
    clearSession();
    nav("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-base-200">
      {/* Topbar */}
      <header className="navbar bg-base-100 border-b sticky top-0 z-40">
        <div className="flex-1 gap-3">
          <button
            className="btn btn-ghost btn-square md:hidden"
            aria-label="Abrir menú"
            onClick={() => setMobileOpen(true)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeWidth="1.8" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"/>
            </svg>
          </button>

          <Link to="/" className="btn btn-ghost gap-3 px-2">
            <img
              src={BRAND.logoUrl}
              alt={BRAND.name}
              className="h-6 w-auto sm:h-7"
              loading="eager"
              decoding="async"
            />
            <span className="font-semibold hidden sm:inline">{BRAND.shortName}</span>
          </Link>
        </div>

        <nav className="flex-none hidden md:flex gap-1">
          <Link to="/portal" className="btn btn-ghost btn-sm">Clientes</Link>
          <Link to="/app" className="btn btn-ghost btn-sm">Staff</Link>
          {admin && <Link to="/app/admin" className="btn btn-primary btn-sm">Admin</Link>}
        </nav>

        {/* Cuenta / Logout */}
        <div className="flex-none">
          {isAuth ? (
            <div className="dropdown dropdown-end">
              <label tabIndex={0} className="btn btn-ghost btn-sm">
                {displayName}
              </label>
              <ul tabIndex={0} className="menu dropdown-content bg-base-100 rounded-box shadow p-2 mt-2 w-52 border">
                <li className="menu-title px-2">{s.email}</li>
                <li><Link to="/app">Ir al panel</Link></li>
                <li><button onClick={onLogout}>Cerrar sesión</button></li>
              </ul>
            </div>
          ) : (
            <Link to="/login" className="btn btn-primary btn-sm">Entrar</Link>
          )}
        </div>
      </header>

      {/* Page header */}
      {(title || subtitle) && (
        <div className="max-w-6xl mx-auto w-full px-4 pt-5">
          {title && <h1 className="text-xl sm:text-2xl font-semibold">{BRAND.name} — {title}</h1>}
          {subtitle && <p className="text-sm opacity-70 mt-1">{subtitle}</p>}
        </div>
      )}

      {/* Content */}
      <main className="max-w-6xl mx-auto w-full p-4">{children}</main>

      {/* Mobile sheet */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-base-300/60 backdrop-blur-[2px]" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-80 bg-base-100 shadow-xl p-4 border-r">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm opacity-70">{BRAND.shortName}</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setMobileOpen(false)} aria-label="Cerrar">✕</button>
            </div>

            <p className="menu-title">Accesos</p>
            <ul className="menu rounded-box mb-2">
              <li><Link to="/portal" onClick={() => setMobileOpen(false)}>Clientes</Link></li>
              <li><Link to="/app" onClick={() => setMobileOpen(false)}>Staff</Link></li>
              {admin && <li><Link to="/app/admin" onClick={() => setMobileOpen(false)}>Admin</Link></li>}
            </ul>

            {isAuth && (
              <>
                <p className="menu-title">Cuenta</p>
                <ul className="menu rounded-box">
                  <li className="disabled"><span>{displayName}</span></li>
                  <li><button onClick={() => { setMobileOpen(false); onLogout(); }}>Cerrar sesión</button></li>
                </ul>
              </>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
