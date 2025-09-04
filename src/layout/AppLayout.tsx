// partner-web/src/layout/AppLayout.tsx
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { ReactNode, useMemo } from "react";
import { BRAND } from "@/shared/brand";
import { useSession, clearSession } from "@/shared/auth";

type Props = {
  title?: string;
  subtitle?: React.ReactNode;
  children: ReactNode;
};

export default function AppLayout({ title, subtitle, children }: Props) {
  const nav = useNavigate();
  const { pathname } = useLocation();

  // useSession ahora expone campos planos
  const s = useSession();
  const isAuth = !!s.token;
  const email = s.email || "";
  const initials = useMemo(() => (s.name || email || BRAND.shortName)
    .trim()
    .slice(0, 2)
    .toUpperCase(), [s.name, email]);

  const onLogout = () => {
    clearSession();
    nav("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-base-200">
      {/* Topbar */}
      <header className="navbar sticky top-0 z-40 bg-base-100/90 backdrop-blur border-b">
        {/* Brand */}
        <div className="flex-1 gap-3">
          <Link to="/" className="btn btn-ghost gap-3 px-2">
            <img
              src={BRAND.logoUrl}
              alt={BRAND.name}
              className="h-6 w-auto sm:h-7"
              loading="eager"
              decoding="async"
            />
            <span className="font-semibold hidden sm:inline">
              {BRAND.shortName}
            </span>
          </Link>

          {/* Tabs (scrollables en móvil) */}
          <nav className="hidden sm:flex items-center">
            <ul className="menu menu-horizontal px-0">
              <li>
                <NavLink
                  to="/app/customers"
                  className={({ isActive }) =>
                    `rounded-btn ${isActive || pathname.startsWith("/app/customers")
                      ? "bg-base-200 font-medium"
                      : "hover:bg-base-200"}`
                  }
                >
                  Clientes
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/app"
                  end
                  className={({ isActive }) =>
                    `rounded-btn ${isActive && pathname === "/app"
                      ? "bg-base-200 font-medium"
                      : "hover:bg-base-200"}`
                  }
                >
                  Staff
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/app/admin"
                  className={({ isActive }) =>
                    `rounded-btn ${isActive || pathname.startsWith("/app/admin")
                      ? "bg-base-200 font-medium"
                      : "hover:bg-base-200"}`
                  }
                >
                  Admin
                </NavLink>
              </li>
            </ul>
          </nav>
        </div>

        {/* Usuario / Login */}
        <div className="flex-none">
          {isAuth ? (
            <div className="dropdown dropdown-end">
              <label tabIndex={0} className="btn btn-ghost gap-2">
                <div className="avatar placeholder">
                  <div className="bg-primary text-primary-content rounded-full w-8">
                    <span className="text-sm">{initials}</span>
                  </div>
                </div>
                <span className="hidden md:inline text-sm truncate max-w-40">
                  {email}
                </span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="size-4 opacity-60"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.233l3.71-4.004a.75.75 0 1 1 1.08 1.04l-4.24 4.58a.75.75 0 0 1-1.08 0l-4.24-4.58a.75.75 0 0 1 .02-1.06z"/>
                </svg>
              </label>
              <ul
                tabIndex={0}
                className="dropdown-content menu menu-sm bg-base-100 rounded-xl shadow-lg ring-1 ring-base-300 w-64 mt-2 p-2"
              >
                <li className="px-3 py-2 text-xs opacity-70 truncate">{email}</li>
                <li><Link to="/app">Ir al panel</Link></li>
                <li>
                  <button onClick={onLogout} className="text-error">
                    Cerrar sesión
                  </button>
                </li>
              </ul>
            </div>
          ) : (
            <Link to="/login" className="btn btn-primary btn-sm">
              Iniciar sesión
            </Link>
          )}
        </div>
      </header>

      {/* Encabezado de página */}
      {(title || subtitle) && (
        <div className="max-w-6xl mx-auto w-full px-4 pt-5">
          {title && (
            <h1 className="text-xl sm:text-2xl font-semibold">
              {BRAND.name} — {title}
            </h1>
          )}
          {subtitle && <p className="text-sm opacity-70 mt-1">{subtitle}</p>}
        </div>
      )}

      {/* Contenido */}
      <main className="max-w-6xl mx-auto w-full p-4">{children}</main>
    </div>
  );
}
