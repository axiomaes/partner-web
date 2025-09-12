// src/pages/StaffCheckin.tsx
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AppLayout from "@/layout/AppLayout";
import {
  addVisit,
  addVisitByPhone,
  addVisitFromQrPayload,
  lookupCustomer,
  type CustomerLite,
} from "@/shared/api";
import { useSession, isAdmin } from "@/shared/auth";

export default function StaffCheckin() {
  const { role } = useSession();
  const canAdd = useMemo(
    () => ["BARBER", "ADMIN", "OWNER", "SUPERADMIN"].includes(String(role || "")),
    [role]
  );

  const [qr, setQr] = useState("");
  const [phone, setPhone] = useState("+34");
  const [email, setEmail] = useState("");
  const [found, setFound] = useState<CustomerLite | null>(null);

  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function onPasteQr() {
    setMsg("");
    try {
      setBusy(true);
      const r = await addVisitFromQrPayload(qr.trim());
      setMsg("✅ Visita registrada por QR.");
      if (r?.customerId) {
        setFound({ id: r.customerId, name: r.customerName ?? "Cliente", phone: r.phone } as any);
      }
    } catch (e: any) {
      setMsg("❌ " + (e?.message || "QR inválido."));
    } finally {
      setBusy(false);
    }
  }

  async function onLookup() {
    setMsg("");
    setFound(null);
    try {
      setBusy(true);
      const c = await lookupCustomer({ phone: phone.trim(), email: email.trim() });
      if (!c) setMsg("⚠️ No se encontró el cliente.");
      setFound(c);
    } catch (e: any) {
      setMsg("❌ " + (e?.message || "No se pudo buscar."));
    } finally {
      setBusy(false);
    }
  }

  async function onAddVisit() {
    if (!found) return;
    setMsg("");
    try {
      setBusy(true);
      await addVisit(found.id, "Visita desde check-in");
      setMsg("✅ Visita registrada.");
    } catch (e: any) {
      setMsg("❌ " + (e?.message || "No se pudo registrar la visita."));
    } finally {
      setBusy(false);
    }
  }

  async function onQuickPhone() {
    setMsg("");
    try {
      setBusy(true);
      await addVisitByPhone(phone.trim(), "Visita rápida (teléfono)");
      setMsg("✅ Visita registrada (por teléfono).");
    } catch (e: any) {
      setMsg("❌ " + (e?.message || "No se pudo registrar por teléfono."));
    } finally {
      setBusy(false);
    }
  }

  const admin = isAdmin(role);

  return (
    <AppLayout title="Check-in (Staff)" subtitle="Escanea el QR o busca por teléfono/correo">
      {msg && (
        <div className={`alert ${msg.startsWith("❌") ? "alert-warning" : "alert-info"} mb-4`}>
          <span>{msg}</span>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Bloque QR (pegar payload) */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h3 className="card-title">Registrar con QR (pegar payload)</h3>
            <textarea
              className="textarea textarea-bordered h-32"
              placeholder='{"t":"axioma-visit","customerId":"..."}'
              value={qr}
              onChange={(e) => setQr(e.target.value)}
            />
            <button className={`btn btn-primary ${busy ? "loading" : ""}`} disabled={busy} onClick={onPasteQr}>
              {busy ? "" : "Registrar visita por QR"}
            </button>
            <p className="text-xs opacity-70">
              Si tienes lector, pega aquí el JSON leído del QR del cliente.
            </p>
          </div>
        </div>

        {/* Bloque búsqueda manual */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h3 className="card-title">Buscar cliente</h3>
            <div className="grid gap-3">
              <input
                className="input input-bordered"
                type="tel"
                inputMode="tel"
                placeholder="+34..."
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <input
                className="input input-bordered"
                type="email"
                placeholder="correo@dominio.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <div className="join">
                <button className={`btn join-item ${busy ? "loading" : ""}`} disabled={busy} onClick={onLookup}>
                  {busy ? "" : "Buscar"}
                </button>
                <button className={`btn btn-outline join-item ${busy ? "loading" : ""}`} disabled={busy} onClick={onQuickPhone}>
                  {busy ? "" : "Sumar por teléfono"}
                </button>
              </div>

              {found && (
                <div className="rounded-box border border-base-300 p-3">
                  <div className="font-medium">{found.name}</div>
                  <div className="text-sm opacity-70">{found.phone || "—"}</div>
                  <div className="mt-2 flex gap-2">
                    <Link to={`/app/customers/${found.id}`} className="btn btn-ghost btn-sm">
                      Abrir detalle
                    </Link>
                    {canAdd ? (
                      <button onClick={onAddVisit} className={`btn btn-primary btn-sm ${busy ? "loading" : ""}`} disabled={busy}>
                        {busy ? "" : "Añadir visita"}
                      </button>
                    ) : (
                      <span className="text-xs opacity-70">Tu rol no puede registrar visitas.</span>
                    )}
                  </div>
                </div>
              )}

              {!admin && (
                <p className="text-xs opacity-60">
                  * Los administradores pueden ver datos completos; el staff ve datos enmascarados.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
