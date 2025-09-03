// partner-web/src/layout/AppLayout.tsx
import { Link } from "react-router-dom";
import { ReactNode } from "react";
import { BRAND } from "@/shared/brand";

type Props = {
  title?: string;
  subtitle?: React.ReactNode;
  children: ReactNode;
};

export default function AppLayout({ title, subtitle, children }: Props) {
  return (
    <div className="min-h-screen bg-base-200">
      {/* Topbar */}
      <header className="navbar bg-base-100 border-b">
        <div className="flex-1 gap-3">
          <Link to="/" className="btn btn-ghost gap-3 px-2">
            <img
              src={BRAND.logoUrl}
              alt={BRAND.name}
              className="h-6 w-auto sm:h-7"
              loading="eager"
              decoding="async"
            />
            <span className="font-semibold hidden sm:inline">{BRAND.shortName}</span>
          </Link>
        </div>

        <nav className="flex-none gap-1">
          <Link to="/portal" className="btn btn-ghost btn-sm">Clientes</Link>
          <Link to="/app" className="btn btn-ghost btn-sm">Staff</Link>
          <Link to="/app/admin" className="btn btn-primary btn-sm">Admin</Link>
        </nav>
      </header>

      {/* Page header */}
      {(title || subtitle) && (
        <div className="max-w-6xl mx-auto w-full px-4 pt-5">
          {title && <h1 className="text-xl sm:text-2xl font-semibold">{BRAND.name} — {title}</h1>}
          {subtitle && <p className="text-sm opacity-70 mt-1">{subtitle}</p>}
        </div>
      )}

      {/* Content */}
      <main className="max-w-6xl mx-auto w-full p-4">{children}</main>
    </div>
  );
}

