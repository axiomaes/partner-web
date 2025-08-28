// web/src/pages/CustomerOTP.tsx
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
      await api.post("/auth/customer/request", { phone });
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
      // quitamos la desestructuración para evitar TS6133 (variable no usada)
      await api.post("/auth/customer/verify", { phone, code });
      alert("Código verificado. ¡Bienvenido!");
      // TODO: redirigir si aplica
      // navigate("/portal");
    } catch (err: any) {
      alert(err?.response?.data?.message ?? err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-sm">
      {step === "request" && (
        <form onSubmit={requestCode} className="space-y-3">
          <h1 className="text-xl font-semibold">Acceso Cliente</h1>
          <input
            className="border px-3 py-2 w-full"
            placeholder="Teléfono (E.164, ej. +51...)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <button disabled={loading} className="bg-black text-white px-4 py-2 rounded">
            {loading ? "Enviando..." : "Enviar código"}
          </button>
        </form>
      )}

      {step === "verify" && (
        <form onSubmit={verifyCode} className="space-y-3">
          <h1 className="text-xl font-semibold">Verificar código</h1>
          <input
            className="border px-3 py-2 w-full"
            placeholder="Código recibido"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <button disabled={loading} className="bg-black text-white px-4 py-2 rounded">
            {loading ? "Verificando..." : "Entrar"}
          </button>
          <button
            type="button"
            className="text-sm underline"
            onClick={() => setStep("request")}
          >
            Cambiar número
          </button>
        </form>
      )}
    </div>
  );
}
