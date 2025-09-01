import { useState } from "react";
import { createCustomer } from "@/shared/api";
import { useSession } from "@/shared/auth";

export default function CustomersNew() {
  const { businessId } = useSession();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+34");
  const [msg, setMsg] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const c = await createCustomer(name.trim(), phone.trim(), businessId);
      setMsg(`✅ Cliente creado: ${c.name} (id: ${c.id})`);
    } catch (err: any) {
      setMsg(`❌ Error: ${err?.response?.data?.message || err.message}`);
    }
  };

  return (
    <form onSubmit={onSubmit} className="p-4 space-y-4 max-w-md">
      <h1 className="text-xl font-bold">Nuevo Cliente</h1>
      <input
        className="border rounded p-2 w-full"
        placeholder="Nombre"
        value={name}
        onChange={e => setName(e.target.value)}
        required
      />
      <input
        className="border rounded p-2 w-full"
        placeholder="+346XXXXXXXX"
        value={phone}
        onChange={e => setPhone(e.target.value)}
        required
      />
      <button className="bg-blue-600 text-white px-4 py-2 rounded">
        Crear cliente
      </button>
      {msg && <p className="text-sm mt-2">{msg}</p>}
    </form>
  );
}
