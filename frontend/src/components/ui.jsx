import "./ui.css";

export function PageHeader({ title, subtitle, actions }) {
  return (
    <header className="page-header">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </header>
  );
}

export function StatCard({ label, value, accent, sub }) {
  return (
    <div className={accent ? "stat-card stat-card-accent" : "stat-card"}>
      <span className="stat-label">{label}</span>
      <span className="stat-value tnum">{value}</span>
      {sub && <span className="stat-sub">{sub}</span>}
    </div>
  );
}

export function EmptyState({ icon, title, message, action }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <h3 className="empty-title">{title}</h3>
      <p className="empty-message">{message}</p>
      {action}
    </div>
  );
}

export function Spinner({ label = "Loading…" }) {
  return (
    <div className="spinner-wrap">
      <div className="spinner" />
      <span className="spinner-label">{label}</span>
    </div>
  );
}
