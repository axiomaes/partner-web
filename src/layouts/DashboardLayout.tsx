import { Outlet, NavLink } from "react-router-dom";
import { Menu } from "lucide-react";

export default function DashboardLayout() {
  return (
    <div className="bg-brand-cream min-h-screen text-slate-800">
      {/* Topbar */}
      <header className="bg-brand-primary sticky top-0 z-40 text-white">
        <div className="container-app flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <button className="inline-flex rounded-md p-2 hover:bg-white/10 sm:hidden">
              <Menu className="size-5" />
            </button>
            <div className="font-semibold tracking-tight">Axioma Partner</div>
          </div>
          <nav className="hidden items-center gap-1 sm:flex">
            <NavLink to="/app" className="nav-link">
              Inicio
            </NavLink>
            <NavLink to="/app/clientes" className="nav-link">
              Clientes
            </NavLink>
            <NavLink to="/app/recompensas" className="nav-link">
              Recompensas
            </NavLink>
            <NavLink to="/app/noticias" className="nav-link">
              Noticias
            </NavLink>
          </nav>
        </div>
      </header>

      {/* Contenido */}
      <main className="section">
        <Outlet />
      </main>
    </div>
  );
}
