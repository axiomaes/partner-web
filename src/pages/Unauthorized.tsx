export default function Unauthorized() {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">No autorizado</h1>
        <p className="text-slate-600">No tienes permisos para esta sección.</p>
      </div>
    </div>
  );
}
