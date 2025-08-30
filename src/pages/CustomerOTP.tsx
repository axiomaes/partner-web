import { FormEvent, useState } from "react";
import { api } from "../shared/api";

export default function CustomerOTP() {
  const [step, setStep] = useState<"request" | "verify">("request");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  async function requestCode(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/customer/request", { phone: phone.trim() });
      setStep("verify");
    } catch (err: any) {
      alert(err?.response?.data?.message ?? err.message);
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/customer/verify", { phone: phone.trim(), code });
      alert("Código verificado. ¡Bienvenido!");
      // Aquí podríamos guardar token de cliente si el backend lo devuelve
      // y redirigir a un portal/área de cliente.
    } catch (err: any) {
      alert(err?.response?.data?.message ?? err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container-app">
      <div className="card max-w-sm mx-auto">
        <div className="card-body">
          <h1 className="text-xl font-semibold">Acceso Clientes</h1>
          <p className="text-slate-600 text-sm">
            Te enviaremos un código a tu WhatsApp. No necesitas contraseña.
          </p>

          {step === "request" && (
            <form onSubmit={requestCode} className="mt-4 space-y-3">
              <label className="block">
                <span className="text-sm font-medium">Teléfono (formato E.164)</span>
                <input
                  className="input mt-1"
                  inputMode="tel"
                  placeholder="+34XXXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </label>

              <button className="button button-primary w-full" disabled={loading}>
                {loading ? "Enviando…" : "Enviar código"}
              </button>
            </form>
          )}

          {step === "verify" && (
            <form onSubmit={verifyCode} className="mt-4 space-y-3">
              <div className="text-xs text-slate-500">
                Enviamos un código a <span className="font-medium">{phone}</span>.
              </div>

              <label className="block">
                <span className="text-sm font-medium">Código recibido</span>
                <input
                  className="input mt-1"
                  inputMode="numeric"
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                />
              </label>

              <button className="button button-primary w-full" disabled={loading}>
                {loading ? "Verificando…" : "Entrar"}
              </button>

              <button
                type="button"
                className="button button-ghost w-full"
                onClick={() => setStep("request")}
              >
                Cambiar número
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
