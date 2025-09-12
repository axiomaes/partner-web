// src/pages/Customers.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import AppLayout from "@/layout/AppLayout";
import { useSession, isAdmin, isOwner, isSuperAdmin } from "@/shared/auth";
import {
  listCustomers,
  publicCustomerQrUrl,
  type CustomerLite,
} from "@/shared/api";

/** ---- Tipos ---- */
type Row = CustomerLite & {
  email?: string | null;
  visitsCount?: number;
  createdAt?: string;
};

/** ---- Helpers de enmascarado (para BARBER) ---- */
function maskPhone(p?: string | null) {
  if (!p) return "—";
  const digits = p.replace(/\D/g, "");
  if (digits.length <= 4) return "•••";
  return `${digits.slice(0, 2)}•••${digits.slice(-2)}`;
}
function maskEmail(e?: string | null) {
  if (!e) return "—";
  const [user, dom] = e.split("@");
  if (!dom) return "—";
  const u = user.length <= 2 ? "••" : user[0] + "••" + user.slice(-1);
  return `${u}@${dom}`;
}

export default function Customers() {
  const s = useSession();
  const role = s.role;

  const canSeeSensitive = useMemo(
    () => isAdmin(role) || isOwner(role) || isSuperAdmin(role),
    [role]
  );

  /** ---- Estado ---- */
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [qrId, setQrId] = useState<string | null>(null);

  /** ---- Búsqueda con debounce ---- */
  const debTimer = useRef<number | null>(null);
  useEffect(() => {
    let live = true;

    // pequeño debounce para no spamear la API
    if (debTimer.current) window.clearTimeout(debTimer.current);
    debTimer.current = window.setTimeout(async () => {
      try {
        setLoading(true);
        setErr(null);
        const data = await listCustomers({ q: q.trim() || undefined, limit: 50 });
        if (!live) return;
        setRows(data || []);
      } catch (e: any) {
        if (!live) return;
        setErr(e?.message || "No se pudo cargar el listado.");
      } finally {
        if (live) setLoading(false);
      }
    }, 300);

    return () => {
      live = false;
      if (debTimer.current) window.clearTimeout(debTimer.current);
    };
  }, [q]);

  /** ---- Render ---- */
  return (
    <AppLayout
      title="Clientes"
      subtitle="Busca, abre el detalle y muestra el QR del cliente."
      actions={
        <div className="flex flex-wrap gap-2">
          <Link to="/app/customers/new" className="btn btn-primary btn-sm">
            + Crear cliente
          </Link>
        </div>
      }
    >
      {/* Buscador */}
      <div className="mb-4 flex items-center gap-2">
        <input
          className="input input-bordered w-full max-w-md"
          placeholder="Buscar por nombre, teléfono o email…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Buscar clientes"
        />
        <button
          className="btn btn-ghost"
          onClick={() => setQ("")}
          title="Limpiar búsqueda"
        >
          Limpiar
        </button>
      </div>

      {err && (
        <div className="alert alert-warning mb-4">
          <span>{err}</span>
        </div>
      )}

      <div className="overflow-x-auto bg-base-100 rounded-2xl border border-base-200">
        <table className="table table-zebra">
          <thead>
            <tr>
              <th>Cliente</th>
              <th className="hidden sm:table-cell">Teléfono</th>
              <th className="hidden md:table-cell">Email</th>
              <th className="hidden lg:table-cell">Visitas</th>
              <th className="hidden lg:table-cell">Alta</th>
              <th className="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(6)].map((_, i) => (
                <tr key={i}>
                  <td colSpan={6}>
                    <div className="skeleton h-6 w-full" />
                  </td>
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-6 opacity-70">
                  Sin resultados.
                </td>
              </tr>
            ) : (
              rows.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div className="font-medium">{c.name || "Cliente"}</div>
                    <div className="text-xs opacity-60">{c.id}</div>
                  </td>
                  <td className="hidden sm:table-cell">
                    {canSeeSensitive ? c.phone || "—" : maskPhone(c.phone)}
                  </td>
                  <td className="hidden md:table-cell">
                    {canSeeSensitive ? c.email || "—" : maskEmail(c.email)}
                  </td>
                  <td className="hidden lg:table-cell">{c.visitsCount ?? "—"}</td>
                  <td className="hidden lg:table-cell">
                    {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="text-right">
                    <div className="join">
                      <Link
                        to={`/app/customers/${c.id}`}
                        className="btn btn-ghost btn-xs join-item"
                        title="Ver detalle"
                      >
                        Detalle
                      </Link>
                      <button
                        onClick={() => setQrId(c.id)}
                        className="btn btn-outline btn-xs join-item"
                        title="Ver QR"
                      >
                        QR
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal QR */}
      <input type="checkbox" className="modal-toggle" checked={!!qrId} readOnly />
      {qrId && (
        <div className="modal modal-open" onKeyDown={(e) => e.key === "Escape" && setQrId(null)}>
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-2">QR del cliente</h3>
            <div className="flex justify-center mb-3">
              <img
                src={publicCustomerQrUrl(qrId)}
                alt="QR del cliente"
                className="w-48 h-48 object-contain"
                onError={(e) => {
                  e.currentTarget.style.opacity = "0.4";
                }}
              />
            </div>
            <div className="text-xs break-all bg-base-200 rounded p-2 mb-3">
              {publicCustomerQrUrl(qrId)}
            </div>
            <div className="modal-action">
              <button className="btn" onClick={() => setQrId(null)}>
                Cerrar
              </button>
              <a
                className="btn btn-primary"
                href={publicCustomerQrUrl(qrId)}
                target="_blank"
                rel="noreferrer"
              >
                Abrir PNG
              </a>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setQrId(null)} />
        </div>
      )}
    </AppLayout>
  );
}
