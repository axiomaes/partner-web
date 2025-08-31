type StatProps = { label: string; value: string | number; hint?: string };
export function Stat({ label, value, hint }: StatProps) {
  return (
    <div className="card">
      <div className="card-body">
        <div className="text-xs text-slate-500">{label}</div>
        <div className="mt-1 text-2xl font-semibold text-slate-900">{value}</div>
        {hint ? <div className="mt-1 text-xs text-slate-500">{hint}</div> : null}
      </div>
    </div>
  );
}
