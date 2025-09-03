// partner-web/src/pages/StaffCheckin.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import AppLayout from "@/layout/AppLayout";
import {
  lookupCustomer,
  addVisit,
  addVisitFromQrPayload,
  type CustomerLite,
} from "@/shared/api";
import { Scanner } from "@yudiel/react-qr-scanner";

/**
 * Check-in (Staff)
 * - Buscar por móvil/email
 * - Escanear QR (cámara)
 * - Beep + vibración al acreditar
 * - Historial de últimos 5 check-ins
 */

type Tab = "search" | "qr";
type Via = "QR" | "Manual";
type CheckinItem = {
  id: string;
  label: string;
  via: Via;
  at: number; // epoch ms
  progress?: { count?: number; target?: number };
  newRewardId?: string;
};

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

  // ------------------ FEEDBACK (beep + vibrar) ------------------
  const audioRef = useRef<AudioContext | null>(null);
  const feedbackSuccess = () => {
    try {
      navigator?.vibrate?.([30, 40, 30]);
    } catch {}
    try {
      const Ctx: any = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!Ctx) return;
      if (!audioRef.current) audioRef.current = new Ctx();
      const ctx = audioRef.current!;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = 880;
      o.connect(g);
      g.connect(ctx.destination);
      g.gain.setValueAtTime(0.001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.01);
      o.start();
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.16);
      o.stop(ctx.currentTime + 0.16);
    } catch {}
  };

  // ------------------ HISTORIAL ------------------
  const [history, setHistory] = useState<CheckinItem[]>([]);
  const pushHistory = (item: CheckinItem) =>
    setHistory((h) => [item, ...h].slice(0, 5));

  const fmtTime = (t: number) =>
    new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const onCreditVisit = async (id: string, labelForHistory?: string) => {
    setMsg("");
    try {
      const r = await addVisit(id, "Visita (check-in staff)");
      const t = `✅ Visita registrada. Progreso ${r?.progress?.count ?? "?"}/${r?.progress?.target ?? "?"}${
        r?.newReward?.id ? ` · Nueva recompensa ${r.newReward.id}` : ""
      }`;
      setMsg(t);
      feedbackSuccess();
      pushHistory({
        id,
        label: labelForHistory || `Cliente ${id.slice(0, 6)}…`,
        via: "Manual",
        at: Date.now(),
        progress: { count: r?.progress?.count, target: r?.progress?.target },
        newRewardId: r?.newReward?.id,
      });
    } catch (e: any) {
      setMsg(e?.response?.data?.message || e?.message || "No se pudo registrar la visita.");
    }
  };

  // ------------------ QR ------------------
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [deviceId, setDeviceId] = useState<string | undefined>(undefined);
  const [qrMsg, setQrMsg] = useState("");
  const [processing, setProcessing] = useState(false);
  const [cooldownId, setCooldownId] = useState<any>(null);

  useEffect(() => () => clearTimeout(cooldownId), [cooldownId]);

  useEffect(() => {
    if (tab !== "qr") return;
    let cancelled = false;

    navigator.mediaDevices
      ?.enumerateDevices()
      .then((list) => {
        if (cancelled) return;
        const cams = list.filter((d) => d.kind === "videoinput");
        setVideoDevices(cams);
        if (!deviceId && cams.length) {
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

  const constraints: MediaTrackConstraints =
    deviceId ? { deviceId } : { facingMode: "environment" };

  const onQrScan = async (codes: Array<{ rawValue: string }>) => {
    if (processing) return;
    const text = codes?.[0]?.rawValue;
    if (!text) return;

    setProcessing(true);
    try {
      setQrMsg("Procesando QR…");

      // Intentamos extraer un customerId para el historial
      let customerIdForHistory: string | undefined;
      try {
        const parsed = JSON.parse(text);
        if (parsed?.customerId) customerIdForHistory = String(parsed.customerId);
      } catch {
        /* QR simple u otro formato */
      }

      const r = await addVisitFromQrPayload(text);
      setQrMsg(
        `✅ Visita por QR. Progreso ${r?.progress?.count ?? "?"}/${r?.progress?.target ?? "?"}${
          r?.newReward?.id ? ` · Nueva recompensa ${r.newReward.id}` : ""
        }`
      );
      feedbackSuccess();
      pushHistory({
        id: customerIdForHistory || "desconocido",
        label: customerIdForHistory ? `QR · ${customerIdForHistory.slice(0, 6)}…` : "QR · cliente",
        via: "QR",
        at: Date.now(),
        progress: { count: r?.progress?.count, target: r?.progress?.target },
        newRewardId: r?.newReward?.id,
      });
    } catch (e: any) {
      setQrMsg(`❌ ${e?.response?.data?.message || e?.message || "No se pudo procesar el QR."}`);
    } finally {
      const t = setTimeout(() => setProcessing(false), 1200); // cooldown 1.2s
      setCooldownId(t);
    }
  };

  // ------------------ RENDER ------------------
  return (
    <AppLayout
      title="Check-in (Staff)"
      subtitle="Escanea el QR o ingresa móvil/email"
    >
      <div className="max-w-3xl">
        {/* back link separado del subtitle (subtitle es string) */}
        <div className="mb-3">
          <Link to="/app" className="link">← Volver</Link>
        </div>

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

        {/* === BUSCAR === */}
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
                <div className="alert alert-info mt-4 items-center">
                  <div>
                    <div className="font-medium">{found.name}</div>
                    <div className="text-xs opacity-70">{found.phone || "—"} · {found.email || "—"}</div>
                  </div>
                  <div className="ml-auto">
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => onCreditVisit(found.id, found.name || undefined)}
                    >
                      Acreditar visita
                    </button>
                  </div>
                </div>
              )}

              {!!msg && (
                <div className={`mt-3 alert ${msg.startsWith("✅") ? "alert-success" : "alert-warning"}`}>
                  <span>{msg}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* === QR === */}
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

              <div className="rounded-lg overflow-hidden border border-base-300">
                <Scanner
                  onScan={onQrScan}
                  onError={() => setQrMsg("No se pudo acceder a la cámara. Revisa permisos.")}
                  constraints={constraints}
                  scanDelay={150}
                  paused={processing}
                  allowMultiple={false}
                  styles={{ container: { width: "100%" }, video: { width: "100%" } }}
                />
              </div>

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

        {/* === HISTORIAL === */}
        <div className="card bg-base-100 shadow-sm mt-6">
          <div className="card-body">
            <h3 className="card-title">Últimos check-ins</h3>
            {!history.length ? (
              <div className="text-sm opacity-70">Aún no hay registros en esta sesión.</div>
            ) : (
              <div className="overflow-x-auto rounded-box border border-base-300">
                <table className="table table-compact w-full">
                  <thead className="bg-base-200 sticky top-0 z-10">
                    <tr>
                      <th>Hora</th>
                      <th>Cliente</th>
                      <th>Vía</th>
                      <th>Progreso</th>
                      <th>Recompensa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((h, i) => (
                      <tr key={i}>
                        <td className="whitespace-nowrap">{fmtTime(h.at)}</td>
                        <td className="whitespace-nowrap">{h.label}</td>
                        <td>{h.via}</td>
                        <td>
                          {h.progress?.count ?? "?"}/{h.progress?.target ?? "?"}
                        </td>
                        <td>{h.newRewardId ? `🎁 ${h.newRewardId}` : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
