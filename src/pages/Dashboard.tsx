// src/pages/Dashboard.tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppLayout from "@/layout/AppLayout";
import { useSession, isAdmin, isOwner, isSuperAdmin } from "@/shared/auth";
import { getWaStatus, type WaStatus } from "@/shared/api";

type Loadable<T> =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ok"; data: T }
  | { kind: "na" } // endpoint no disponible
  | { kind: "err"; error: string };

export default function Dashboard() {
  const s = useSession();
  const nav = useNavigate();

  const first = (s.name || s.email || "").split(" ")[0] || "¡hola!";
  const role = s.role;

  const canStaff = useMemo(
    () => ["BARBER", "ADMIN", "OWNER", "SUPERADMIN"].includes(String(role || "")),
    [role]
  );
  const canAdmin = isAdmin(role) || isOwner(role) || isSuperAdmin(role);
  const canOwnerOrAbove = isOwner(role) || isSuperAdmin(role);

  // WhatsApp status
  const [wa, setWa] = useState<Loadable<WaStatus>>({ kind: "idle" });
  useEffect(() => {
    let live = true;
    (async () => {
      try {
        setWa({ kind: "loading" });
        const st = await getWaStatus();
        if (!live) return;
        setWa(st ? { kind: "ok", data: st } : { kind: "na" });
      } catch (e: any) {
        if (!live) return;
        setWa({ kind: "err", error: e?.message || "No se pudo obtener el estado." });
      }
    })();
    return () => {
      live = false;
    };
  }, []);

  // ---- Narrowing helpers (evitan acceder a .data fuera de "ok") ----
  const waEnabled = wa.kind === "ok" ? !!wa.data.enabled : false;
  const waBadgeClass =
    wa.kind === "ok"
      ? waEnabled
        ? "badge-success"
        : "badge-ghost"
      : wa.kind === "err"
      ? "badge-warning"
      : "badge-ghost";

  const waBadgeText =
    wa.kind === "loading"
      ? "Cargando…"
      : wa.kind === "na"
      ? "No disponible"
      : wa.kind === "err"
      ? "Error"
      : waEnabled
      ? "Activo"
      : "Desactivado";

  return (
    <AppLayout title="Panel" subtitle="Resumen general">
      {/* ACCIONES RÁPIDAS (único lugar con botones de navegación) */}
      <div className="mb-6">
        <div className="bg-base-100 rounded-2xl border border-base-200 shadow-sm p-3 sm:p-4">
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-primary btn-sm" onClick={() => nav("/app/customers")}>
              Listado de clientes
            </button>
            {canAdmin && (
              <button className="btn btn-outline btn-sm" onClick={() => nav("/app/customers/new")}>
                Crear cliente
              </button>
            )}
            {canStaff && (
              <button className="btn btn-outline btn-sm" onClick={() => nav("/staff/checkin")}>
                Escanear / Check-in
              </button>
            )}
            {canAdmin && (
              <button className="btn btn-ghost btn-sm" onClick={() => nav("/app/admin")}>
                Herramientas del negocio
              </button>
            )}
            {canOwnerOrAbove && (
              <button className="btn btn-ghost btn-sm" onClick={() => nav("/app/users")}>
                Gestionar staff
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* BIENVENIDA */}
        <section className="card bg-base-100 shadow-sm border border-base-200">
          <div className="card-body">
            <h3 className="card-title">Bienvenido, {first}</h3>
            <p className="opacity-70 text-sm">
              Desde aquí puedes abrir el listado de clientes, crear nuevos, o usar el{" "}
              <span className="font-medium">Check-in</span> para registrar visitas con el QR.
              {canAdmin && " Como admin/owner también gestionas tu equipo y herramientas del negocio."}
            </p>
          </div>
        </section>

        {/* ESTADO WHATSAPP */}
        <section className="card bg-base-100 shadow-sm border border-base-200">
          <div className="card-body">
            <div className="flex items-center justify-between gap-2">
              <h3 className="card-title">WhatsApp</h3>
              <span className={"badge " + waBadgeClass}>{waBadgeText}</span>
            </div>

            {/* Detalle */}
            {wa.kind === "ok" ? (
              <dl className="text-sm grid grid-cols-2 gap-y-1 mt-1">
                <dt className="opacity-70">Emisor</dt>
                <dd className="text-right">{wa.data.from || "—"}</dd>
                <dt className="opacity-70">Límite diario</dt>
                <dd className="text-right">{wa.data.dailyLimit ?? "—"}</dd>
                <dt className="opacity-70">Tasa/minuto</dt>
                <dd className="text-right">{wa.data.ratePerMinute ?? "—"}</dd>
                <dt className="opacity-70">Límite mensual</dt>
                <dd className="text-right">{wa.data.monthlyCap ?? "—"}</dd>
              </dl>
            ) : wa.kind === "err" ? (
              <p className="text-sm opacity-70">No se pudo obtener el estado. Inténtalo más tarde.</p>
            ) : wa.kind === "na" ? (
              <p className="text-sm opacity-70">Esta API no expone estado de WhatsApp.</p>
            ) : (
              <div className="skeleton h-6 w-40 mt-1" />
            )}
          </div>
        </section>

        {/* CLIENTES */}
        <section className="card bg-base-100 shadow-sm border border-base-200 lg:col-span-2">
          <div className="card-body">
            <div className="flex items-start justify-between gap-2">
              <h3 className="card-title">Clientes</h3>
              <span className="badge badge-outline">Operativo</span>
            </div>
            <p className="text-sm opacity-70">Gestiona la base de clientes, registra visitas y consulta recompensas.</p>

            <div className="grid sm:grid-cols-3 gap-3 mt-2">
              <div className="rounded-box border border-base-200 p-3">
                <div className="font-medium mb-1">Listado</div>
                <p className="text-xs opacity-70 mb-2">Busca, filtra y entra a los detalles.</p>
                <Link to="/app/customers" className="btn btn-primary btn-sm w-full">
                  Abrir listado
                </Link>
              </div>

              {canAdmin && (
                <div className="rounded-box border border-base-200 p-3">
                  <div className="font-medium mb-1">Alta rápida</div>
                  <p className="text-xs opacity-70 mb-2">Registra un nuevo cliente.</p>
                  <Link to="/app/customers/new" className="btn btn-outline btn-sm w-full">
                    Crear cliente
                  </Link>
                </div>
              )}

              {canStaff && (
                <div className="rounded-box border border-base-200 p-3">
                  <div className="font-medium mb-1">Check-in</div>
                  <p className="text-xs opacity-70 mb-2">Escanea QR o usa teléfono/email.</p>
                  <Link to="/staff/checkin" className="btn btn-outline btn-sm w-full">
                    Escanear / Check-in
                  </Link>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* STAFF / NEGOCIO */}
        {canOwnerOrAbove && (
          <section className="card bg-base-100 shadow-sm border border-base-200 lg:col-span-2">
            <div className="card-body">
              <div className="flex items-start justify-between gap-2">
                <h3 className="card-title">Equipo y negocio</h3>
                <span className="badge badge-outline">Administración</span>
              </div>
              <p className="text-sm opacity-70">Usuarios del equipo y herramientas del negocio.</p>

              <div className="grid sm:grid-cols-2 gap-3 mt-2">
                <div className="rounded-box border border-base-200 p-3">
                  <div className="font-medium mb-1">Gestión de usuarios</div>
                  <p className="text-xs opacity-70 mb-2">Crear, editar y asignar roles.</p>
                  <Link to="/app/users" className="btn btn-ghost btn-sm w-full">
                    Abrir gestión de usuarios
                  </Link>
                </div>

                <div className="rounded-box border border-base-200 p-3">
                  <div className="font-medium mb-1">Herramientas del negocio</div>
                  <p className="text-xs opacity-70 mb-2">Operaciones y utilidades del admin.</p>
                  <Link to="/app/admin" className="btn btn-ghost btn-sm w-full">
                    Abrir herramientas
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </AppLayout>
  );
}
