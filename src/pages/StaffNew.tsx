import { useState } from "react";
import { createStaff } from "@/shared/api";
import { useSession } from "@/shared/auth";

export default function StaffNew() {
  const { businessId } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"ADMIN"|"BARBER">("BARBER");
  const [msg, setMsg] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const u = await createStaff(email.trim(), password, businessId, role);
      setMsg(`✅ Staff creado: ${u.email} (${u.role})`);
    } catch (err: any) {
      setMsg(`❌ Error: ${err?.response?.data?.message || err.message}`);
    }
  };

  return (
    <form onSubmit={onSubmit} className="p-4 space-y-4 max-w-md">
      <h1 className="text-xl font-bold">Nuevo Staff</h1>
      <input
        className="border rounded p-2 w-full"
        type="email"
        placeholder="email@dominio.com"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
      />
      <input
        className="border rounded p-2 w-full"
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={e => setPassword(e.target.value)}
        required
      />
      <select
        className="border rounded p-2 w-full"
        value={role}
        onChange={e => setRole(e.target.value as "ADMIN"|"BARBER")}
      >
        <option value="BARBER">Barbero</option>
        <option value="ADMIN">Administrador</option>
      </select>
      <button className="bg-green-600 text-white px-4 py-2 rounded">
        Crear staff
      </button>
      {msg && <p className="text-sm mt-2">{msg}</p>}
    </form>
  );
}
