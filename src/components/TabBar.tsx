import { NavLink } from "react-router-dom";
import { Home, UsersRound, LogIn, LayoutDashboard } from "lucide-react";

export default function TabBar() {
  const linkBase = "flex flex-col items-center justify-center gap-1 py-2 text-[11px] transition";
  const cn = (isActive: boolean) => `${linkBase} ${isActive ? "text-blue-600" : "text-slate-600"}`;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 sm:hidden"
      aria-label="Navegación principal"
    >
      <ul className="mx-auto grid max-w-md grid-cols-4">
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
