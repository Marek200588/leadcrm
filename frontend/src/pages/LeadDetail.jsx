import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api";
import {
  STATUSES,
  ACTIVITY_TYPES,
  formatMoney,
  formatDate,
  formatRelative,
  statusLabel,
} from "../lib/constants";
import { Spinner } from "../components/ui";
import Modal from "../components/Modal";
import "./LeadDetail.css";

const ACTIVITY_ICON = {
  note: "✎",
  call: "☎",
  email: "✉",
  meeting: "◷",
  status_change: "⇄",
};

export default function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState(false);
  const [activityType, setActivityType] = useState("note");
  const [activityText, setActivityText] = useState("");
  const [addingActivity, setAddingActivity] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(() => {
    api
      .getLead(id)
      .then(setLead)
      .catch((err) => {
        if (err.status === 404) setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const changeStatus = async (status) => {
    if (status === lead.status) return;
    setSavingStatus(true);
    try {
      const updated = await api.updateLead(id, { status });
      setLead(updated);
    } finally {
      setSavingStatus(false);
    }
  };

  const submitActivity = async (e) => {
    e.preventDefault();
    if (!activityText.trim()) return;
    setAddingActivity(true);
    try {
      await api.addActivity(id, { type: activityType, content: activityText.trim() });
      setActivityText("");
      setActivityType("note");
      const refreshed = await api.getLead(id);
      setLead(refreshed);
    } finally {
      setAddingActivity(false);
    }
  };

  const handleDelete = async () => {
    await api.deleteLead(id);
    navigate("/leads");
  };

  if (loading) return <div className="page"><Spinner label="Loading lead…" /></div>;

  if (notFound) {
    return (
      <div className="page">
        <div className="card lead-notfound">
          <h2>Lead not found</h2>
          <p>It may have been deleted, or it belongs to another account.</p>
          <button className="btn btn-primary" onClick={() => navigate("/leads")}>
            Back to leads
          </button>
        </div>
      </div>
    );
  }

  const contactRows = [
    { label: "Contact", value: lead.contact_name },
    { label: "Email", value: lead.email, href: lead.email ? `mailto:${lead.email}` : null },
    { label: "Phone", value: lead.phone, href: lead.phone ? `tel:${lead.phone}` : null },
    {
      label: "Website",
      value: lead.website,
      href: lead.website
        ? lead.website.startsWith("http")
          ? lead.website
          : `https://${lead.website}`
        : null,
    },
    { label: "Address", value: lead.address },
    { label: "Category", value: lead.category },
  ];

  return (
    <div className="page">
      <button className="lead-back" onClick={() => navigate("/leads")}>
        ← Leads
      </button>

      <div className="lead-detail-head">
        <div>
          <h1 className="lead-detail-company">{lead.company}</h1>
          <p className="lead-detail-meta">
            Added {formatDate(lead.created_at)} · Updated {formatRelative(lead.updated_at)}
          </p>
        </div>
        <div className="lead-detail-value">
          <span className="lead-detail-value-label">Estimated value</span>
          <span className="lead-detail-value-num tnum">
            {formatMoney(lead.estimated_value)}
          </span>
        </div>
      </div>

      {/* Stage selector */}
      <div className="card lead-stage-card">
        <span className="lead-stage-label">Pipeline stage</span>
        <div className="lead-stage-track">
          {STATUSES.map((s) => (
            <button
              key={s.key}
              className={
                lead.status === s.key ? "lead-stage-btn active" : "lead-stage-btn"
              }
              style={lead.status === s.key ? { "--stage": s.color } : {}}
              onClick={() => changeStatus(s.key)}
              disabled={savingStatus}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="lead-detail-grid">
        {/* Left: contact details + notes */}
        <div className="lead-detail-col">
          <section className="card lead-info-card">
            <h2 className="lead-card-title">Details</h2>
            <dl className="lead-info-list">
              {contactRows.map((row) => (
                <div key={row.label} className="lead-info-row">
                  <dt>{row.label}</dt>
                  <dd>
                    {row.value ? (
                      row.href ? (
                        <a href={row.href} target="_blank" rel="noreferrer" className="lead-link">
                          {row.value}
                        </a>
                      ) : (
                        row.value
                      )
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          {lead.notes && (
            <section className="card lead-notes-card">
              <h2 className="lead-card-title">Notes</h2>
              <p className="lead-notes-text">{lead.notes}</p>
            </section>
          )}

          <button className="btn btn-danger-ghost lead-delete-btn" onClick={() => setShowDelete(true)}>
            Delete lead
          </button>
        </div>

        {/* Right: activity timeline */}
        <div className="lead-detail-col">
          <section className="card lead-activity-card">
            <h2 className="lead-card-title">Activity</h2>

            <form onSubmit={submitActivity} className="lead-activity-form">
              <div className="lead-activity-type-tabs">
                {ACTIVITY_TYPES.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    className={
                      activityType === t.key
                        ? "lead-activity-type active"
                        : "lead-activity-type"
                    }
                    onClick={() => setActivityType(t.key)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <textarea
                className="input lead-activity-input"
                value={activityText}
                onChange={(e) => setActivityText(e.target.value)}
                placeholder="Log a call, note, or next step…"
              />
              <button
                type="submit"
                className="btn btn-accent lead-activity-submit"
                disabled={addingActivity || !activityText.trim()}
              >
                {addingActivity ? "Adding…" : "Add to timeline"}
              </button>
            </form>

            <div className="lead-timeline">
              {lead.activities.length === 0 ? (
                <p className="lead-timeline-empty">
                  No activity yet. Log your first touchpoint above.
                </p>
              ) : (
                lead.activities.map((a) => (
                  <div key={a.id} className="lead-timeline-item">
                    <div className={`lead-timeline-icon type-${a.type}`}>
                      {ACTIVITY_ICON[a.type] || "•"}
                    </div>
                    <div className="lead-timeline-body">
                      <div className="lead-timeline-top">
                        <span className="lead-timeline-type">
                          {a.type === "status_change" ? "Status" : statusLabelType(a.type)}
                        </span>
                        <span className="lead-timeline-time">{formatRelative(a.created_at)}</span>
                      </div>
                      <p className="lead-timeline-content">{a.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>

      <Modal open={showDelete} onClose={() => setShowDelete(false)} title="Delete lead" width={400}>
        <p className="lead-delete-confirm">
          Delete <strong>{lead.company}</strong>? This removes the lead and its entire
          activity history. This can't be undone.
        </p>
        <div className="lead-form-actions">
          <button className="btn btn-ghost" onClick={() => setShowDelete(false)}>
            Cancel
          </button>
          <button className="btn btn-danger-solid" onClick={handleDelete}>
            Delete lead
          </button>
        </div>
      </Modal>
    </div>
  );
}

function statusLabelType(type) {
  return ACTIVITY_TYPES.find((t) => t.key === type)?.label ?? type;
}
