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
import { useSession, isAdmin } from "@/shared/auth";

/** Intenta extraer un customerId a partir del texto leído del QR. */
function extractCustomerIdFromAny(txt: string): string | null {
  const raw = txt.trim();

  // 1) JSON con payload (preferido)
  try {
    const obj = JSON.parse(raw);
    const id = obj?.customerId || obj?.cid || obj?.id;
    if (id && typeof id === "string") return id;
  } catch {
    // no es JSON, seguimos
  }

  // 2) URL pública del PNG: .../public/customers/:id/qr.png
  const m1 = raw.match(/\/public\/customers\/([^/]+)\/qr/i);
  if (m1?.[1]) return decodeURIComponent(m1[1]);

  // 3) Deep link con ?cid=
  const m2 = raw.match(/[?&](?:cid|customerId)=([^&]+)/i);
  if (m2?.[1]) return decodeURIComponent(m2[1]);

  // 4) ID "en crudo" (uuid o similar)
  if (/^[a-zA-Z0-9_-]{10,}$/.test(raw)) return raw;

  return null;
}

export default function StaffCheckin() {
  const { role } = useSession();
  const canAdd = useMemo(
    () => ["BARBER", "ADMIN", "OWNER", "SUPERADMIN"].includes(String(role || "")),
    [role]
  );
  const admin = isAdmin(role);

  // Estado general
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  // Búsqueda manual
  const [phone, setPhone] = useState("+34");
  const [email, setEmail] = useState("");
  const [found, setFound] = useState<CustomerLite | null>(null);

  // Escaneo: cámara
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const stopRef = useRef<null | (() => void)>(null);
  const [camOn, setCamOn] = useState(false);
  const [lastScan, setLastScan] = useState<string>("");

  // Escaneo: lector físico (wedge)
  const [wedge, setWedge] = useState("");

  // Pegado manual
  const [pasted, setPasted] = useState("");

  useEffect(() => {
    // Apagar cámara al desmontar
    return () => {
      if (stopRef.current) stopRef.current();
    };
  }, []);

  /** Inicia/parar cámara con ZXing de manera perezosa (solo si el usuario la activa) */
  async function toggleCamera() {
    if (camOn) {
      setCamOn(false);
      if (stopRef.current) stopRef.current();
      stopRef.current = null;
      return;
    }
    setMsg("");
    try {
      // Carga perezosa
      const { BrowserQRCodeReader } = await import("@zxing/browser");
      const reader = new BrowserQRCodeReader();

      const controls = await reader.decodeFromVideoDevice(
        undefined,
        videoRef.current!,
        (result, err) => {
          if (result) {
            const text = result.getText();
            // Evita disparos repetidos por el mismo frame
            if (text && text !== lastScan) {
              setLastScan(text);
              handleScanned(text);
            }
          }
        }
      );
      stopRef.current = () => controls?.stop();
      setCamOn(true);
    } catch (e: any) {
      setMsg("❌ No se pudo abrir la cámara. Asegura HTTPS y permisos.");
      console.error(e);
    }
  }

  /** Maneja cualquier texto proveniente de QR (cámara, lector o pegar) */
  async function handleScanned(text: string) {
    setMsg("");
    try {
      setBusy(true);

      // Si es un JSON válido de nuestro payload → usar endpoint dedicado
      let usedJsonPayload = false;
      try {
        const asJson = JSON.parse(text);
        if (asJson && typeof asJson === "object" && (asJson.customerId || asJson.cid || asJson.id || asJson.t)) {
          await addVisitFromQrPayload(text.trim());
          usedJsonPayload = true;
        }
      } catch {
        /* no-op */
      }

      if (!usedJsonPayload) {
        const id = extractCustomerIdFromAny(text);
        if (!id) throw new Error("No se reconoció ningún ID en el QR.");
        await addVisit(id, "Visita por QR");
      }

      setMsg("✅ Visita registrada por QR.");
    } catch (e: any) {
      setMsg("❌ " + (e?.response?.data?.message || e?.message || "QR inválido."));
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
      setFound(c || null);
    } catch (e: any) {
      setMsg("❌ " + (e?.response?.data?.message || e?.message || "No se pudo buscar."));
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
      setMsg("❌ " + (e?.response?.data?.message || e?.message || "No se pudo registrar la visita."));
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
      setMsg("❌ " + (e?.response?.data?.message || e?.message || "No se pudo registrar por teléfono."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppLayout title="Check-in (Staff)" subtitle="Escanea el QR o busca por teléfono/correo">
      {msg && (
        <div className={`alert ${msg.startsWith("❌") ? "alert-warning" : "alert-info"} mb-4`}>
          <span>{msg}</span>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Columna izquierda: Escaneo */}
        <section className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h3 className="card-title">Escanear QR</h3>

            {/* Cámara */}
            <div className="rounded-box border border-base-300 p-3 mb-3">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="font-medium">Cámara del dispositivo</div>
                <button
                  onClick={toggleCamera}
                  className={`btn btn-sm ${camOn ? "btn-error" : "btn-primary"}`}
                >
                  {camOn ? "Detener cámara" : "Usar cámara"}
                </button>
              </div>

              <div className="aspect-video bg-base-200 rounded-box grid place-items-center overflow-hidden">
                <video ref={videoRef} autoPlay playsInline muted className="w-full"></video>
              </div>

              <p className="text-xs opacity-70 mt-2">
                Requiere HTTPS y permisos de cámara. Apunta al QR del cliente y se registrará la visita automáticamente.
              </p>
            </div>

            {/* Lector físico (wedge) */}
            <div className="rounded-box border border-base-300 p-3 mb-3">
              <div className="font-medium mb-2">Lector físico (USB)</div>
              <input
                className="input input-bordered w-full"
                placeholder="Coloca el cursor aquí y lee el QR con el escáner…"
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
              <p className="text-xs opacity-70 mt-2">
                La mayoría de escáneres actúan como teclado y envían “Enter” al final. También puedes pegar el valor manualmente.
              </p>
            </div>

            {/* Pegar payload/ID/URL */}
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

        {/* Columna derecha: Búsqueda manual */}
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
