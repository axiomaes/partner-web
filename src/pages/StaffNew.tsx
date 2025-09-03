// partner-web/src/pages/StaffNew.tsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { createStaff } from "@/shared/api";

export default function StaffNew() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"ADMIN" | "BARBER">("BARBER");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string>("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg("");
    try {
      // ⬇️ antes: createStaff(email, password, businessId, role)
      await createStaff(email.trim(), password, role);
      setMsg("✅ Usuario creado correctamente.");
      setEmail("");
      setPassword("");
      setRole("BARBER");
    } catch (err: any) {
      setMsg(`❌ Error: ${err?.response?.data?.message || err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md">
      <h1 className="text-xl font-semibold mb-4">Nuevo miembro del staff</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <div className="form-control">
          <label className="label"><span className="label-text">Email</span></label>
          <input
            type="email"
            className="input input-bordered"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="usuario@empresa.com"
          />
        </div>

        <div className="form-control">
          <label className="label"><span className="label-text">Contraseña</span></label>
          <input
            type="password"
            className="input input-bordered"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
          />
        </div>

        <div className="form-control">
          <label className="label"><span className="label-text">Rol</span></label>
          <select
            className="select select-bordered"
            value={role}
            onChange={(e) => setRole(e.target.value as "ADMIN" | "BARBER")}
          >
            <option value="BARBER">BARBER (staff)</option>
            <option value="ADMIN">ADMIN</option>
          </select>
        </div>

        <div className="flex items-center gap-2 mt-2">
          <button className="btn btn-primary" disabled={submitting} type="submit">
            {submitting ? <><span className="loading loading-spinner" /> Creando…</> : "Crear"}
          </button>
          <Link to="/admin" className="btn btn-ghost">Cancelar</Link>
        </div>

        {msg && (
          <div className={`alert ${msg.startsWith("❌") ? "alert-warning" : "alert-info"}`}>
            <span>{msg}</span>
          </div>
        )}
      </form>
    </div>
  );
}

