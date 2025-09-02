// partner-web/src/components/CustomerQR.tsx
import { useMemo, useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";

type Props = {
  customerId: string;
  businessId?: string;
  size?: number;              // px del QR (por defecto 192)
  className?: string;         // clases extra del contenedor
  title?: string;             // título opcional (por defecto "Mi QR")
  helperText?: string;        // texto debajo opcional
};

export default function CustomerQR({
  customerId,
  businessId,
  size = 192,
  className = "",
  title = "Mi QR",
  helperText = "Muestra este código al personal para acreditar tu visita.",
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Payload estable que el backend puede leer sin ambigüedad
  const value = useMemo(
    () =>
      JSON.stringify({
        t: "axioma-visit",
        customerId,
        businessId: businessId ?? null,
      }),
    [customerId, businessId]
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      alert("Contenido del QR copiado al portapapeles.");
    } catch {
      alert("No se pudo copiar.");
    }
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return alert("No se encontró el canvas del QR.");
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `qr-${customerId.slice(0, 8)}.png`;
    a.click();
  };

  return (
    <div className={`card bg-base-100 shadow-sm ${className}`}>
      <div className="card-body items-center text-center">
        <h2 className="card-title">{title}</h2>
        <p className="text-sm opacity-70">{helperText}</p>

        <div className="p-4 bg-white rounded-2xl">
          <QRCodeCanvas
            value={value}
            size={size}
            includeMargin
            // nivel de corrección opcional: L, M, Q, H (por defecto M)
            // level="M"
            ref={canvasRef}
          />
        </div>

        <div className="text-xs opacity-60 font-mono break-all mt-2">
          {customerId}
        </div>

        <div className="card-actions justify-center mt-2">
          <button className="btn btn-sm btn-outline" onClick={handleCopy}>
            Copiar payload
          </button>
          <button className="btn btn-sm btn-primary" onClick={handleDownload}>
            Descargar PNG
          </button>
        </div>
      </div>
    </div>
  );
}
