import { useState } from "react";
import { requestCustomerOtp, verifyCustomerOtp, loadCustomerToken } from "./customerApi";
import { useNavigate } from "react-router-dom";

export default function PortalLogin() {
  const nav = useNavigate();
  const [phone, setPhone] = useState("+34");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");

  const onSend = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await requestCustomerOtp({ phone: phone.trim() || undefined, email: email.trim() || undefined });
      setSent(true);
      setMsg("Código enviado. Revisa tu WhatsApp o correo.");
    } catch (err: any) {
      setMsg(err?.response?.data?.message || err.message);
    }
  };

  const onVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await verifyCustomerOtp({ phone: phone.trim() || undefined, email: email.trim() || undefined, code: code.trim() });
      if (loadCustomerToken()) nav("/portal/points");
    } catch (err: any) {
      setMsg(err?.response?.data?.message || err.message);
    }
  };

  return (
    <div className="max-w-md">
      <h1 className="text-xl font-bold mb-3">Portal de Cliente</h1>
      {!sent ? (
        <form onSubmit={onSend} className="space-y-3">
          <input className="border rounded p-2 w-full" placeholder="+346XXXXXXXX" value={phone} onChange={e=>setPhone(e.target.value)} />
          <div className="text-center text-gray-500 text-sm">o</div>
          <input className="border rounded p-2 w-full" type="email" placeholder="email@dominio.com" value={email} onChange={e=>setEmail(e.target.value)} />
          <button className="bg-blue-600 text-white px-4 py-2 rounded">Enviar código</button>
          {msg && <p className="text-sm">{msg}</p>}
        </form>
      ) : (
        <form onSubmit={onVerify} className="space-y-3">
          <input className="border rounded p-2 w-full" placeholder="Código recibido" value={code} onChange={e=>setCode(e.target.value)} />
          <button className="bg-green-600 text-white px-4 py-2 rounded">Validar</button>
          {msg && <p className="text-sm">{msg}</p>}
        </form>
      )}
    </div>
  );
}
