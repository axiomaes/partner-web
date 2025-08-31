import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="container-app space-y-6">
      {/* Hero */}
      <section className="card overflow-hidden">
        <div className="card-body from-brand-primary to-brand-primaryDark bg-gradient-to-br text-white">
          <h1 className="text-2xl font-semibold tracking-tight">La Cubierta Barbería</h1>
          <p className="mt-1 text-white/80">Agenda, fidelización y mensajería en un mismo lugar.</p>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link to="/login" className="button button-black">
              Acceso Staff
            </Link>
            <Link to="/customer-auth" className="button button-ghost">
              Acceso Clientes
            </Link>
          </div>
        </div>
      </section>

      {/* Bloques rápidos */}
      <section className="grid gap-3 sm:grid-cols-2">
        <div className="card">
          <div className="card-body">
            <h3 className="font-semibold">Reservas y turnos</h3>
            <p className="text-sm text-slate-600">
              Gestiona horarios, barberos y disponibilidad desde el panel.
            </p>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <h3 className="font-semibold">Clientes fieles</h3>
            <p className="text-sm text-slate-600">
              Reglas de puntos, campañas y WhatsApp transaccional.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
