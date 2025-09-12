import { PropsWithChildren } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { BRAND } from "@/shared/brand";
import { useSession, clearSession, isAdmin } from "@/shared/auth";

type Props = PropsWithChildren<{
  title?: string;
  subtitle?: string;
}>;

export default function AppLayout({ children, title, subtitle }: Props) {
  const nav = useNavigate();
  const loc = useLocation();
  const { name, email, role, token } = useSession();
  const isAuth = !!token;
  const admin = isAdmin(role);

  const logout = () => {
    clearSession();
    nav("/login", { replace: true });
  };

  // activa pestaña por prefijo
  const isPath = (prefix: string) => loc.pathname.startsWith(prefix);

  // logo → al panel correspondiente
  const logoHref = isAuth ? (admin ? "/app" : "/staff/checkin") : "/";

  return (
    <div className="min-h-screen bg-base-200">
      {/* Top bar */}
      <div className="navbar bg-base-100 border-b sticky top-0 z-40">
        <div className="flex-1">
          <Link to={logoHref} className="btn btn-ghost normal-case text-lg gap-2">
            <img src={BRAND.logoUrl} alt={BRAND.name} className="h-6 w-auto" />
            <span className="hidden sm:inline">{BRAND.shortName}</span>
          </Link>

          {/* Tabs */}
          <div className="tabs tabs-boxed ml-2">
            <NavLink
              to="/app/customers"
              className={() => `tab ${isPath("/app/customers") ? "tab-active" : ""}`}
            >
              Clientes
            </NavLink>

            {/* Staff = Check-in */}
            <NavLink
              to="/staff/checkin"
              className={() => `tab ${isPath("/staff") ? "tab-active" : ""}`}
            >
              Staff
            </NavLink>

            {/* Admin solo si es ADMIN/OWNER/SUPERADMIN */}
            {admin ? (
              <NavLink
                to="/app/admin"
                className={() => `tab ${isPath("/app/admin") ? "tab-active" : ""}`}
              >
                Admin
              </NavLink>
            ) : (
              <button className="tab tab-disabled" title="Solo ADMIN/OWNER/SUPERADMIN" aria-disabled="true">
                Admin
              </button>
            )}
          </div>
        </div>

        {/* Perfil */}
        <div className="flex-none">
          {isAuth ? (
            <div className="dropdown dropdown-end">
              <div tabIndex={0} role="button" className="btn btn-ghost">
                <div className="avatar placeholder">
                  <div className="bg-neutral text-neutral-content rounded-full w-7">
                    <span>{(name || email || "A").slice(0, 1).toUpperCase()}</span>
                  </div>
                </div>
                <span className="ml-2 hidden sm:inline text-sm">{email}</span>
              </div>
              <ul tabIndex={0} className="menu dropdown-content bg-base-100 rounded-box z-[1] mt-2 w-64 p-2 shadow">
                <li className="menu-title">{email}</li>
                <li><Link to="/app">Ir al panel</Link></li>
                {admin && <li><Link to="/app/admin">Administración</Link></li>}
                <li><button onClick={logout}>Cerrar sesión</button></li>
              </ul>
            </div>
          ) : (
            <Link to="/login" className="btn btn-primary btn-sm">Entrar</Link>
          )}
        </div>
      </div>

      {/* Cabecera */}
      {(title || subtitle) && (
        <div className="max-w-6xl mx-auto px-4 py-4">
          {title && <h1 className="text-xl font-semibold">{title}</h1>}
          {subtitle && <p className="text-sm opacity-70">{subtitle}</p>}
        </div>
      )}

      {/* Contenido */}
      <div className="max-w-6xl mx-auto p-4">{children}</div>

      {/* Pie */}
      <footer className="mt-10 border-t py-6 text-center text-xs opacity-70">
        © {new Date().getFullYear()} Axioma Loyalty · {BRAND.name} ·{" "}
        <a className="link" href="/legal/privacidad">Privacidad</a> ·{" "}
        <a className="link" href="/legal/aviso">Aviso legal</a> ·{" "}
        <a className="link" href="/legal/cookies">Cookies</a>
      </footer>
    </div>
  );
}
