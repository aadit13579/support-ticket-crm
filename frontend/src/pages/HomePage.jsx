import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Search, CheckCircle2, Clock, Inbox, Loader2, AlertTriangle } from "lucide-react";
import { fetchApi } from "../api/client";
import { initials, avatarColor } from "../utils/avatar";

/**
 * Parse a datetime string from the backend (UTC, no timezone suffix)
 * as UTC so the browser's local clock is used for display.
 * e.g. "2026-09-13T15:33:00.123456" → treated as UTC → correct IST display
 */
function parseUtc(dateStr) {
  if (!dateStr) return new Date(NaN);
  // Append Z only if there is no timezone info already
  const hasZone = dateStr.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(dateStr);
  return new Date(hasZone ? dateStr : dateStr + "Z");
}

function hoursAgo(dateStr) {
  const diff = Date.now() - parseUtc(dateStr).getTime();
  return Math.max(0, Math.floor(diff / 36e5));
}

function formatDate(dateStr) {
  return parseUtc(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function SlaBar({ ticket }) {
  if (ticket.status === "Closed") return <span style={{ color: "var(--text-3)" }}>—</span>;
  const h   = hoursAgo(ticket.created_at);
  const pct = Math.min((h / 48) * 100, 100);
  const cls = h > 24 ? "sla-err" : h > 16 ? "sla-warn" : "sla-ok";
  return (
    <div className="sla">
      <div className="sla-lbl">{h}h</div>
      <div className="sla-bar">
        <div className={`sla-fill ${cls}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function StatusBadge({ ticket }) {
  const breached = ticket.status === "Open" && hoursAgo(ticket.created_at) > 24;
  if (breached)                    return <span className="badge b-sla"><Clock size={9} /> SLA</span>;
  if (ticket.status === "Open")        return <span className="badge b-open">Open</span>;
  if (ticket.status === "In Progress") return <span className="badge b-prog">In Progress</span>;
  return <span className="badge b-done">Closed</span>;
}

export default function HomePage() {
  const [tickets, setTickets]     = useState([]);
  const [metrics, setMetrics]     = useState({ Open: 0, "In Progress": 0, Closed: 0 });
  const [search, setSearch]       = useState("");
  const [statusFilter, setStatus] = useState("");
  const [loading, setLoading]     = useState(true);
  const [fetchError, setFetchError] = useState("");
  const closingRef = useRef(new Set()); // tracks in-flight quick-close IDs

  const loadMetrics = async () => {
    try { setMetrics(await fetchApi("/api/metrics/")); } catch { /* non-critical */ }
  };

  const loadTickets = async () => {
    setLoading(true);
    setFetchError("");
    try {
      const p = new URLSearchParams();
      if (search)       p.append("search", search);
      if (statusFilter) p.append("status", statusFilter);
      setTickets(await fetchApi(`/api/tickets?${p}`));
    } catch (e) {
      setFetchError(e.message || "Could not load tickets. Is the server running?");
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadMetrics(); }, []);

  useEffect(() => {
    const t = setTimeout(loadTickets, 300);
    return () => clearTimeout(t);
  }, [search, statusFilter]);

  const handleClose = async (id) => {
    if (closingRef.current.has(id)) return; // prevent double-click race
    closingRef.current.add(id);
    try {
      await fetchApi(`/api/tickets/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status: "Closed" }),
      });
      loadTickets();
      loadMetrics();
    } catch {
      // Could surface a toast here later
    } finally {
      closingRef.current.delete(id);
    }
  };

  return (
    <>
      {/* Header */}
      <div className="page-hdr">
        <div>
          <div className="page-hdr__title">Ticket List</div>
          <div className="page-hdr__sub">
            {loading ? "Loading…" : `${tickets.length} ticket${tickets.length !== 1 ? "s" : ""}`}
          </div>
        </div>
        <Link to="/new" className="btn btn-primary">+ New Ticket</Link>
      </div>

      {/* Stats */}
      <div className="stat-row">
        {[
          { key: "Open",        label: "Open" },
          { key: "In Progress", label: "In Progress" },
          { key: "Closed",      label: "Closed" },
        ].map(({ key, label }) => (
          <div key={key} className="stat-item">
            <div className="stat-item__label">{label}</div>
            <div className="stat-item__value">{metrics[key] ?? 0}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="toolbar__search">
          <Search size={13} />
          <input
            id="ticket-search"
            type="text"
            className="toolbar__input"
            placeholder="Search ID, name, email, subject…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          id="status-filter"
          className="toolbar__select"
          value={statusFilter}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All statuses</option>
          <option value="Open">Open</option>
          <option value="In Progress">In Progress</option>
          <option value="Closed">Closed</option>
        </select>
      </div>

      {/* Table */}
      <div className="t-card">
        <div className="t-scroll">
          <table className="t">
            <thead>
              <tr>
                <th>#</th>
                <th>Customer</th>
                <th>ID</th>
                <th>Subject</th>
                <th>Status</th>
                <th>Time open</th>
                <th>Raised</th>
                <th style={{ textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="t-empty">
                    <Loader2 size={20} className="spin" style={{ display: "inline" }} />
                    <span style={{ marginLeft: 6 }}>Loading…</span>
                  </td>
                </tr>
              ) : fetchError ? (
                <tr>
                  <td colSpan={8} className="t-empty">
                    <AlertTriangle size={22} style={{ color: "var(--sla-tx)" }} />
                    <div style={{ marginTop: 6, color: "var(--sla-tx)" }}>{fetchError}</div>
                    <button className="btn btn-ghost" style={{ marginTop: 10 }} onClick={loadTickets}>
                      Retry
                    </button>
                  </td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="t-empty">
                    <Inbox size={28} />
                    {search || statusFilter
                      ? "No tickets match your filters."
                      : "No tickets yet. Raise the first one!"}
                  </td>
                </tr>
              ) : (
                tickets.map((ticket, idx) => (
                  <tr key={ticket.ticket_id}>
                    <td style={{ color: "var(--text-3)", fontVariantNumeric: "tabular-nums" }}>
                      {String(idx + 1).padStart(2, "0")}
                    </td>
                    <td>
                      <div className="c-cell">
                        <div
                          className="c-avatar"
                          style={{ background: avatarColor(ticket.customer_name) }}
                          aria-label={ticket.customer_name}
                        >
                          {initials(ticket.customer_name)}
                        </div>
                        <div>
                          <div className="c-name">{ticket.customer_name}</div>
                          {ticket.customer_email && (
                            <div className="c-email">{ticket.customer_email}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <Link to={`/tickets/${ticket.ticket_id}`} className="tid">
                        {ticket.ticket_id}
                      </Link>
                    </td>
                    <td>
                      <div className="subj-main">{ticket.subject || "—"}</div>
                    </td>
                    <td><StatusBadge ticket={ticket} /></td>
                    <td><SlaBar ticket={ticket} /></td>
                    <td style={{ whiteSpace: "nowrap", color: "var(--text-3)" }}>
                      {formatDate(ticket.created_at)}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {ticket.status !== "Closed" && (
                        <button
                          className="close-btn"
                          onClick={() => handleClose(ticket.ticket_id)}
                          title="Mark as closed"
                        >
                          <CheckCircle2 size={12} />
                          Close
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}