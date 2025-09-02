// partner-web/src/pages/StaffCheckin.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { isAdmin, useSession } from "@/shared/auth";
import { addVisit, addVisitFromQrPayload, lookupCustomer, CustomerLite } from "@/shared/api";

// === Nuevo hook: carga dinámica de react-qr-barcode-scanner ===
const useQrScanner = () => {
  const [QrScanner, setQrScanner] = useState<any>(null);
  useEffect(() => {
    let mounted = true;
    import("react-qr-barcode-scanner")
      .then((m) => mounted && setQrScanner(() => m.default))
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);
  return QrScanner;
};

function maskPhone(p?: string | null) {
  return p ? String(p).replace(/.(?=.{4})/g, "•") : "—";
}
function maskEmail(e?: string | null) {
  if (!e) return "—";
  const [u = "", d = ""] = String(e).split("@");
  const uu = u.slice(0, 2) + "•".repeat(Math.max(0, u.length - 2));
  return `${uu}@${d}`;
}

export default function StaffCheckin() {
  const nav = useNavigate();
  const { role } = useSession();
  const admin = isAdmin(role);

  const [tab, setTab] = useState<"buscar" | "qr">("buscar");

  // Buscar por contacto
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [found, setFound] = useState<CustomerLite | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [msg, setMsg] = useState<string>("");

  // QR
  const QrScanner = useQrScanner();
  const [qrError, setQrError] = useState<string>("");
  const [qrPayloadManual, setQrPayloadManual] = useState<string>("");

  const canSearch = useMemo(() => phone.trim() !== "" || email.trim() !== "", [phone, email]);

  const submitLookup = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setMsg("");
    setFound(null);
    if (!canSearch) {
      setMsg("Ingresa móvil o email.");
      return;
    }
    setLookupLoading(true);
    try {
      const c = await lookupCustomer({ phone, email });
      if (c?.id) setFound(c);
      else setMsg("No se encontró ningún cliente con esos datos.");
    } catch (err: any) {
      setMsg(err?.response?.data?.message || err.message || "Error al buscar.");
    } finally {
      setLookupLoading(false);
    }
  };

  const doAddVisit = async (customerId: string) => {
    setMsg("");
    try {
      const r = await addVisit(customerId, "Visita por staff");
      setMsg(
        `✅ Visita acreditada. Progreso: ${r?.progress?.count ?? "?"}/${r?.progress?.target ?? "?"}${
          r?.newReward?.id ? " · Nueva recompensa 🎉" : ""
        }`
      );
    } catch (err: any) {
      setMsg(err?.response?.data?.message || err.message || "No se pudo acreditar la visita.");
    }
  };

  const onQrResult = async (resultText?: string | null) => {
    if (!resultText) return;
    try {
      setQrError("");
      const res = await addVisitFromQrPayload(resultText);
      setMsg(
        `✅ Visita por QR. Progreso: ${res?.progress?.count ?? "?"}/${res?.progress?.target ?? "?"}${
          res?.newReward?.id ? " · Nueva recompensa 🎉" : ""
        }`
      );
    } catch (err: any) {
      setQrError(err?.message || "QR inválido.");
    }
  };

  const onSubmitQrManual = async (e: React.FormEvent) => {
    e.preventDefault();
    await onQrResult(qrPayloadManual);
  };

  return (
    <div className="min-h-screen bg-base-200 p-4">
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Check-in (Staff)</h1>
          <button className="btn btn-ghost btn-sm" onClick={() => nav(-1)}>
            ← Volver
          </button>
        </div>

        <div role="tablist" className="tabs tabs-boxed">
          <button
            role="tab"
            className={`tab ${tab === "buscar" ? "tab-active" : ""}`}
            onClick={() => setTab("buscar")}
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

        {msg && <div className="alert alert-success text-sm">{msg}</div>}
        {qrError && <div className="alert alert-warning text-sm">{qrError}</div>}

        {tab === "buscar" && (
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body">
              <h2 className="card-title">Buscar por móvil o email</h2>
              <form className="grid gap-3 md:grid-cols-2" onSubmit={submitLookup}>
                <div className="form-control">
                  <label className="label"><span className="label-text">Móvil del cliente</span></label>
                  <input
                    className="input input-bordered"
                    placeholder="+34 6XXXXXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    inputMode="tel"
                  />
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text">Email del cliente</span></label>
                  <input
                    className="input input-bordered"
                    placeholder="cliente@ejemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    inputMode="email"
                  />
                </div>
                <div className="md:col-span-2">
                  <button className="btn btn-primary" type="submit" disabled={!canSearch || lookupLoading}>
                    {lookupLoading ? <span className="loading loading-spinner" /> : "Buscar"}
                  </button>
                </div>
              </form>

              {found && (
                <div className="mt-4 border-t pt-4">
                  <div className="text-sm opacity-70">Cliente encontrado</div>
                  <div className="font-medium">{found.name}</div>
                  <div className="text-sm">{admin ? found.phone || "—" : maskPhone(found.phone)}</div>
                  <div className="text-sm">{admin ? found.email || "—" : maskEmail(found.email)}</div>

                  <div className="mt-3">
                    <button className="btn btn-success" onClick={() => doAddVisit(found.id)}>
                      Acreditar visita
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "qr" && (
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body space-y-3">
              <h2 className="card-title">Escanear código QR</h2>

              {QrScanner ? (
                <div className="rounded-lg overflow-hidden border">
                  <QrScanner
                    // cada ~300ms procesa frame
                    delay={300}
                    // cámara trasera en móviles
                    constraints={{ facingMode: "environment" }}
                    // callback de resultado/errores
                    onUpdate={(err: any, result: any) => {
                      if (result) {
                        const text =
                          typeof result === "string"
                            ? result
                            : result?.getText?.() || result?.text || String(result);
                        onQrResult(text);
                      }
                      // errores de escaneo se ignoran hasta tener un resultado
                    }}
                    style={{ width: "100%" }}
                  />
                </div>
              ) : (
                <div className="text-sm opacity-70">
                  Cargando lector de QR… Si no carga, usa el formulario de abajo.
                </div>
              )}

              <form className="grid gap-2" onSubmit={onSubmitQrManual}>
                <label className="text-sm opacity-70">Pegado manual del contenido del QR</label>
                <textarea
                  className="textarea textarea-bordered"
                  placeholder='{"t":"axioma-visit","customerId":"...","businessId":"..."}'
                  value={qrPayloadManual}
                  onChange={(e) => setQrPayloadManual(e.target.value)}
                  rows={3}
                />
                <button className="btn btn-outline btn-sm w-fit" type="submit">
                  Procesar payload
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
