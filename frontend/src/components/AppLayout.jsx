import { NavLink, Link } from "react-router-dom";
import { Ticket, PlusCircle } from "lucide-react";

export default function AppLayout({ children }) {
  return (
    <div className="shell">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        {/* Brand */}
        <Link to="/" className="sidebar__brand">
          <span className="sidebar__brand-dot" />
          <span className="sidebar__brand-text">
            Support<em>Desk</em>
          </span>
        </Link>

        {/* Navigation — only links with actual backend routes */}
        <nav className="sidebar__nav" aria-label="Main navigation">
          <div className="sidebar__label">Tickets</div>

          <NavLink
            to="/"
            end
            className={({ isActive }) => "sidebar__link" + (isActive ? " active" : "")}
          >
            <Ticket size={15} />
            All Tickets
          </NavLink>

          <NavLink
            to="/new"
            className={({ isActive }) => "sidebar__link" + (isActive ? " active" : "")}
          >
            <PlusCircle size={15} />
            New Ticket
          </NavLink>
        </nav>

        {/* Footer */}
        <div className="sidebar__footer">
          <div className="sidebar__avatar">AG</div>
          <div>
            <div className="sidebar__user-name">Agent</div>
            <div className="sidebar__user-role">Support</div>
          </div>
        </div>
      </aside>

      {/* ── Main panel ── */}
      <div className="main-panel">
        <main id="main-content" className="page">
          {children}
        </main>
      </div>
    </div>
  );
}
