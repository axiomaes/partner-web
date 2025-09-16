// src/pages/StaffCheckin.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import AppLayout from "@/layout/AppLayout";
import {
  addVisit,
  addVisitByPhone,
  lookupCustomer,
  type CustomerLite,
} from "@/shared/api";
import { useSession, isAdmin } from "@/shared/auth";

/** ───────── helpers ───────── */
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

/** ───────── componente principal ───────── */
export default function StaffCheckin() {
  const { role } = useSession();
  const canAdd = useMemo(
    () => ["BARBER", "ADMIN", "OWNER", "SUPERADMIN"].includes(String(role || "")),
    [role]
  );

  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  // búsqueda por teléfono
  const [phone, setPhone] = useState("+34");
  const [found, setFound] = useState<CustomerLite | null>(null);

  // lector USB (keyboard wedge)
  const [wedge, setWedge] = useState("");

  // lector con cámara
  const [camOn, setCamOn] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const barcodeSupported = typeof (window as any).BarcodeDetector !== "undefined";

  useEffect(() => {
    async function startCamera() {
      try {
        // pedir cámara trasera si existe
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        const Detector = (window as any).BarcodeDetector;
        const detector = new Detector({ formats: ["qr_code"] });

        const tick = async () => {
          if (!camOn || !videoRef.current) return;
          try {
            const codes = await detector.detect(videoRef.current);
            const value = codes?.[0]?.rawValue;
            if (value) {
              // al detectar, apagamos cámara y procesamos
              setCamOn(false);
              await handleScanned(value);
            }
          } catch {
            // ignorar frames con error
          }
          rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
      } catch (e: any) {
        setMsg("❌ No se pudo acceder a la cámara.");
        setCamOn(false);
      }
    }

    if (camOn && barcodeSupported) startCamera();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      const stream = streamRef.current;
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camOn, barcodeSupported]);

  async function onLookup() {
    setMsg("");
    setFound(null);
    try {
      setBusy(true);
      const c = await lookupCustomer({ phone: phone.trim() });
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
      await addVisit(id);
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
      await addVisitByPhone(phone.trim());
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
      subtitle="Escanea el QR (lector USB o cámara del móvil) o busca por teléfono"
    >
      {msg && (
        <div className={`alert ${msg.startsWith("❌") ? "alert-warning" : "alert-info"} mb-4`}>
          <span>{msg}</span>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Escaneo por QR */}
        <section className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h3 className="card-title">Escanear QR</h3>

            {/* Lector USB */}
            <div className="rounded-box border border-base-300 p-3 mb-4">
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

            {/* Lector con cámara (móvil/desktop) */}
            <div className="rounded-box border border-base-300 p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium">Lector con cámara</div>
                <button
                  className={`btn btn-sm ${camOn ? "btn-error" : "btn-primary"}`}
                  onClick={() => setCamOn((v) => !v)}
                >
                  {camOn ? "Detener" : "Iniciar"}
                </button>
              </div>

              {camOn ? (
                barcodeSupported ? (
                  <div className="aspect-video w-full bg-base-200 rounded-lg overflow-hidden grid place-items-center">
                    <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
                  </div>
                ) : (
                  <div className="text-sm opacity-80">
                    Tu navegador no soporta el lector de códigos integrado.
                    Prueba con Chrome/Edge recientes en móvil o usa el lector USB.
                  </div>
                )
              ) : (
                <p className="text-xs opacity-70">
                  Usa la cámara del móvil para escanear el QR del cliente y registrar la visita.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Búsqueda manual (teléfono) */}
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

              <div className="join">
                <button className={`btn join-item ${busy ? "loading" : ""}`} disabled={busy} onClick={onLookup}>
                  {busy ? "" : "Buscar"}
                </button>
                <button
                  className={`btn btn-outline join-item ${busy ? "loading" : ""}`}
                  disabled={busy}
                  onClick={onQuickPhone}
                >
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
                      <button
                        onClick={onAddVisit}
                        className={`btn btn-primary btn-sm ${busy ? "loading" : ""}`}
                        disabled={busy}
                      >
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
