// partner-web/src/pages/Home.tsx
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { BRAND } from "@/shared/brand";

export default function Home() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const nav = useNavigate();
  useEffect(() => setOpen(false), [pathname]);

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
            <li><Link to="/app/admin" className="justify-start">Administrador</Link></li>
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
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
            </button>
            <Link to="/" className="btn btn-ghost text-lg normal-case gap-2">
              <img src={BRAND.logoUrl} alt={BRAND.name} className="h-6 w-auto" />
              {BRAND.shortName}
            </Link>
          </div>
        </div>
      </div>

      {open && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-80 bg-base-100 shadow-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm opacity-70">{BRAND.shortName}</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setOpen(false)} aria-label="Cerrar">✕</button>
            </div>

            <p className="menu-title">Accesos</p>
            <ul className="menu rounded-box mb-2">
              <li><Link to="/portal" onClick={() => setOpen(false)}>Acceso Clientes</Link></li>
              <li><Link to="/app" onClick={() => setOpen(false)}>Acceso Staff</Link></li>
              <li><Link to="/app/admin" onClick={() => setOpen(false)}>Administrador</Link></li>
            </ul>

            <p className="menu-title">Información</p>
            <ul className="menu rounded-box">
              <li><a href="#reservas" onClick={() => setOpen(false)}>Reservas y turnos</a></li>
              <li><a href="#fidelizacion" onClick={() => setOpen(false)}>Clientes fieles</a></li>
            </ul>
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
                    <Link to="/app" className="btn btn-outline h-20">Staff</Link>
                    <Link to="/app/admin" className="btn btn-outline h-20">Administrador</Link>
                  </div>
                </div>
              </div>

              <div className="w-full md:w-80">
                <div className="card bg-base-100 text-base-content shadow-md">
                  <div className="card-body">
                    <h3 className="card-title">Hoy</h3>
                    <p className="text-sm opacity-70">Revisa citas, visitas y recompensas.</p>
                    <div className="card-actions justify-end">
                      <Link to="/app" className="btn btn-sm btn-primary">Ir al panel</Link>
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

          {/* Footer propio de Home */}
          <footer className="mt-8 border-t border-base-300 pt-6">
            <div className="text-sm text-base-content/70 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
              <span>© {new Date().getFullYear()} Axioma Loyalty · {BRAND.name}</span>
              <nav className="flex items-center gap-x-4">
                <Link to="/legal/privacidad" className="link link-primary link-hover">
                  Privacidad
                </Link>
                <span className="text-base-content/40">·</span>
                <Link to="/legal/aviso-legal" className="link link-primary link-hover">
                  Aviso legal
                </Link>
                <span className="text-base-content/40">·</span>
                <Link to="/legal/cookies" className="link link-primary link-hover">
                  Cookies
                </Link>
              </nav>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}
