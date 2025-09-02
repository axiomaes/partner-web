// partner-web/src/pages/CustomersNew.tsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, createCustomer } from "@/shared/api";
import { useSession } from "@/shared/auth";
import AppLayout from "@/layout/AppLayout";

type Created = { id: string; name: string; existed?: boolean };

export default function CustomersNew() {
  const navigate = useNavigate();
  const { businessId } = useSession();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+34");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string>("");
  const [created, setCreated] = useState<Created | null>(null);

  const qrUrl = created
    ? `${api.defaults.baseURL}/customers/${encodeURIComponent(created.id)}/qr.png`
    : "";

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    setSubmitting(true);
    setMsg("");
    setCreated(null);
    try {
      const c = await createCustomer(name.trim(), phone.trim(), businessId);
      setCreated(c);
      setMsg(
        c.existed
          ? `⚠️ Este número ya estaba registrado. Mostramos su QR para comenzar a usarlo.`
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
    // algunos navegadores bloquean auto-print; el usuario puede imprimir desde la nueva pestaña
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
                <label className="label">
                  <span className="label-text">Nombre</span>
                </label>
                <input
                  className="input input-bordered"
                  placeholder="Nombre y apellido"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Teléfono</span>
                </label>
                <input
                  className="input input-bordered"
                  placeholder="+346XXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
                <label className="label">
                  <span className="label-text-alt">
                    Formato recomendado: <code className="font-mono">+34</code> seguido del número.
                  </span>
                </label>
              </div>

              <div className="flex items-center gap-2">
                <button
                  className="btn btn-primary"
                  disabled={submitting}
                  type="submit"
                >
                  {submitting ? (
                    <>
                      <span className="loading loading-spinner" />
                      Creando…
                    </>
                  ) : (
                    "Crear cliente"
                  )}
                </button>

                <Link to="/app/customers" className="btn btn-ghost">
                  Cancelar
                </Link>
              </div>

              {msg && (
                <div
                  className={`alert ${
                    msg.startsWith("❌") ? "alert-warning" : "alert-info"
                  }`}
                >
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

            {!created ? (
              <div className="text-sm opacity-70">
                Crea el cliente para generar su QR.
              </div>
            ) : (
              <>
                <div className="mb-2">
                  <div className="text-sm opacity-70">Cliente</div>
                  <div className="text-lg font-medium">{created.name}</div>
                </div>

                <div className="p-4 rounded-box border border-base-300 bg-base-200">
                  {/* Mostramos el PNG servido por la API */}
                  <img
                    src={qrUrl}
                    alt="QR del cliente"
                    className="w-56 h-56 object-contain"
                  />
                </div>

                <div className="join mt-4">
                  <a
                    href={qrUrl}
                    download={`qr-${created.id}.png`}
                    className="btn btn-outline join-item"
                  >
                    Descargar PNG
                  </a>
                  <button onClick={onPrint} className="btn btn-outline join-item">
                    Imprimir
                  </button>
                  <button
                    className="btn btn-primary join-item"
                    onClick={() => navigate(`/app/customers/${created.id}`)}
                  >
                    Ir al detalle
                  </button>
                </div>

                <div className="mt-3 text-xs opacity-70">
                  El cliente también podrá ver este QR desde su Portal.
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
