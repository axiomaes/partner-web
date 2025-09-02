// partner-web/src/pages/CustomersNew.tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, createCustomer } from "@/shared/api";
import { useSession, isAdmin } from "@/shared/auth";
import AppLayout from "@/layout/AppLayout";

type Created = { id: string; name: string; existed?: boolean };

export default function CustomersNew() {
  const navigate = useNavigate();
  const { businessId, role } = useSession();
  const admin = isAdmin(role);
  const isStaff = !admin; // cualquier rol no-admin

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+34");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string>("");
  const [created, setCreated] = useState<Created | null>(null);
  const [showFull, setShowFull] = useState(false); // modal pantalla completa

  // URL del blob con el PNG del QR (cargado con auth)
  const [qrUrl, setQrUrl] = useState<string>("");

  // Descargar el PNG protegido como blob y generar URL local
  const fetchQr = async (customerId: string) => {
    try {
      const r = await api.get(
        `/customers/${encodeURIComponent(customerId)}/qr.png`,
        { responseType: "blob" }
      );
      // limpia URL anterior si existía
      setQrUrl((old) => {
        if (old) URL.revokeObjectURL(old);
        return URL.createObjectURL(r.data);
      });
    } catch {
      setQrUrl("");
    }
  };

  // Cuando haya un cliente creado, traemos su QR
  useEffect(() => {
    if (created?.id) fetchQr(created.id);
    // cleanup al desmontar
    return () => {
      setQrUrl((old) => {
        if (old) URL.revokeObjectURL(old);
        return "";
      });
    };
  }, [created?.id]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    setSubmitting(true);
    setMsg("");
    setCreated(null);
    setQrUrl("");
    try {
      const c = await createCustomer(name.trim(), phone.trim(), businessId);
      setCreated(c);

      // Si es staff, limpiamos el teléfono del estado para no dejarlo visible en la UI
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

  // nombre de archivo al descargar
  const downloadName = useMemo(
    () => (created ? `qr-${created.id}.png` : "qr.png"),
    [created]
  );

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
                  // STAFF no ve el número mientras escribe
                  type={isStaff ? "password" : "tel"}
                  inputMode="tel"
                  className="input input-bordered"
                  placeholder={admin ? "+346XXXXXXXX" : "+34•••••••••"}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
                <label className="label">
                  <span className="label-text-alt">
                    Formato recomendado: <code className="font-mono">+34</code> seguido del número.
                    {isStaff && " (oculto para staff)"}
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

                <div className="p-4 rounded-box border border-base-300 bg-base-200 w-full">
                  {qrUrl ? (
                    <img
                      src={qrUrl}
                      alt="QR del cliente"
                      className="mx-auto w-56 h-56 object-contain"
                    />
                  ) : (
                    <div className="py-12">
                      <span className="loading loading-spinner" />
                    </div>
                  )}
                </div>

                <div className="join mt-4">
                  <a
                    href={qrUrl || "#"}
                    download={downloadName}
                    className={`btn btn-outline join-item ${qrUrl ? "" : "btn-disabled"}`}
                  >
                    Descargar PNG
                  </a>
                  <button
                    onClick={onPrint}
                    className={`btn btn-outline join-item ${qrUrl ? "" : "btn-disabled"}`}
                  >
                    Imprimir
                  </button>
                  <button
                    type="button"
                    className={`btn btn-outline join-item ${qrUrl ? "" : "btn-disabled"}`}
                    onClick={() => setShowFull(true)}
                    disabled={!qrUrl}
                  >
                    Pantalla completa
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

      {/* Modal de pantalla completa para facilitar la foto del QR */}
      {showFull && created && qrUrl && (
        <div className="modal modal-open">
          <div className="modal-box max-w-none w-[92vw] p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">QR de {created.name}</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowFull(false)}>
                ✕
              </button>
            </div>
            <div className="flex items-center justify-center">
              <img
                src={qrUrl}
                alt="QR del cliente"
                className="w-[70vmin] h-[70vmin] object-contain"
              />
            </div>
            <div className="mt-3 text-center text-sm opacity-70">
              Pídele al cliente que haga una foto a este código.
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setShowFull(false)} />
        </div>
      )}
    </AppLayout>
  );
}
