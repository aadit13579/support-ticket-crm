import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { fetchApi } from "../api/client";
import { initials, avatarColor } from "../utils/avatar";

/**
 * Backend stores UTC datetimes without a timezone suffix.
 * Appending Z forces the browser to parse them as UTC,
 * so toLocaleString() displays correct local (IST) time.
 */
function parseUtc(dateStr) {
  if (!dateStr) return new Date(NaN);
  const hasZone = dateStr.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(dateStr);
  return new Date(hasZone ? dateStr : dateStr + "Z");
}

function fmtDateTime(dateStr) {
  return parseUtc(dateStr).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function StatusBadge({ status }) {
  const map = {
    "Open":        "badge b-open",
    "In Progress": "badge b-prog",
    "Closed":      "badge b-done",
  };
  return <span className={map[status] ?? "badge"}>{status}</span>;
}

export default function TicketDetailPage() {
  const { ticketId } = useParams();

  const [ticket, setTicket]     = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [customerHistory, setCustomerHistory] = useState(null);

  // Update panel state
  const [newStatus, setNewStatus] = useState("");
  const [noteText, setNoteText]   = useState("");
  const [saving, setSaving]       = useState(false);
  const [flash, setFlash]         = useState(null); // { type: "ok"|"err", msg }

  /* ── fetch ticket ── */
  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchApi(`/api/tickets/${ticketId}`);
      setTicket(data);
      setNewStatus(data.status);
      
      // Fetch history if email exists
      if (data.customer_email) {
        try {
          const hist = await fetchApi(`/api/tickets/customer-history?email=${encodeURIComponent(data.customer_email)}&current_ticket_id=${ticketId}`);
          setCustomerHistory(hist);
        } catch { /* ignore */ }
      }
    } catch (e) {
      setError(e.message || "Could not load ticket.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [ticketId]);

  /* ── save changes ── */
  const handleSave = async () => {
    if (!noteText.trim() && newStatus === ticket.status) {
      setFlash({ type: "err", msg: "Nothing changed — update a status or add a note." });
      return;
    }
    setSaving(true);
    setFlash(null);
    try {
      await fetchApi(`/api/tickets/${ticketId}`, {
        method: "PUT",
        body: JSON.stringify({
          status: newStatus !== ticket.status ? newStatus : undefined,
          notes:  noteText.trim() || undefined,
        }),
      });
      setNoteText("");
      setFlash({ type: "ok", msg: "Ticket updated." });
      await load(); // refresh with latest notes + status
    } catch (e) {
      setFlash({ type: "err", msg: e.message || "Update failed." });
    } finally {
      setSaving(false);
    }
  };

  /* ── loading / error ── */
  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-3)", padding: "40px 0" }}>
        <Loader2 size={18} className="spin" /> Loading ticket…
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Link to="/" className="back-link"><ArrowLeft /> All Tickets</Link>
        <div className="alert alert-err" style={{ marginTop: 16 }}>{error}</div>
      </div>
    );
  }

  const createdAt = fmtDateTime(ticket.created_at);

  return (
    <>
      {/* ── Back + header ── */}
      <div>
        <Link to="/" className="back-link"><ArrowLeft /> All Tickets</Link>
        <div className="page-hdr" style={{ marginTop: 6 }}>
          <div>
            <div className="page-hdr__title">{ticket.subject}</div>
            <div className="page-hdr__sub" style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
              <span style={{ fontFamily: "ui-monospace, monospace", fontSize: "0.75rem", color: "var(--accent)", fontWeight: 600 }}>
                {ticket.ticket_id}
              </span>
              <StatusBadge status={ticket.status} />
              <span>Raised {createdAt}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Two-column grid ── */}
      <div className="detail-grid">

        {/* ── Left: ticket info + description ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Customer info */}
          <div className="detail-card">
            <div className="detail-card__header">
              <span className="detail-card__title">Customer</span>
              <div className="c-avatar" style={{ background: avatarColor(ticket.customer_name) }}>
                {initials(ticket.customer_name)}
              </div>
            </div>
            <div className="detail-card__body">
              <div className="info-row">
                <div className="info-row__label">Name</div>
                <div className="info-row__value">{ticket.customer_name}</div>
              </div>
              <div className="info-row">
                <div className="info-row__label">Email</div>
                <div className="info-row__value">
                  <a href={`mailto:${ticket.customer_email}`} style={{ color: "var(--accent)" }}>
                    {ticket.customer_email}
                  </a>
                </div>
              </div>
              <div className="info-row">
                <div className="info-row__label">Status</div>
                <div className="info-row__value"><StatusBadge status={ticket.status} /></div>
              </div>
              <div className="info-row">
                <div className="info-row__label">Created</div>
                <div className="info-row__value">{createdAt}</div>
              </div>
              {customerHistory && customerHistory.count > 0 && (
                <div className="info-row">
                  <div className="info-row__label">History</div>
                  <div className="info-row__value" style={{ fontSize: "0.75rem", color: "var(--text-3)", paddingTop: 2 }}>
                    This user has {customerHistory.count} ticket{customerHistory.count !== 1 ? 's' : ''} in the past
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="detail-card">
            <div className="detail-card__header">
              <span className="detail-card__title">Description</span>
            </div>
            <div className="detail-card__body">
              <div className="desc-block">{ticket.description}</div>
            </div>
          </div>

          {/* Notes log */}
          <div className="detail-card">
            <div className="detail-card__header">
              <span className="detail-card__title">Internal Notes</span>
              <span style={{ fontSize: "0.6875rem", color: "var(--text-3)" }}>
                {ticket.notes.length} note{ticket.notes.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="detail-card__body">
              {(ticket.notes ?? []).length === 0 ? (
                <p className="note-empty">No notes yet.</p>
              ) : (
                [...(ticket.notes ?? [])].reverse().map((note) => (
                  <div key={note.id} className="note-entry">
                    <div className="note-entry__meta">{fmtDateTime(note.created_at)}</div>
                    <div className="note-entry__text">{note.note_text}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ── Right: update panel ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="detail-card">
            <div className="detail-card__header">
              <span className="detail-card__title">Update Ticket</span>
            </div>
            <div className="detail-card__body">

              {/* Status selector */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: "0.6875rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-3)", marginBottom: 6 }}>
                  Status
                </div>
                <select
                  id="detail-status-select"
                  className="status-select"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  disabled={ticket.status === "Closed"}
                >
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              {/* Note input */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: "0.6875rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-3)", marginBottom: 6 }}>
                  Add Note
                </div>
                <textarea
                  id="detail-note-input"
                  className="note-textarea"
                  placeholder="Write an internal note…"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  disabled={ticket.status === "Closed"}
                />
              </div>

              {/* Flash message */}
              {flash && (
                <div className={`alert ${flash.type === "ok" ? "alert-ok" : "alert-err"}`} style={{ marginBottom: 12 }}>
                  {flash.type === "ok" && <CheckCircle2 size={13} style={{ display: "inline", marginRight: 5 }} />}
                  {flash.msg}
                </div>
              )}

              <button
                id="detail-save-btn"
                className="btn btn-primary"
                style={{ width: "100%" }}
                onClick={handleSave}
                disabled={saving || ticket.status === "Closed"}
              >
                {saving
                  ? <><Loader2 size={13} className="spin" /> Saving…</>
                  : "Save Changes"}
              </button>

              {ticket.status === "Closed" && (
                <p style={{ fontSize: "0.75rem", color: "var(--text-3)", textAlign: "center", marginTop: 10 }}>
                  This ticket is closed and cannot be modified.
                </p>
              )}
            </div>
          </div>
        </div>

      </div>
    </>
  );
}