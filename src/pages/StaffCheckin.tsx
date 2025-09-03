// partner-web/src/pages/StaffCheckin.tsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AppLayout from "@/layout/AppLayout";
import {
  lookupCustomer,
  addVisit,
  addVisitFromQrPayload,
  type CustomerLite,
} from "@/shared/api";

/**
 * Check-in (Staff)
 * - Buscar por móvil/email
 * - Escanear QR (camera)
 */

type Tab = "search" | "qr";

export default function StaffCheckin() {
  const [tab, setTab] = useState<Tab>("search");

  // ------------------ BUSCAR ------------------
  const [phone, setPhone] = useState("+34 ");
  const [email, setEmail] = useState("");
  const [searching, setSearching] = useState(false);
  const [found, setFound] = useState<CustomerLite | null>(null);
  const [msg, setMsg] = useState("");

  const canSearch = useMemo(() => {
    const hasPhone = phone.replace(/\D/g, "").length >= 6;
    const hasEmail = /\S+@\S+\.\S+/.test(email);
    return hasPhone || hasEmail;
  }, [phone, email]);

  const onSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    setSearching(true);
    setFound(null);
    try {
      const cust = await lookupCustomer({ phone, email });
      if (!cust) setMsg("No se encontró cliente con esos datos.");
      setFound(cust);
    } catch (e: any) {
      setMsg(e?.message || "No se pudo buscar el cliente.");
    } finally {
      setSearching(false);
    }
  };

  const onCreditVisit = async (id: string) => {
    setMsg("");
    try {
      const r = await addVisit(id, "Visita (check-in staff)");
      setMsg(
        `✅ Visita registrada. Progreso ${r?.progress?.count ?? "?"}/${r?.progress?.target ?? "?"}${
          r?.newReward?.id ? ` · Nueva recompensa ${r.newReward.id}` : ""
        }`
      );
    } catch (e: any) {
      setMsg(e?.response?.data?.message || e?.message || "No se pudo registrar la visita.");
    }
  };

  // ------------------ QR ------------------
  // Cargamos el lector sólo cuando se entra en la pestaña QR
  const [QrReaderCmp, setQrReaderCmp] = useState<any>(null);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [deviceId, setDeviceId] = useState<string | undefined>(undefined);
  const [qrMsg, setQrMsg] = useState("");

  useEffect(() => {
    if (tab !== "qr") return;
    let cancelled = false;

    // 1) Cargar componente de forma dinámica (evita romper build si falta dependencia)
    import("react-qr-reader")
      .then((m) => !cancelled && setQrReaderCmp(() => m.QrReader))
      .catch(() => {
        setQrReaderCmp(() => null);
        setQrMsg(
          "No se pudo cargar el lector QR. Instala la dependencia con: npm i react-qr-reader"
        );
      });

    // 2) Enumerar cámaras para permitir elegir la trasera
    navigator.mediaDevices
      ?.enumerateDevices()
      .then((list) => {
        if (cancelled) return;
        const cams = list.filter((d) => d.kind === "videoinput");
        setVideoDevices(cams);
        if (!deviceId && cams.length) {
          // Por defecto intenta la cámara trasera si existe
          const back = cams.find((d) => /back|environment/i.test(d.label)) || cams[0];
          setDeviceId(back.deviceId);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const constraints: MediaTrackConstraints | undefined = deviceId
    ? { deviceId: { exact: deviceId } }
    : { facingMode: { ideal: "environment" } };

  const onQrResult = async (result: any, error: any) => {
    if (!!error) return; // ignoramos frames sin código
    try {
      const text: string =
        typeof result?.text === "string"
          ? result.text
          : typeof result?.getText === "function"
          ? result.getText()
          : String(result);
      // Intentamos el payload JSON oficial
      setQrMsg("Procesando QR…");
      const r = await addVisitFromQrPayload(text);
      setQrMsg(
        `✅ Visita por QR. Progreso ${r?.progress?.count ?? "?"}/${r?.progress?.target ?? "?"}${
          r?.newReward?.id ? ` · Nueva recompensa ${r.newReward.id}` : ""
        }`
      );
    } catch (e: any) {
      // Fallback: si fuera un QR con solo el ID, intentamos acreditarlo
      try {
        const maybeId = String(e?.message || "").includes("formato no reconocido")
          ? null
          : null;
        if (maybeId) {
          const r = await addVisit(maybeId, "Visita por QR (simple)");
          setQrMsg(
            `✅ Visita por QR. Progreso ${r?.progress?.count ?? "?"}/${r?.progress?.target ?? "?"}`
          );
          return;
        }
      } catch {}
      setQrMsg(
        `❌ ${e?.response?.data?.message || e?.message || "No se pudo procesar el QR."}`
      );
    }
  };

  // ------------------ RENDER ------------------
  return (
    <AppLayout title="Check-in (Staff)" subtitle={<Link to="/app" className="link">← Volver</Link>}>
      <div className="max-w-3xl">
        {/* Tabs */}
        <div role="tablist" className="tabs tabs-bordered mb-4">
          <button
            role="tab"
            className={`tab ${tab === "search" ? "tab-active" : ""}`}
            onClick={() => setTab("search")}
          >
            Buscar cliente
          </button>
          <button
            role="tab"
            className={`tab ${tab === "qr" ? "tab-active" : ""}`}
            onClick={() => setTab("qr")}
          >
            Escanear QR
          </button>
        </div>

        {tab === "search" && (
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body">
              <h3 className="card-title">Buscar por móvil o email</h3>
              <form onSubmit={onSearch} className="grid gap-3 max-w-lg">
                <div className="form-control">
                  <label className="label"><span className="label-text">Móvil del cliente</span></label>
                  <input
                    className="input input-bordered"
                    placeholder="+34 6XXXXXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text">Email del cliente</span></label>
                  <input
                    className="input input-bordered"
                    placeholder="cliente@ejemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <button className={`btn btn-primary w-28 ${searching ? "loading" : ""}`} disabled={!canSearch || searching}>
                  {searching ? "Buscando…" : "Buscar"}
                </button>
              </form>

              {found && (
                <div className="alert alert-info mt-4">
                  <div>
                    <div className="font-medium">{found.name}</div>
                    <div className="text-xs opacity-70">{found.phone || "—"} · {found.email || "—"}</div>
                  </div>
                  <div className="ml-auto">
                    <button className="btn btn-sm btn-primary" onClick={() => onCreditVisit(found.id)}>
                      Acreditar visita
                    </button>
                  </div>
                </div>
              )}

              {!!msg && <div className={`mt-3 alert ${msg.startsWith("✅") ? "alert-success" : "alert-warning"}`}><span>{msg}</span></div>}
            </div>
          </div>
        )}

        {tab === "qr" && (
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <h3 className="card-title">Escanear QR del cliente</h3>
                {videoDevices.length > 1 && (
                  <div className="form-control">
                    <label className="label"><span className="label-text">Cámara</span></label>
                    <select
                      className="select select-bordered select-sm"
                      value={deviceId}
                      onChange={(e) => setDeviceId(e.target.value)}
                    >
                      {videoDevices.map((d) => (
                        <option key={d.deviceId} value={d.deviceId}>
                          {d.label || `Cámara ${d.deviceId.slice(0, 6)}…`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {!QrReaderCmp ? (
                <div className="alert mt-3">
                  <span>
                    {qrMsg || "Cargando lector… Si no inicia, concede permiso de cámara."}
                  </span>
                </div>
              ) : (
                <div className="rounded-lg overflow-hidden border border-base-300">
                  {/* QrReader constraints: facingMode/env o deviceId exacto */}
                  <QrReaderCmp
                    constraints={{ facingMode: "environment", ...(constraints ? { video: constraints } : {}) } as any}
                    onResult={onQrResult}
                    scanDelay={350}
                    videoStyle={{ width: "100%", height: "auto" }}
                    containerStyle={{ width: "100%" }}
                  />
                </div>
              )}

              {!!qrMsg && (
                <div className={`mt-3 alert ${qrMsg.startsWith("✅") ? "alert-success" : qrMsg.startsWith("❌") ? "alert-warning" : ""}`}>
                  <span>{qrMsg}</span>
                </div>
              )}

              <div className="text-xs opacity-70 mt-2">
                El QR debe contener un payload JSON con formato:
                <code className="ml-1">{"{ t:'axioma-visit', customerId, businessId }"}</code>.
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
