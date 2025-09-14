// src/pages/AccountSettings.tsx
import { useState } from "react";
import AppLayout from "@/layout/AppLayout";
import { useSession } from "@/shared/auth";
import { changeMyPassword } from "@/shared/api";

export default function AccountSettings() {
  const s = useSession();
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const valid =
    cur.trim().length >= 1 &&
    next.trim().length >= 8 &&
    confirm.trim().length >= 8 &&
    next === confirm;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (!valid) {
      setMsg("❌ Revisa los campos: mínimo 8 caracteres y coincidencia.");
      return;
    }
    try {
      setBusy(true);
      await changeMyPassword(cur.trim(), next.trim()); // ✅ 2 args
      setMsg("✅ Contraseña actualizada.");
      setCur(""); setNext(""); setConfirm("");
    } catch (e: any) {
      setMsg("❌ " + (e?.response?.data?.message || e?.message || "No se pudo actualizar."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppLayout title="Mi cuenta" subtitle="Actualiza tu contraseña.">
      {msg && (
        <div className={`alert ${msg.startsWith("❌") ? "alert-warning" : "alert-info"} mb-4`}>
          <span>{msg}</span>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <section className="card bg-base-100 shadow-sm border border-base-200">
          <div className="card-body">
            <h3 className="card-title">Cambio de contraseña</h3>
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="form-control">
                <label className="label"><span className="label-text">Contraseña actual</span></label>
                <input
                  type="password"
                  className="input input-bordered"
                  value={cur}
                  onChange={(e) => setCur(e.target.value)}
                  required
                />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">Nueva contraseña</span></label>
                <input
                  type="password"
                  className="input input-bordered"
                  value={next}
                  onChange={(e) => setNext(e.target.value)}
                  minLength={8}
                  required
                />
                <label className="label">
                  <span className="label-text-alt">Mínimo 8 caracteres.</span>
                </label>
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">Confirmar nueva contraseña</span></label>
                <input
                  type="password"
                  className="input input-bordered"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  minLength={8}
                  required
                />
              </div>

              <button className={`btn btn-primary ${busy ? "loading" : ""}`} disabled={busy || !valid}>
                {busy ? "" : "Actualizar contraseña"}
              </button>
            </form>
          </div>
        </section>

        <section className="card bg-base-100 shadow-sm border border-base-200">
          <div className="card-body">
            <h3 className="card-title">Información</h3>
            <div className="text-sm opacity-80">
              <p><b>Usuario:</b> {s?.email || s?.name || "—"}</p>
              <p><b>Rol:</b> {s?.role || "—"}</p>
              <p className="mt-2">
                Si olvidaste tu contraseña, pide a un <b>ADMIN/OWNER</b> que realice un <i>reset</i> para generar una temporal.
              </p>
            </div>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
