import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Calendar, Users, Award, MessageCircle, Plus, ChevronRight } from "lucide-react";
import { loadAuth } from "../shared/auth";

type Stat = {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  hint?: string;
};

export default function Dashboard() {
  const auth = loadAuth();
  const staffEmail = auth?.user?.email ?? "staff@lacubierta.barber";
  const businessName = "La Cubierta Barbería"; // si luego tu API trae el negocio, úsalo desde auth.user

  // TODO: sustituir por datos reales del backend
  const stats = useMemo<Stat[]>(
    () => [
      { title: "Reservas hoy", value: 12, icon: Calendar, hint: "Última hora +3" },
      { title: "Clientes activos", value: 286, icon: Users, hint: "Semana +8" },
      { title: "Puntos canjeados", value: 74, icon: Award, hint: "Mes +21" },
      { title: "Mensajes hoy", value: 129, icon: MessageCircle, hint: "Tasa 98%" },
    ],
    []
  );

  const recent = [
    { id: "r1", title: "Corte clásico - Juan P.", time: "hace 12 min" },
    { id: "r2", title: "WhatsApp: recordatorio enviado", time: "hace 25 min" },
    { id: "r3", title: "Nuevo cliente: Luis R.", time: "hace 1 h" },
  ];

  return (
    <div className="container-app space-y-6">
      {/* Encabezado */}
      <section className="card">
        <div className="card-body flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-brand-primary/10 flex items-center justify-center">
            <Calendar className="h-5 w-5 text-brand-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-semibold leading-tight truncate">
              {businessName}
            </h1>
            <p className="text-slate-500 text-sm truncate">Sesión: {staffEmail}</p>
          </div>
          <div className="ml-auto">
            <Link to="/customer-auth" className="button button-ghost">
              Acceso Clientes
            </Link>
          </div>
        </div>
      </section>

      {/* Tarjetas de estado */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((s) => (
          <article key={s.title} className="card">
            <div className="card-body">
              <div className="flex items-center gap-2">
                <s.icon className="h-4 w-4 text-slate-500" />
                <span className="text-xs text-slate-500">{s.title}</span>
              </div>
              <div className="mt-1 text-2xl font-semibold">{s.value}</div>
              {s.hint && <div className="text-xs text-slate-400 mt-1">{s.hint}</div>}
            </div>
          </article>
        ))}
      </section>

      {/* Acciones rápidas */}
      <section className="card">
        <div className="card-body">
          <h2 className="font-semibold">Acciones rápidas</h2>
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Link to="#" className="button button-primary flex items-center justify-center gap-2">
              <Plus className="h-4 w-4" /> Nueva reserva
            </Link>
            <Link to="#" className="button button-black flex items-center justify-center gap-2">
              <Users className="h-4 w-4" /> Agregar cliente
            </Link>
            <Link to="#" className="button button-ghost flex items-center justify-center gap-2">
              <MessageCircle className="h-4 w-4" /> Enviar campaña
            </Link>
            <Link to="#" className="button button-ghost flex items-center justify-center gap-2">
              <Calendar className="h-4 w-4" /> Ver agenda
            </Link>
          </div>
        </div>
      </section>

      {/* Actividad reciente */}
      <section className="card">
        <div className="card-body">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Actividad reciente</h2>
            <Link to="#" className="text-sm text-slate-500 hover:text-slate-700 inline-flex items-center gap-1">
              Ver todo <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <ul className="mt-2 divide-y divide-slate-100">
            {recent.map((r) => (
              <li key={r.id} className="py-2 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate">{r.title}</p>
                  <p className="text-xs text-slate-500">{r.time}</p>
                </div>
                <Link to="#" className="text-slate-400 hover:text-slate-600">
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
