import { Link } from "react-router-dom";

export default function Home() {
  const Card = ({ title, to, desc }: {title:string;to:string;desc:string}) => (
    <Link to={to} className="block rounded-2xl border bg-white p-5 shadow hover:shadow-md transition">
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      <p className="text-sm text-neutral-600">{desc}</p>
    </Link>
  );
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Bienvenido</h1>
      <p className="text-neutral-600 mb-6">Elige cómo deseas ingresar:</p>
      <div className="grid gap-4 md:grid-cols-3">
        <Card title="Administrador" to="/login" desc="Correo y contraseña." />
        <Card title="Operador (Empleado)" to="/login" desc="Correo y contraseña." />
        <Card title="Cliente" to="/customer-auth" desc="Login con código por WhatsApp." />
      </div>
    </div>
  );
}
