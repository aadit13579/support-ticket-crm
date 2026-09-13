import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { fetchApi } from "../api/client";

/* ── Validation rules (frontend regex — no backend needed) ─── */
const RULES = {
  customer_name: {
    required: true,
    pattern: /^[a-zA-Z\s'-]{2,80}$/,
    message: "Full name required (letters, spaces, hyphens only).",
  },
  customer_email: {
    required: true,
    // RFC-5322 simplified
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
    message: "Enter a valid email address.",
  },
  subject: {
    required: true,
    pattern: /^.{5,120}$/,
    message: "Subject must be 5–120 characters.",
  },
  description: {
    required: true,
    pattern: /^[\s\S]{10,2000}$/,
    message: "Description must be 10–2000 characters.",
  },
};

function validate(fields) {
  const errors = {};
  for (const [key, rule] of Object.entries(RULES)) {
    const val = (fields[key] || "").trim();
    if (!val && rule.required) { errors[key] = "This field is required."; continue; }
    if (val && !rule.pattern.test(val)) { errors[key] = rule.message; }
  }
  return errors;
}

const EMPTY = { customer_name: "", customer_email: "", subject: "", description: "" };

export default function CreateTicketPage() {
  const navigate       = useNavigate();
  const [fields, setFields]   = useState(EMPTY);
  const [errors, setErrors]   = useState({});
  const [submitting, setSubmit] = useState(false);
  const [created, setCreated] = useState(null); // { ticket_id, created_at }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFields((f) => ({ ...f, [name]: value }));
    // Clear error on change
    if (errors[name]) setErrors((er) => ({ ...er, [name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate(fields);
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSubmit(true);
    try {
      const data = await fetchApi("/api/tickets", {
        method: "POST",
        body: JSON.stringify({
          customer_name:  fields.customer_name.trim(),
          customer_email: fields.customer_email.trim(),
          subject:        fields.subject.trim(),
          description:    fields.description.trim(),
        }),
      });
      setCreated(data);
    } catch (err) {
      setErrors({ _global: err.message || "Submission failed. Try again." });
    } finally {
      setSubmit(false);
    }
  };

  /* ── Success state ── */
  if (created) {
    return (
      <>
        <div>
          <Link to="/" className="back-link"><ArrowLeft /> All Tickets</Link>
          <div className="page-hdr" style={{ marginTop: 6 }}>
            <div className="page-hdr__title">New Ticket</div>
          </div>
        </div>

        <div className="success-box" style={{ maxWidth: 480 }}>
          <CheckCircle2 size={22} style={{ color: "var(--done-tx)" }} />
          <div className="success-box__title">Ticket created successfully</div>
          <div className="success-box__id">{created.ticket_id}</div>
          <div className="success-box__sub">
            Raised on{" "}
            {new Date(created.created_at).toLocaleString("en-GB", {
              day: "2-digit", month: "short", year: "numeric",
              hour: "2-digit", minute: "2-digit",
            })}
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
            <Link to={`/tickets/${created.ticket_id}`} className="btn btn-primary">
              View Ticket
            </Link>
            <button
              className="btn btn-ghost"
              onClick={() => { setCreated(null); setFields(EMPTY); }}
            >
              Raise Another
            </button>
          </div>
        </div>
      </>
    );
  }

  /* ── Form ── */
  return (
    <>
      <div>
        <Link to="/" className="back-link"><ArrowLeft /> All Tickets</Link>
        <div className="page-hdr" style={{ marginTop: 6 }}>
          <div className="page-hdr__title">New Ticket</div>
          <div className="page-hdr__sub">All fields are required</div>
        </div>
      </div>

      <form className="form-card" onSubmit={handleSubmit} noValidate>
        <div className="form-body">

          {/* Global error */}
          {errors._global && (
            <div className="alert alert-err">{errors._global}</div>
          )}

          {/* Two-col row: name + email */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>

            <div className="form-field">
              <label className="form-label" htmlFor="customer_name">
                Full Name <span>*</span>
              </label>
              <input
                id="customer_name"
                name="customer_name"
                className={`form-input${errors.customer_name ? " err" : ""}`}
                placeholder="Jane Smith"
                value={fields.customer_name}
                onChange={handleChange}
                autoComplete="name"
              />
              {errors.customer_name && (
                <span className="form-err-msg">{errors.customer_name}</span>
              )}
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="customer_email">
                Email <span>*</span>
              </label>
              <input
                id="customer_email"
                name="customer_email"
                type="email"
                className={`form-input${errors.customer_email ? " err" : ""}`}
                placeholder="jane@example.com"
                value={fields.customer_email}
                onChange={handleChange}
                autoComplete="email"
              />
              {errors.customer_email && (
                <span className="form-err-msg">{errors.customer_email}</span>
              )}
            </div>
          </div>

          {/* Subject */}
          <div className="form-field">
            <label className="form-label" htmlFor="subject">
              Subject <span>*</span>
            </label>
            <input
              id="subject"
              name="subject"
              className={`form-input${errors.subject ? " err" : ""}`}
              placeholder="Brief description of the issue (5–120 characters)"
              value={fields.subject}
              onChange={handleChange}
            />
            {errors.subject && (
              <span className="form-err-msg">{errors.subject}</span>
            )}
          </div>

          {/* Description */}
          <div className="form-field">
            <label className="form-label" htmlFor="description">
              Description <span>*</span>
            </label>
            <textarea
              id="description"
              name="description"
              className={`form-textarea${errors.description ? " err" : ""}`}
              placeholder="Provide full details about the issue…"
              value={fields.description}
              onChange={handleChange}
            />
            {errors.description && (
              <span className="form-err-msg">{errors.description}</span>
            )}
          </div>
        </div>

        <div className="form-footer">
          <Link to="/" className="btn btn-ghost">Cancel</Link>
          <button
            id="submit-ticket-btn"
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
          >
            {submitting
              ? <><Loader2 size={13} className="spin" /> Submitting…</>
              : "Raise Ticket"}
          </button>
        </div>
      </form>

      {/* mobile: collapse two-col to one */}
      <style>{`
        @media (max-width: 560px) {
          .form-body > div[style*="grid"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </>
  );
}