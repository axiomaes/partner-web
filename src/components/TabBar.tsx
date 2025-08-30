import { NavLink } from "react-router-dom";
import { Home, UsersRound, LogIn, LayoutDashboard } from "lucide-react";

export default function TabBar() {
  const linkBase =
    "flex flex-col items-center justify-center gap-1 py-2 text-[11px] transition";
  const cn = (isActive: boolean) =>
    `${linkBase} ${isActive ? "text-blue-600" : "text-slate-600"}`;

  return (
    <nav
      className="sm:hidden fixed bottom-0 inset-x-0 z-50 border-t bg-white/80 backdrop-blur
                 supports-[backdrop-filter]:bg-white/60"
      aria-label="Navegación principal"
    >
      <ul className="grid grid-cols-4 max-w-md mx-auto">
        <li>
          <NavLink to="/" className={({ isActive }) => cn(isActive)}>
            <Home size={20} aria-hidden="true" />
            <span>Inicio</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/customer-auth" className={({ isActive }) => cn(isActive)}>
            <UsersRound size={20} aria-hidden="true" />
            <span>Clientes</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/login" className={({ isActive }) => cn(isActive)}>
            <LogIn size={20} aria-hidden="true" />
            <span>Staff</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/dashboard" className={({ isActive }) => cn(isActive)}>
            <LayoutDashboard size={20} aria-hidden="true" />
            <span>Panel</span>
          </NavLink>
        </li>
      </ul>
    </nav>
  );
}
