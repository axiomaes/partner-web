type Props = { title?: string; children: React.ReactNode; actions?: React.ReactNode };
export function Card({ title, children, actions }: Props) {
  return (
    <div className="card">
      <div className="card-body">
        {title ? (
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
            {actions}
          </div>
        ) : null}
        {children}
      </div>
    </div>
  );
}
