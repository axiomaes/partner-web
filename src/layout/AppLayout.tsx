import { PropsWithChildren } from "react";
import { Link } from "react-router-dom";

type Props = {
  title?: string;
  subtitle?: string;
};

/**
 * AppLayout — Contenedor visual unificado para TODAS las pantallas.
 * - Navbar superior consistente
 * - Fondo/base de DaisyUI
 * - Contenedor central con padding y ancho máximo
 * - Título/subtítulo opcionales
 */
export default function AppLayout({ children, title, subtitle }: PropsWithChildren<Props>) {
  return (
    <div className="min-h-screen bg-base-200" data-theme="corporate">
      {/* Navbar */}
      <div className="navbar bg-base-100 border-b border-base-300">
        <div className="flex-1">
          <Link to="/" className="btn btn-ghost text-xl font-bold">
            Axioma Loyalty
          </Link>
        </div>
        <div className="flex-none gap-2">
          {/* Placeholder para futuro: avatar/usuario, switch de tema, etc. */}
        </div>
      </div>

      {/* Contenido */}
      <main className="mx-auto w-full max-w-6xl p-4 md:p-6">
        {(title || subtitle) && (
          <header className="mb-4">
            {title && <h1 className="text-2xl font-semibold">{title}</h1>}
            {subtitle && <p className="text-base text-base-content/70">{subtitle}</p>}
          </header>
        )}

        <section className="card bg-base-100 shadow-lg">
          <div className="card-body">{children}</div>
        </section>
      </main>
    </div>
  );
}
