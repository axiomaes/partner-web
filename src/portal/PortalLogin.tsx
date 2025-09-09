// partner-web/src/portal/PortalLogin.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  requestCustomerOtp,
  verifyCustomerOtp,
  loadPortalSession,
  savePortalSession,
} from "@/shared/api";

type Mode = "phone" | "email";

function normalizePhone(raw: string) {
  // Quita no dígitos; si empieza sin +, puedes anteponer +34 (ajústalo a tu caso)
  const digits = (raw || "").replace(/\D/g, "");
  return digits.startsWith("00")
    ? `+${digits.slice(2)}`
    : digits.startsWith("34") && !raw.startsWith("+")
    ? `+${digits}`
    : raw.startsWith("+")
    ? raw
    : digits
    ? `+${digits}`
    : "";
}

function normalizeEmail(raw: string) {
  return (raw || "").trim().toLowerCase();
}

export default function PortalLogin() {
  const nav = useNavigate();
  const mounted = useRef(true);

  const existing = loadPortalSession();

  const [mode, setMode] = useState<Mode>("phone");
  const [phone, setPhone] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [code, setCode] = useState<string>("");

  const [step, setStep] = useState<"ask" | "code">("ask");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string>("");

  // Deriva placeholders bonitos
  const phonePh = useMemo(() => "+34 6XXXXXXXX", []);
  const emailPh = useMemo(() => "tucorreo@dominio.com", []);

  // si ya está logueado en portal, entra directo
  useEffect(() => {
    mounted.current = true;
    if (existing?.token) {
      nav("/portal/points", { replace: true });
    }
    return () => {
      mounted.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setSafeMsg = (m: string) => {
    if (mounted.current) setMsg(m);
  };
  const setSafeLoading = (v: boolean) => {
    if (mounted.current) setLoading(v);
  };

  const handleRequest = async () => {
    setSafeMsg("");
    setSafeLoading(true);
    try {
      if (mode === "phone") {
        const p = normalizePhone(phone);
        if (!p) throw new Error("Introduce tu número de móvil.");
        await requestCustomerOtp({ phone: p });
      } else {
        const e = normalizeEmail(email);
        if (!e) throw new Error("Introduce tu correo electrónico.");
        await requestCustomerOtp({ email: e });
      }
      if (!mounted.current) return;
      setStep("code");
      setSafeMsg("Te hemos enviado un código. Revisa WhatsApp/SMS o tu correo.");
    } catch (e: any) {
      setSafeMsg(e?.response?.data?.message || e?.message || "No se pudo enviar el código.");
    } finally {
      setSafeLoading(false);
    }
  };

  const handleVerify = async () => {
    setSafeMsg("");
    setSafeLoading(true);
    try {
      const payload =
        mode === "phone"
          ? { phone: normalizePhone(phone), code }
          : { email: normalizeEmail(email), code };

      if (!payload.code || payload.code.trim().length < 4) {
        throw new Error("Código inválido. Debe tener al menos 4 dígitos.");
      }

      const res = await verifyCustomerOtp(payload);
      // Se espera: { access_token, customerId, businessId, ... }
      const token: string | undefined = res?.access_token;
      const customerId: string | undefined = res?.customerId;
      const businessId: string | undefined = res?.businessId;

      if (!token) throw new Error("Token inválido en la respuesta.");
      if (!businessId)
        throw new Error(
          "No se recibió el identificador del negocio. Contacta con soporte."
        );

      savePortalSession({
        token,
        customerId,
        businessId,
      });

      if (!mounted.current) return;
      nav("/portal/points", { replace: true });
    } catch (e: any) {
      setSafeMsg(e?.response?.data?.message || e?.message || "Código inválido o expirado.");
    } finally {
      setSafeLoading(false);
    }
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setStep("ask");
    setMsg("");
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
              onClick={() => switchMode("phone")}
              disabled={loading}
            >
              Móvil
            </button>
            <button
              role="tab"
              className={`tab ${mode === "email" ? "tab-active" : ""}`}
              onClick={() => switchMode("email")}
              disabled={loading}
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
                    placeholder={phonePh}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    inputMode="tel"
                    disabled={loading}
                  />
                </div>
              ) : (
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Correo</span>
                  </label>
                  <input
                    className="input input-bordered"
                    placeholder={emailPh}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    inputMode="email"
                    disabled={loading}
                  />
                </div>
              )}

              <button
                className="btn btn-primary w-full"
                onClick={handleRequest}
                disabled={loading}
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
                  Introduce el código que te hemos enviado a{" "}
                  {mode === "phone" ? "tu móvil" : "tu correo"}.
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
                  disabled={loading}
                />
              </div>

              <div className="flex gap-2">
                <button
                  className="btn btn-primary flex-1"
                  onClick={handleVerify}
                  disabled={loading}
                >
                  {loading ? "Verificando..." : "Entrar"}
                </button>
                <button
                  className="btn btn-ghost"
                  onClick={() => {
                    setStep("ask");
                    setCode("");
                    setMsg("");
                  }}
                  disabled={loading}
                >
                  Cambiar dato
                </button>
              </div>
            </div>
          )}

          {!!msg && <div className="mt-3 text-sm opacity-80">{msg}</div>}

          <div className="mt-4 text-center">
            <a className="link" href="/">
              ← Volver al inicio
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
