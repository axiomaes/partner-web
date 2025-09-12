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

function isDuplicateVisitError(e: any): boolean {
  const msg = e?.response?.data?.message || e?.message || "";
  return e?.response?.status === 409 || /same\s*day|mismo\s*d[ií]a|already.*today/i.test(msg);
}
function extractCustomerIdFromAny(txt: string): string | null {
  const raw = txt.trim();
  try {
    const obj = JSON.parse(raw);
    const id = obj?.customerId || obj?.cid || obj?.id;
    if (id && typeof id === "string") return id;
  } catch {}
  const m1 = raw.match(/\/public\/customers\/([^/]+)\/qr/i);
  if (m1?.[1]) return decodeURIComponent(m1[1]);
  const m2 = raw.match(/[?&](?:cid|customerId)=([^&]+)/i);
  if (m2?.[1]) return decodeURIComponent(m2[1]);
  if (/^[a-zA-Z0-9_-]{10,}$/.test(raw)) return raw;
  return null;
}

export default function StaffCheckin() {
  const { role } = useSession();
  const canAdd = useMemo(
    () => ["BARBER", "ADMIN", "OWNER", "SUPERADMIN"].includes(String(role || "")),
    [role]
  );

  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const [phone, setPhone] = useState("+34");
  const [email, setEmail] = useState("");
  const [found, setFound] = useState<CustomerLite | null>(null);

  const [wedge, setWedge] = useState("");
  const [pasted, setPasted] = useState("");

  async function onLookup() {
    setMsg("");
    setFound(null);
    try {
      setBusy(true);
      const c = await lookupCustomer({ phone: phone.trim(), email: email.trim() });
      if (!c) setMsg("⚠️ No se encontró el cliente.");
      setFound(c || null);
    } catch (e: any) {
      setMsg("❌ " + (e?.response?.data?.message || e?.message || "No se pudo buscar."));
    } finally {
      setBusy(false);
    }
  }

  async function tryRegisterById(id: string) {
    setMsg("");
    try {
      setBusy(true);
      await addVisit(id); // ✅ 1–2 args; usamos 1
      setMsg("✅ Visita registrada.");
    } catch (e: any) {
      if (isDuplicateVisitError(e)) {
        setMsg("⚠️ Ya se registró una visita hoy (override no disponible en el backend actual).");
      } else {
        setMsg("❌ " + (e?.response?.data?.message || e?.message || "No se pudo registrar la visita."));
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleScanned(text: string) {
    try {
      const asJson = JSON.parse(text);
      if (asJson && typeof asJson === "object" && (asJson.customerId || asJson.cid || asJson.id || asJson.t)) {
        setBusy(true);
        try {
          await addVisitFromQrPayload(text.trim()); // ✅ 1 arg
          setMsg("✅ Visita registrada por QR.");
        } catch (e: any) {
          if (isDuplicateVisitError(e)) {
            setMsg("⚠️ Ya se registró una visita hoy (override no disponible en el backend actual).");
          } else {
            setMsg("❌ " + (e?.response?.data?.message || e?.message || "No se pudo registrar por QR."));
          }
        } finally {
          setBusy(false);
        }
        return;
      }
    } catch {}
    const id = extractCustomerIdFromAny(text);
    if (!id) {
      setMsg("❌ No se reconoció el contenido del QR.");
      return;
    }
    await tryRegisterById(id);
  }

  async function onAddVisit() {
    if (!found) return;
    await tryRegisterById(found.id);
  }

  async function onQuickPhone() {
    setMsg("");
    try {
      setBusy(true);
      await addVisitByPhone(phone.trim()); // ✅ SOLO 1 arg
      setMsg("✅ Visita registrada (por teléfono).");
    } catch (e: any) {
      if (isDuplicateVisitError(e)) {
        setMsg("⚠️ Ya se registró una visita hoy (override no disponible en el backend actual).");
      } else {
        setMsg("❌ " + (e?.response?.data?.message || e?.message || "No se pudo registrar por teléfono."));
      }
    } finally {
      setBusy(false);
    }
  }

  const admin = isAdmin(role);

  return (
    <AppLayout
      title="Check-in (Staff)"
      subtitle="Escanea el QR (lector USB o pegando contenido) o busca por teléfono/correo"
    >
      {msg && (
        <div className={`alert ${msg.startsWith("❌") ? "alert-warning" : "alert-info"} mb-4`}>
          <span>{msg}</span>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Lector USB */}
        <section className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h3 className="card-title">Escanear QR</h3>

            <div className="rounded-box border border-base-300 p-3 mb-3">
              <div className="font-medium mb-2">Lector físico (USB)</div>
              <input
                className="input input-bordered w-full"
                placeholder="Foco aquí y lee el QR con el escáner…"
                value={wedge}
                onChange={(e) => setWedge(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === "Tab") {
                    e.preventDefault();
                    if (wedge.trim()) handleScanned(wedge);
                    setWedge("");
                  }
                }}
              />
              <p className="text-xs opacity-70 mt-2">La mayoría de escáneres envían “Enter” al final.</p>
            </div>

            {/* Pegar contenido */}
            <div className="rounded-box border border-base-300 p-3">
              <div className="font-medium mb-2">Pegar payload / ID / URL</div>
              <textarea
                className="textarea textarea-bordered h-24"
                placeholder='{"t":"axioma-visit","customerId":"..."}  o  https://.../public/customers/:id/qr.png  o  ID'
                value={pasted}
                onChange={(e) => setPasted(e.target.value)}
              />
              <button
                className={`btn btn-primary mt-2 ${busy ? "loading" : ""}`}
                disabled={busy}
                onClick={() => pasted.trim() && handleScanned(pasted)}
              >
                {busy ? "" : "Registrar por contenido pegado"}
              </button>
            </div>
          </div>
        </section>

        {/* Búsqueda manual */}
        <section className="card bg-base-100 shadow-sm">
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
                    <Link to={`/app/customers/${found.id}`} className="btn btn-ghost btn-sm">Abrir detalle</Link>
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
        </section>
      </div>
    </AppLayout>
  );
}
