// src/pages/StaffCheckin.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import AppLayout from "@/layout/AppLayout";
import {
  addVisit,
  addVisitByPhone,
  addVisitFromQrPayload,
  lookupCustomer,
  type CustomerLite,
} from "@/shared/api";
import { useSession, isAdmin, isOwner } from "@/shared/auth";

/** Detecta error de duplicado en el mismo día (por status o texto). */
function isDuplicateVisitError(e: any): boolean {
  const msg = e?.response?.data?.message || e?.message || "";
  return e?.response?.status === 409 || /same\s*day|mismo\s*d[ií]a|already.*today/i.test(msg);
}

/** Extrae customerId de varios formatos de QR. */
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
  const admin = isAdmin(role);
  const canAdd = useMemo(
    () => ["BARBER", "ADMIN", "OWNER", "SUPERADMIN"].includes(String(role || "")),
    [role]
  );
  const isOwnerRole = isOwner(role);

  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  // búsqueda manual
  const [phone, setPhone] = useState("+34");
  const [email, setEmail] = useState("");
  const [found, setFound] = useState<CustomerLite | null>(null);

  // cámara
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const stopRef = useRef<null | (() => void)>(null);
  const [camOn, setCamOn] = useState(false);
  const [lastScan, setLastScan] = useState<string>("");

  // lector USB
  const [wedge, setWedge] = useState("");

  // pegar
  const [pasted, setPasted] = useState("");

  // override modal (cuando el server devuelve duplicado día)
  const [needsOverride, setNeedsOverride] = useState<null | { action: () => Promise<void> }>(null);

  useEffect(() => {
    return () => {
      if (stopRef.current) stopRef.current();
    };
  }, []);

  async function toggleCamera() {
    if (camOn) {
      setCamOn(false);
      if (stopRef.current) stopRef.current();
      stopRef.current = null;
      return;
    }
    setMsg("");
    try {
      const { BrowserQRCodeReader } = await import("@zxing/browser");
      const reader = new BrowserQRCodeReader();
      const controls = await reader.decodeFromVideoDevice(
        undefined,
        videoRef.current!,
        (result) => {
          const text = result?.getText?.();
          if (text && text !== lastScan) {
            setLastScan(text);
            handleScanned(text);
          }
        }
      );
      stopRef.current = () => controls?.stop();
      setCamOn(true);
    } catch (e) {
      setMsg("❌ No se pudo abrir la cámara. Revisa permisos/HTTPS.");
    }
  }

  /** Intenta registrar visita; si hay duplicado del día, solicita override. */
  async function tryRegister(register: (opts?: { force?: boolean }) => Promise<any>) {
    setMsg("");
    try {
      setBusy(true);
      await register();
      setMsg("✅ Visita registrada.");
    } catch (e: any) {
      if (isDuplicateVisitError(e)) {
        setMsg("⚠️ Ya se registró una visita hoy. Requiere autorización del OWNER.");
        setNeedsOverride({ action: async () => register({ force: true }) });
      } else {
        setMsg("❌ " + (e?.response?.data?.message || e?.message || "No se pudo registrar la visita."));
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleScanned(text: string) {
    // 1) Si es payload JSON válido de nuestro QR → endpoint dedicado
    try {
      const asJson = JSON.parse(text);
      if (asJson && typeof asJson === "object" && (asJson.customerId || asJson.cid || asJson.id || asJson.t)) {
        await tryRegister((opts) => addVisitFromQrPayload(text.trim(), opts));
        return;
      }
    } catch {}
    // 2) Extraer id de URL/ID crudo
    const id = extractCustomerIdFromAny(text);
    if (!id) {
      setMsg("❌ No se reconoció el contenido del QR.");
      return;
    }
    await tryRegister((opts) => addVisit(id, "Visita por QR", opts));
  }

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

  async function onAddVisit() {
    if (!found) return;
    await tryRegister((opts) => addVisit(found.id, "Visita desde check-in", opts));
  }

  async function onQuickPhone() {
    await tryRegister((opts) => addVisitByPhone(phone.trim(), "Visita rápida (teléfono)", opts));
  }

  return (
    <AppLayout title="Check-in (Staff)" subtitle="Escanea el QR o busca por teléfono/correo">
      {msg && (
        <div className={`alert ${msg.startsWith("❌") ? "alert-warning" : "alert-info"} mb-4`}>
          <span>{msg}</span>
        </div>
      )}

      {/* Modal Override (solo OWNER puede autorizar) */}
      <input type="checkbox" className="modal-toggle" checked={!!needsOverride} readOnly />
      {needsOverride && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-2">Se necesita autorización</h3>
            <p className="text-sm opacity-80">
              Ya existe una visita hoy para este cliente. Solo un <b>OWNER</b> puede autorizar un segundo registro en el día.
            </p>
            <div className="modal-action">
              <button className="btn" onClick={() => setNeedsOverride(null)}>Cancelar</button>
              {isOwnerRole ? (
                <button
                  className={`btn btn-primary ${busy ? "loading" : ""}`}
                  disabled={busy}
                  onClick={async () => {
                    try {
                      setBusy(true);
                      await needsOverride.action();
                      setNeedsOverride(null);
                      setMsg("✅ Visita registrada con autorización del OWNER.");
                    } catch (e: any) {
                      setMsg("❌ " + (e?.response?.data?.message || e?.message || "No se pudo autorizar."));
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  {busy ? "" : "Autorizar y registrar"}
                </button>
              ) : (
                <span className="text-xs opacity-70">Inicie sesión un OWNER para autorizar.</span>
              )}
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setNeedsOverride(null)} />
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Escaneo */}
        <section className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h3 className="card-title">Escanear QR</h3>

            {/* Cámara */}
            <div className="rounded-box border border-base-300 p-3 mb-3">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="font-medium">Cámara del dispositivo</div>
                <button onClick={toggleCamera} className={`btn btn-sm ${camOn ? "btn-error" : "btn-primary"}`}>
                  {camOn ? "Detener cámara" : "Usar cámara"}
                </button>
              </div>
              <div className="aspect-video bg-base-200 rounded-box grid place-items-center overflow-hidden">
                <video ref={videoRef} autoPlay playsInline muted className="w-full" />
              </div>
              <p className="text-xs opacity-70 mt-2">Apunta al QR del cliente y se registrará la visita.</p>
            </div>

            {/* Lector USB */}
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
        </section>
      </div>
    </AppLayout>
  );
}
