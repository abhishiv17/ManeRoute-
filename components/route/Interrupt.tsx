// Errors belong to the same system: precise, actionable, never "something went wrong :(".
export default function Interrupt({
  title = "Route interrupted",
  headline,
  children,
  code,
  actions,
}: {
  title?: string;
  headline: string;
  children?: React.ReactNode;
  code?: string;
  actions?: React.ReactNode;
}) {
  return (
    <section className="interrupt" role="alert">
      <div className="mono">{title}</div>
      <div className="display">{headline}</div>
      {children && <div className="small">{children}</div>}
      {code && <div className="mono muted" style={{ marginTop: 6 }}>YouCam code {code}</div>}
      {actions && <div className="btn-row" style={{ marginTop: 12 }}>{actions}</div>}
    </section>
  );
}
