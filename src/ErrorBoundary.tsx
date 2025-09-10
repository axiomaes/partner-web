// partner-web/src/ErrorBoundary.tsx
import { Component, ReactNode } from "react";
import { clearSession } from "@/shared/auth";

type Props = { children: ReactNode };
type State = { hasError: boolean; msg?: string };

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(err: any) {
    return { hasError: true, msg: err?.message || String(err) };
  }

  componentDidCatch(err: any, info: any) {
    // opcional: enviar a logs/telemetría
    console.error("App crashed:", err, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen grid place-items-center p-6">
          <div className="max-w-lg w-full card bg-base-100 shadow">
            <div className="card-body">
              <h2 className="card-title">Se ha producido un error</h2>
              <p className="text-sm opacity-80 break-all">{this.state.msg}</p>
              <div className="card-actions justify-end">
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => {
                    clearSession();
                    window.location.href = "/login";
                  }}
                >
                  Limpiar sesión y volver a entrar
                </button>
                <button className="btn btn-primary btn-sm" onClick={() => location.reload()}>
                  Reintentar
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
