import { NavLink } from "react-router-dom";
import { useAuth } from "../lib/auth";
import "./AppShell.css";

const NAV = [
  { to: "/", label: "Dashboard", end: true, icon: "▦" },
  { to: "/leads", label: "Leads", icon: "◈" },
];

export default function AppShell({ children }) {
  const { user, logout } = useAuth();
  const initials = (user?.full_name || "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="shell">
      <aside className="shell-side">
        <div className="shell-logo">
          <span className="shell-logo-mark">◆</span>
          <span className="shell-logo-text">LeadCRM</span>
        </div>

        <nav className="shell-nav">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                isActive ? "shell-nav-item active" : "shell-nav-item"
              }
            >
              <span className="shell-nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="shell-user">
          <div className="shell-avatar">{initials}</div>
          <div className="shell-user-info">
            <span className="shell-user-name">{user?.full_name}</span>
            <span className="shell-user-email">{user?.email}</span>
          </div>
          <button className="shell-logout" onClick={logout} title="Sign out">
            ⏻
          </button>
        </div>
      </aside>

      <div className="shell-main">{children}</div>
    </div>
  );
}
