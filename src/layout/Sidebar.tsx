import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSession, isAdmin } from "@/shared/auth";

const Item = ({ to, label }: { to: string; label: string }) => {
  const { pathname } = useLocation();
  const active = pathname === to;
  return (
    <Link
      to={to}
      className={`block px-3 py-2 rounded ${active ? "bg-blue-600 text-white" : "hover:bg-gray-100"}`}
    >
      {label}
    </Link>
  );
};

export default function Sidebar() {
  const [open, setOpen] = useState(true);
  const { role } = useSession();
  const admin = isAdmin(role);

  return (
    <aside className={`border-r min-h-screen ${open ? "w-64" : "w-14"} transition-all`}>
      <div className="flex items-center justify-between p-3">
        <button onClick={() => setOpen(o => !o)} className="text-sm px-2 py-1 border rounded">
          {open ? "«" : "»"}
        </button>
        {open && <span className="text-sm text-gray-500">Axioma</span>}
      </div>
      <nav className="p-2 space-y-1">
        {open ? (
          <>
            <div className="text-xs uppercase text-gray-400 px-3 pt-2">Clientes</div>
            <Item to="/" label="Listado" />
            {admin && <Item to="/customers/new" label="Crear cliente" />}

            <div className="text-xs uppercase text-gray-400 px-3 pt-4">Equipo</div>
            {admin ? <Item to="/staff/new" label="Crear staff" /> : <div className="px-3 py-2 text-gray-400 text-sm">Solo admin</div>}

            <div className="text-xs uppercase text-gray-400 px-3 pt-4">Portal</div>
            <Item to="/portal" label="Portal de cliente" />
          </>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Link to="/" className="text-lg">👥</Link>
            {admin && <Link to="/customers/new" className="text-lg">➕</Link>}
            {admin && <Link to="/staff/new" className="text-lg">👤</Link>}
            <Link to="/portal" className="text-lg">⭐</Link>
          </div>
        )}
      </nav>
    </aside>
  );
}
