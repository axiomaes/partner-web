// partner-web/src/pages/Home.tsx
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

export default function Home() {
  const [open, setOpen] = useState(false); // sidebar (móvil)
  const { pathname } = useLocation();

  // Cierra el drawer al navegar
  useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <div className="min-h-screen flex bg-brand-cream">
      {/* ===== Sidebar Desktop ===== */}
      <aside className="hidden md:flex md:w-64 border-r bg-white">
        <div className="w-full p-4">
          <div className="px-2 py-1 text-xs uppercase text-slate-400">Axioma</div>
          <nav className="mt-2 space-y-1">
            <Link to="/app" className="block px-3 py-2 rounded hover:bg-gray-100">
              Acceso Staff
            </Link>
            <Link to="/portal" className="block px-3 py-2 rounded hover:bg-gray-100">
              Acceso Clientes
            </Link>
          </nav>

          <div className="mt-6 px-2 py-1 text-xs uppercase text-slate-400">Información</div>
          <nav className="mt-2 space-y-1">
            <a href="#reservas" className="block px-3 py-2 rounded hover:bg-gray-100">Reservas y turnos</a>
            <a href="#fidelizacion" className="block px-3 py-2 rounded hover:bg-gray-100">Clientes fieles</a>
          </nav>
        </div>
      </aside>

      {/* ===== Drawer / Topbar Móvil ===== */}
      <div className="md:hidden fixed top-0 inset-x-0 z-40 bg-white/80 backdrop-blur border-b">
        <div className="flex items-center justify-between p-3">
          <span className="font-medium">La Cubierta Barbería</span>
          <button
            aria-label="Abrir menú"
            className="p-2 border rounded"
            onClick={() => setOpen(true)}
          >
            ☰
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 bg-white shadow-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Axioma</span>
              <button className="p-1 border rounded" onClick={() => setOpen(false)}>✕</button>
            </div>
            <nav className="space-y-1">
              <div className="text-xs uppercase text-slate-400 px-1 pt-2">Accesos</div>
              <Link to="/app" onClick={() => setOpen(false)} className="block px-3 py-2 rounded hover:bg-gray-100">
                Acceso Staff
              </Link>
              <Link to="/portal" onClick={() => setOpen(false)} className="block px-3 py-2 rounded hover:bg-gray-100">
                Acceso Clientes
              </Link>

              <div className="text-xs uppercase text-slate-400 px-1 pt-4">Información</div>
              <a href="#reservas" onClick={() => setOpen(false)} className="block px-3 py-2 rounded hover:bg-gray-100">
                Reservas y turnos
              </a>
              <a href="#fidelizacion" onClick={() => setOpen(false)} className="block px-3 py-2 rounded hover:bg-gray-100">
                Clientes fieles
              </a>
            </nav>
          </aside>
        </div>
      )}

      {/* ===== Contenido ===== */}
      <main className="flex-1 min-h-screen">
        {/* separador para topbar móvil */}
        <div className="md:hidden h-14" />

        <div className="max-w-5xl mx-auto p-4 space-y-6">
          {/* Hero */}
          <section className="card overflow-hidden">
            <div className="card-body bg-gradient-to-br from-brand-primary to-brand-primaryDark text-white">
              <h1 className="text-2xl font-semibold tracking-tight">
                La Cubierta Barbería
              </h1>
              <p className="mt-1 text-white/80">
                Agenda, fidelización y mensajería en un mismo lugar.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <Link to="/app" className="button button-black">
                  Acceso Staff
                </Link>
                <Link to="/portal" className="button button-ghost">
                  Acceso Clientes
                </Link>
              </div>
            </div>
          </section>

          {/* Bloques rápidos */}
          <section className="grid sm:grid-cols-2 gap-3">
            <div id="reservas" className="card hover:shadow-soft transition">
              <div className="card-body">
                <h3 className="font-semibold">Reservas y turnos</h3>
                <p className="text-slate-600 text-sm">
                  Gestiona horarios, barberos y disponibilidad desde el panel.
                </p>
              </div>
            </div>
            <div id="fidelizacion" className="card hover:shadow-soft transition">
              <div className="card-body">
                <h3 className="font-semibold">Clientes fieles</h3>
                <p className="text-slate-600 text-sm">
                  Reglas de puntos, campañas y WhatsApp transaccional.
                </p>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="text-center text-xs text-slate-500 py-6">
            © {new Date().getFullYear()} Axioma Loyalty – La Cubierta Barbería
          </footer>
        </div>
      </main>
    </div>
  );
}
