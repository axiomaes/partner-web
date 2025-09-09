// partner-web/src/pages/Home.tsx
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { BRAND } from "@/shared/brand";
import { useSession, clearSession } from "@/shared/auth";

export default function Home() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const nav = useNavigate();

  // useSession devuelve: { id, name, email, role, token, ready }
  const s = useSession();
  const isAuth = !!s.token;
  const userEmail = s.email;
  const isSuper = s.role === "SUPERADMIN"; // 👈 clave para mostrar CPanel solo a SUPERADMIN

  useEffect(() => setOpen(false), [pathname]);

  const go = (to: string) => {
    setOpen(false);
    nav(to);
  };

  const onLogout = () => {
    clearSession();
    setOpen(false);
    nav("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-base-200 flex">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex md:w-72 bg-base-100 border-r">
        <div className="w-full p-4">
          <Link to="/" className="btn btn-ghost normal-case text-xl mb-2 gap-2">
            <img src={BRAND.logoUrl} alt={BRAND.name} className="h-6 w-auto" />
            {BRAND.shortName}
          </Link>

          <p className="menu-title">Accesos</p>
          <ul className="menu rounded-box">
            <li><Link to="/portal" className="justify-start">Acceso Clientes</Link></li>
            <li><Link to="/app" className="justify-start">Acceso Staff</Link></li>
            {isSuper && (
              <li><Link to="/cpanel" className="justify-start">CPanel</Link></li> // 👈 solo SUPERADMIN
            )}
          </ul>

          <p className="menu-title mt-4">Información</p>
          <ul className="menu rounded-box">
            <li><a href="#reservas" className="justify-start">Reservas y turnos</a></li>
            <li><a href="#fidelizacion" className="justify-start">Clientes fieles</a></li>
          </ul>
        </div>
      </aside>

      {/* Topbar móvil */}
      <div className="md:hidden fixed top-0 inset-x-0 z-40">
        <div className="navbar bg-base-100 border-b">
          <div className="flex-1">
            <button
              className="btn btn-ghost btn-square"
              onClick={() => setOpen(true)}
              aria-label="Abrir menú"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
            <Link to="/" className="btn btn-ghost text-lg normal-case gap-2">
              <img src={BRAND.logoUrl} alt={BRAND.name} className="h-6 w-auto" />
              {BRAND.shortName}
            </Link>
          </div>
        </div>
      </div>

      {/* Drawer móvil */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50" role="dialog" aria-modal="true">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <aside className="relative h-full w-[85%] max-w-96 bg-base-100 border-r border-base-300 shadow-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <img src={BRAND.logoUrl} alt={BRAND.name} className="h-6 w-auto" />
                <span className="font-medium">{BRAND.shortName}</span>
              </div>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setOpen(false)}
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            <p className="menu-title">Accesos</p>
            <ul className="menu rounded-box mb-2">
              <li>
                <button
                  className="justify-start text-base-content"
                  onClick={() => go("/portal")}
                >
                  Acceso Clientes
                </button>
              </li>
              <li>
                <button
                  className="justify-start text-base-content"
                  onClick={() => go("/app")}
                >
                  Acceso Staff
                </button>
              </li>
              {isSuper && (
                <li>
                  <button
                    className="justify-start text-base-content"
                    onClick={() => go("/cpanel")}  // 👈 solo SUPERADMIN
                  >
                    CPanel
                  </button>
                </li>
              )}
            </ul>

            <p className="menu-title">Información</p>
            <ul className="menu rounded-box">
              <li>
                <a
                  className="justify-start text-base-content"
                  href="#reservas"
                  onClick={() => setOpen(false)}
                >
                  Reservas y turnos
                </a>
              </li>
              <li>
                <a
                  className="justify-start text-base-content"
                  href="#fidelizacion"
                  onClick={() => setOpen(false)}
                >
                  Clientes fieles
                </a>
              </li>
            </ul>

            <div className="mt-4 pt-3 border-t border-base-300">
              {isAuth ? (
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs opacity-70 truncate">{userEmail}</div>
                  <button className="btn btn-outline btn-sm" onClick={onLogout}>
                    Cerrar sesión
                  </button>
                </div>
              ) : (
                <button className="btn btn-outline btn-sm w-full" onClick={() => go("/login")}>
                  Iniciar sesión
                </button>
              )}
            </div>
          </aside>
        </div>
      )}

      {/* Contenido */}
      <main className="flex-1 min-h-screen">
        <div className="md:hidden h-16" />
        <div className="max-w-6xl mx-auto p-4 space-y-6">
          <section className="hero rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-primary-content">
            <div className="hero-content flex-col items-stretch md:flex-row gap-6 py-10 w-full">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <img src={BRAND.logoUrl} alt={BRAND.name} className="h-10 w-auto" />
                  <h1 className="text-3xl font-bold">{BRAND.name}</h1>
                </div>
                <p className="opacity-90 mt-2">
                  Agenda, fidelización y mensajería en un mismo lugar.
                </p>

                <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => nav("/portal")}
                    className="sm:col-span-2 btn btn-primary btn-lg h-20 text-lg"
                  >
                    Acceso Clientes
                  </button>
                  <div className="grid grid-cols-2 sm:grid-cols-1 gap-3">
                    <Link to="/app" className="btn btn-outline h-20">
                      Staff
                    </Link>
                    {isSuper && (
                      <Link to="/cpanel" className="btn btn-outline h-20">
                        CPanel
                      </Link>
                    )}
                  </div>
                </div>
              </div>

              <div className="w-full md:w-80">
                <div className="card bg-base-100 text-base-content shadow-md">
                  <div className="card-body">
                    <h3 className="card-title">Hoy</h3>
                    <p className="text-sm opacity-70">
                      Revisa citas, visitas y recompensas.
                    </p>
                    <div className="card-actions justify-end">
                      <Link to={isAuth ? "/app" : "/login"} className="btn btn-sm btn-primary">
                        {isAuth ? "Ir al panel" : "Entrar"}
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="grid md:grid-cols-2 gap-4">
            <div id="reservas" className="card bg-base-100 shadow-sm">
              <div className="card-body">
                <h3 className="card-title">Reservas y turnos</h3>
                <p>Gestiona horarios, barberos y disponibilidad desde el panel.</p>
              </div>
            </div>

            <div id="fidelizacion" className="card bg-base-100 shadow-sm">
              <div className="card-body">
                <h3 className="card-title">Clientes fieles</h3>
                <p>Reglas de puntos, campañas y WhatsApp transaccional.</p>
              </div>
            </div>
          </section>

          <footer className="text-center text-xs opacity-70 py-8 space-x-2">
            © {new Date().getFullYear()} Axioma Loyalty · {BRAND.name}
            <a className="link ml-2" href="/legal/privacidad">Privacidad</a>
            <span>·</span>
            <a className="link" href="/legal/aviso">Aviso legal</a>
            <span>·</span>
            <a className="link" href="/legal/cookies">Cookies</a>
          </footer>
        </div>
      </main>
    </div>
  );
}
