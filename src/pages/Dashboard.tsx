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

  const adminOrAbove = isAdmin(s.role); // ADMIN | OWNER | SUPERADMIN
  const ownerOrAbove = isOwner(s.role) || isSuperAdmin(s.role);

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
      {/* Accesos rápidos */}
      <div className="mb-4 flex flex-wrap gap-2">
        <Link to="/app/customers" className="btn btn-primary btn-sm">Listado de clientes</Link>
        <Link to="/app/customers/new" className="btn btn-outline btn-sm">Crear cliente</Link>
        <Link to="/staff/checkin" className="btn btn-outline btn-sm">Escanear / Check-in</Link>
        {adminOrAbove && <Link to="/app/admin" className="btn btn-outline btn-sm">Panel Admin</Link>}
        {ownerOrAbove && <Link to="/app/users" className="btn btn-outline btn-sm">Gestionar staff</Link>}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Bienvenida */}
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h3 className="card-title">Bienvenido, {first}</h3>
            <p className="opacity-70 text-sm">
              Abre el listado de clientes, crea nuevos, escanea su QR para sumar visitas
              y (si eres OWNER/ADMIN) administra tu equipo y herramientas del negocio.
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
              <div><span className="opacity-70">Emisor:</span> {wa?.from ?? "—"}</div>
              <div><span className="opacity-70">Límite diario:</span> {wa?.dailyLimit ?? "—"}</div>
              <div><span className="opacity-70">Tasa por minuto:</span> {wa?.ratePerMinute ?? "—"}</div>
              <div><span className="opacity-70">Límite mensual:</span> {wa?.monthlyCap ?? "—"}</div>
            </div>
            {adminOrAbove && (
              <div className="card-actions mt-3">
                <Link to="/app/customers" className="btn btn-sm btn-primary">
                  Reenviar QR (desde clientes)
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Clientes – accesos */}
        <div className="card bg-base-100 shadow lg:col-span-2">
          <div className="card-body">
            <h3 className="card-title">Clientes</h3>
            <p className="text-sm opacity-70">
              Abre el listado, crea clientes o escanea su QR para registrar visitas.
            </p>
            <div className="join">
              <Link to="/app/customers" className="btn btn-primary join-item">Abrir listado</Link>
              <Link to="/app/customers/new" className="btn btn-outline join-item">Crear cliente</Link>
              <Link to="/staff/checkin" className="btn btn-outline join-item">Escanear / Check-in</Link>
            </div>
          </div>
        </div>

        {/* Staff */}
        {ownerOrAbove && (
          <div className="card bg-base-100 shadow lg:col-span-2">
            <div className="card-body">
              <h3 className="card-title">Equipo (staff)</h3>
              <p className="text-sm opacity-70">Gestiona cuentas de tu equipo.</p>
              <div className="join">
                <Link to="/app/users" className="btn btn-ghost join-item">Abrir gestión de usuarios</Link>
                <Link to="/app/admin" className="btn btn-ghost join-item">Herramientas del negocio</Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
