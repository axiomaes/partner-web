// src/pages/Dashboard.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppLayout from "@/layout/AppLayout";
import { useSession, isAdmin, isOwner, isSuperAdmin } from "@/shared/auth";
import { api } from "@/shared/api";

type WaStatus = {
  enabled?: boolean;
  from?: string | null;
  dailyLimit?: number | null;
  ratePerMinute?: number | null;
  monthlyCap?: number | null;
};

export default function Dashboard() {
  const s = useSession();
  const first = (s.name || s.email || "").split(" ")[0] || "¡hola!";

  // Permisos
  const adminOrAbove = isAdmin(s.role); // ADMIN | OWNER | SUPERADMIN
  const ownerOrAbove = isOwner(s.role) || isSuperAdmin(s.role) || isAdmin(s.role);

  // Estado WhatsApp (informativo)
  const [wa, setWa] = useState<WaStatus | null>(null);
  useEffect(() => {
    let mounted = true;
    api
      .get("/wa/status", { validateStatus: () => true })
      .then((r) => {
        if (!mounted) return;
        if (r.status >= 200 && r.status < 300) setWa(r.data as WaStatus);
        else setWa(null);
      })
      .catch(() => mounted && setWa(null));
    return () => { mounted = false; };
  }, []);

  return (
    <AppLayout title="Panel" subtitle="Resumen general">
      {/* Accesos rápidos (todas rutas existentes en tu AppRouter) */}
      <div className="mb-4 flex flex-wrap gap-2">
        <Link to="/app/customers" className="btn btn-primary btn-sm" aria-label="Listado de clientes">
          Listado de clientes
        </Link>
        <Link to="/app/customers/new" className="btn btn-outline btn-sm" aria-label="Crear cliente">
          Crear cliente
        </Link>
        <Link to="/staff/checkin" className="btn btn-outline btn-sm" aria-label="Escanear QR">
          Escanear QR
        </Link>
        {/* Para gestión de staff, llevamos al AdminPanel y anclamos a la sección de staff */}
        {ownerOrAbove ? (
          <Link to="/app/admin#staff" className="btn btn-outline btn-sm" aria-label="Gestionar staff">
            Gestionar staff
          </Link>
        ) : null}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Bienvenida */}
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h3 className="card-title">Bienvenido, {first}</h3>
            <p className="opacity-70 text-sm">
              Usa los accesos rápidos de arriba para gestionar clientes, crear nuevos,
              escanear QR en el puesto y (si eres OWNER/ADMIN) administrar tu equipo.
            </p>
          </div>
        </div>

        {/* Estado de WhatsApp */}
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <div className="flex items-center justify-between gap-2">
              <h3 className="card-title">WhatsApp</h3>
              <span className={`badge ${wa?.enabled ? "badge-success" : "badge-ghost"}`}>
                {wa?.enabled ? "Activo" : "Desactivado"}
              </span>
            </div>
            <div className="text-sm space-y-1">
              <div><span className="opacity-70">Emisor:</span> {wa?.from ? <span className="font-mono">{wa.from}</span> : "—"}</div>
              <div><span className="opacity-70">Límite diario:</span> {wa?.dailyLimit ?? "—"}</div>
              <div><span className="opacity-70">Tasa por minuto:</span> {wa?.ratePerMinute ?? "—"}</div>
              <div><span className="opacity-70">Límite mensual:</span> {wa?.monthlyCap ?? "—"}</div>
            </div>
            {adminOrAbove && (
              <div className="card-actions mt-3">
                <Link to="/app/customers" className="btn btn-sm btn-primary" aria-label="Reenviar QR desde clientes">
                  Reenviar QR (desde clientes)
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Tarjeta Clientes */}
        <div className="card bg-base-100 shadow lg:col-span-2">
          <div className="card-body">
            <h3 className="card-title">Clientes</h3>
            <p className="text-sm opacity-70">
              Gestiona el listado, crea clientes y accede al detalle para sumar visitas o canjear recompensas.
            </p>
            <div className="join">
              <Link to="/app/customers" className="btn btn-primary join-item" aria-label="Abrir listado de clientes">
                Abrir listado
              </Link>
              <Link to="/app/customers/new" className="btn btn-outline join-item" aria-label="Crear cliente">
                Crear cliente
              </Link>
              <Link to="/staff/checkin" className="btn btn-outline join-item" aria-label="Escanear QR">
                Escanear QR
              </Link>
            </div>
          </div>
        </div>

        {/* Tarjeta Staff (enlace operativo a AdminPanel) */}
        {ownerOrAbove && (
          <div className="card bg-base-100 shadow lg:col-span-2" id="staff">
            <div className="card-body">
              <h3 className="card-title">Equipo (staff)</h3>
              <p className="text-sm opacity-70">
                Como OWNER/ADMIN puedes crear y gestionar cuentas de tu equipo.
              </p>
              <div className="join">
                <Link to="/app/admin#staff" className="btn btn-ghost join-item" aria-label="Abrir gestión de usuarios">
                  Abrir gestión de usuarios
                </Link>
                <button className="btn btn-disabled join-item">Crear staff (próximamente)</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
