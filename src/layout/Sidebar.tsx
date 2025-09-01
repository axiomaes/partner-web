import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSession, isAdmin } from "@/shared/auth";

const Item = ({ to, label, onClick }: { to: string; label: string; onClick?: () => void }) => {
  const { pathname } = useLocation();
  const active = pathname === to;
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`block px-3 py-2 rounded ${active ? "bg-blue-600 text-white" : "hover:bg-gray-100"}`}
    >
      {label}
    </Link>
  );
};

export default function Sidebar() {
  const { role } = useSession();
  const admin = isAdmin(role);
  const [open, setOpen] = useState(false); // móvil: cerrado por defecto

  // cierra el menú al navegar
  const { pathname } = useLocation();
  useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <>
      {/* Botón hamburguesa en móvil */}
      <div className="md:hidden sticky top-0 z-40 bg-white/80 backdrop-blur border-b">
        <div className="flex items-center justify-between p-3">
          <Link to="/" className="font-medium">Axioma</Link>
          <button
            aria-label="Abrir menú"
            className="p-2 border rounded"
            onClick={() => setOpen(true)}
          >
            ☰
          </button>
        </div>
      </div>

      {/* Drawer móvil */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 bg-white shadow-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <Link to="/" className="text-sm text-gray-500">Axioma</Link>
              <button className="p-1 border rounded" onClick={() => setOpen(false)}>✕</button>
            </div>
            <nav className="space-y-1">
              <div className="text-xs uppercase text-gray-400 px-1 pt-2">Clientes</div>
              <Item to="/app" label="Listado" onClick={() => setOpen(false)} />
              {admin && <Item to="/app/customers/new" label="Crear cliente" onClick={() => setOpen(false)} />}

              <div className="text-xs uppercase text-gray-400 px-1 pt-4">Equipo</div>
              {admin ? (
                <Item to="/app/staff/new" label="Crear staff" onClick={() => setOpen(false)} />
              ) : (
                <div className="px-1 py-2 text-gray-400 text-sm">Solo admin</div>
              )}

              <div className="text-xs uppercase text-gray-400 px-1 pt-4">Portal</div>
              <Item to="/portal" label="Portal de cliente" onClick={() => setOpen(false)} />
            </nav>
          </aside>
        </div>
      )}

      {/* Sidebar desktop */}
      <aside className="hidden md:block border-r min-h-screen w-64">
        <div className="flex items-center justify-between p-3">
          <Link to="/" className="text-sm text-gray-500">Axioma</Link>
        </div>
        <nav className="p-2 space-y-1">
          <div className="text-xs uppercase text-gray-400 px-3 pt-2">Clientes</div>
          <Item to="/app" label="Listado" />
          {admin && <Item to="/app/customers/new" label="Crear cliente" />}

          <div className="text-xs uppercase text-gray-400 px-3 pt-4">Equipo</div>
          {admin ? <Item to="/app/staff/new" label="Crear staff" /> : <div className="px-3 py-2 text-gray-400 text-sm">Solo admin</div>}

          <div className="text-xs uppercase text-gray-400 px-3 pt-4">Portal</div>
          <Item to="/portal" label="Portal de cliente" />
        </nav>
      </aside>
    </>
  );
}
