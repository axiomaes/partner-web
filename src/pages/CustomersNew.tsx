// src/pages/CustomersNew.tsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, createCustomer } from "@/shared/api";
import { useSession, isAdmin } from "@/shared/auth";
import AppLayout from "@/layout/AppLayout";

type Created = { id: string; name: string; existed?: boolean };

export default function CustomersNew() {
  const navigate = useNavigate();
  const { role } = useSession();
  const admin = isAdmin(role);
  const isStaff = !admin;

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+34");
  const [birthday, setBirthday] = useState(""); // YYYY-MM-DD
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string>("");
  const [created, setCreated] = useState<Created | null>(null);

  const qrUrl = created
    ? `${api.defaults.baseURL}/public/customers/${encodeURIComponent(created.id)}/qr.png`
    : "";

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    setSubmitting(true);
    setMsg("");
    setCreated(null);
    try {
      const c = await createCustomer(name.trim(), phone.trim(), birthday || undefined);
      setCreated(c);
      if (isStaff) setPhone("+34");
      setMsg(
        c.existed
          ? `⚠️ Este cliente ya existía. Mostramos su QR para comenzar a usarlo.`
          : `✅ Cliente creado correctamente.`
      );
    } catch (err: any) {
      setMsg(`❌ Error: ${err?.response?.data?.message || err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const onPrint = () => {
    if (!qrUrl) return;
    const w = window.open(qrUrl, "_blank", "noopener,noreferrer");
    if (w) w.focus();
  };

  return (
    <AppLayout title="Nuevo cliente" subtitle="Crea un cliente y entrega su QR al instante">
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Formulario */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h2 className="card-title">Datos del cliente</h2>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="form-control">
                <label className="label"><span className="label-text">Nombre</span></label>
                <input
                  className="input input-bordered"
                  placeholder="Nombre y apellido"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-control">
                <label className="label"><span className="label-text">Teléfono</span></label>
                <input
                  type={isStaff ? "password" : "tel"}
                  inputMode="tel"
                  className="input input-bordered"
                  placeholder={admin ? "+346XXXXXXXX" : "+34•••••••••"}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
                <label className="label">
                  <span className="label-text-alt">Formato recomendado: +34 seguido del número.{isStaff && " (oculto para staff)"}</span>
                </label>
              </div>

              <div className="form-control">
                <label className="label"><span className="label-text">Cumpleaños</span></label>
                <input
                  type="date"
                  className="input input-bordered"
                  value={birthday}
                  onChange={(e) => setBirthday(e.target.value)}
                />
                <label className="label">
                  <span className="label-text-alt">Opcional. Formato YYYY-MM-DD.</span>
                </label>
              </div>

              <div className="flex items-center gap-2">
                <button className="btn btn-primary" disabled={submitting} type="submit">
                  {submitting ? (<><span className="loading loading-spinner" />Creando…</>) : "Crear cliente"}
                </button>
                <Link to="/app/customers/list" className="btn btn-ghost">Cancelar</Link>
              </div>

              {msg && (
                <div className={`alert ${msg.startsWith("❌") ? "alert-warning" : "alert-info"}`}>
                  <span>{msg}</span>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* QR y acciones posteriores */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body items-center text-center">
            <h2 className="card-title">QR del cliente</h2>
