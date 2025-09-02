// partner-web/src/portal/PortalLogin.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  requestCustomerOtp,
  verifyCustomerOtp,
  loadPortalSession,
  savePortalSession,
} from "@/shared/api";

type Mode = "phone" | "email";

export default function PortalLogin() {
  const nav = useNavigate();
  const existing = loadPortalSession();

  const [mode, setMode] = useState<Mode>("phone");
  const [phone, setPhone] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [code, setCode] = useState<string>("");

  const [step, setStep] = useState<"ask" | "code">("ask");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string>("");

  // si ya está logueado, entra directo
  useEffect(() => {
    if (existing?.token) nav("/portal/points", { replace: true });
  }, []);

  const handleRequest = async () => {
    setMsg(""); setLoading(true);
    try {
      if (mode === "phone") {
        if (!phone) throw new Error("Introduce tu número de móvil.");
        await requestCustomerOtp({ phone });
      } else {
        if (!email) throw new Error("Introduce tu correo electrónico.");
        await requestCustomerOtp({ email });
      }
      setStep("code");
      setMsg("Te hemos enviado un código. Revisa WhatsApp/SMS o tu correo.");
    } catch (e: any) {
      setMsg(e?.response?.data?.message || e.message || "No se pudo enviar el código.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setMsg(""); setLoading(true);
    try {
      const payload = mode === "phone" ? { phone, code } : { email, code };
      const res = await verifyCustomerOtp(payload);
      // res: { access_token, user, customerId, businessId, exp, ... } (ajusta según tu API)
      if (!res?.access_token) throw new Error("Token inválido en la respuesta.");
      savePortalSession({
        token: res.access_token,
        customerId: res.customerId,
        businessId: res.businessId,
      });
      nav("/portal/points", { replace: true });
    } catch (e: any) {
      setMsg(e?.response?.data?.message || e.message || "Código inválido o expirado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
      <div className="card w-full max-w-md bg-base-100 shadow-md">
        <div className="card-body">
          <h1 className="card-title">Acceso Clientes</h1>
          <p className="text-sm opacity-70">
            Entra con tu móvil o correo para ver tus visitas, puntos y tu QR.
          </p>

          {/* Tabs modo */}
          <div role="tablist" className="tabs tabs-boxed mt-3">
            <button
              role="tab"
              className={`tab ${mode === "phone" ? "tab-active" : ""}`}
              onClick={() => { setMode("phone"); setStep("ask"); setMsg(""); }}
            >
              Móvil
            </button>
            <button
              role="tab"
              className={`tab ${mode === "email" ? "tab-active" : ""}`}
              onClick={() => { setMode("email"); setStep("ask"); setMsg(""); }}
            >
              Correo
            </button>
          </div>

          {/* Paso 1: pedir OTP */}
          {step === "ask" && (
            <div className="mt-3 space-y-3">
              {mode === "phone" ? (
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Número de móvil</span>
                  </label>
                  <input
                    className="input input-bordered"
                    placeholder="+34 6XXXXXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              ) : (
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Correo</span>
                  </label>
                  <input
                    className="input input-bordered"
                    placeholder="tucorreo@dominio.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              )}

              <button
                className={`btn btn-primary w-full ${loading ? "btn-disabled" : ""}`}
                onClick={handleRequest}
              >
                {loading ? "Enviando..." : "Enviar código"}
              </button>
            </div>
          )}

          {/* Paso 2: validar OTP */}
          {step === "code" && (
            <div className="mt-3 space-y-3">
              <div className="alert alert-info">
                <span>
                  Introduce el código que te hemos enviado a {mode === "phone" ? "tu móvil" : "tu correo"}.
                </span>
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Código</span>
                </label>
                <input
                  className="input input-bordered"
                  placeholder="000000"
                  inputMode="numeric"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <button
                  className={`btn btn-primary flex-1 ${loading ? "btn-disabled" : ""}`}
                  onClick={handleVerify}
                >
                  {loading ? "Verificando..." : "Entrar"}
                </button>
                <button
                  className="btn btn-ghost"
                  onClick={() => { setStep("ask"); setCode(""); }}
                >
                  Cambiar dato
                </button>
              </div>
            </div>
          )}

          {!!msg && (
            <div className="mt-3 text-sm opacity-80">{msg}</div>
          )}

          <div className="mt-4 text-center">
            <a className="link" href="/">← Volver al inicio</a>
          </div>
        </div>
      </div>
    </div>
  );
}
