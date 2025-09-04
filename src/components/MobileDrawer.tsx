import { BRAND } from "@/shared/brand";
import { useNavigate } from "react-router-dom";
import { useSession, clearSession } from "@/shared/auth";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function MobileDrawer({ open, onClose }: Props) {
  const nav = useNavigate();
  const { email, token } = useSession();
  const isAuth = !!token;

  const go = (to: string) => {
    onClose();
    nav(to);
  };

  const onLogout = () => {
    clearSession();
    onClose();
    nav("/login", { replace: true });
  };

  if (!open) return null;

  return (
    <div className="md:hidden fixed inset-0 z-50" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <aside className="relative h-full w-[85%] max-w-96 bg-base-100 border-r border-base-300 shadow-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <img src={BRAND.logoUrl} alt={BRAND.name} className="h-6 w-auto" />
            <span className="font-medium">{BRAND.shortName}</span>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </div>

        <p className="menu-title">Accesos</p>
        <ul className="menu rounded-box mb-2">
          <li><button className="justify-start text-base-content" onClick={() => go("/portal")}>Acceso Clientes</button></li>
          <li><button className="justify-start text-base-content" onClick={() => go("/app")}>Acceso Staff</button></li>
          <li><button className="justify-start text-base-content" onClick={() => go("/app/admin")}>Administrador</button></li>
        </ul>

        <p className="menu-title">Información</p>
        <ul className="menu rounded-box">
          <li><a className="justify-start text-base-content" href="#reservas" onClick={onClose}>Reservas y turnos</a></li>
          <li><a className="justify-start text-base-content" href="#fidelizacion" onClick={onClose}>Clientes fieles</a></li>
        </ul>

        <div className="mt-4 pt-3 border-t border-base-300">
          {isAuth ? (
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs opacity-70 truncate">{email}</div>
              <button className="btn btn-outline btn-sm" onClick={onLogout}>Cerrar sesión</button>
            </div>
          ) : (
            <button className="btn btn-outline btn-sm w-full" onClick={() => go("/login")}>
              Iniciar sesión
            </button>
          )}
        </div>
      </aside>
    </div>
  );
}
