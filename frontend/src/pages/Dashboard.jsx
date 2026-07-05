import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { formatMoney, formatRelative, statusLabel } from "../lib/constants";
import { PageHeader, StatCard, Spinner, EmptyState } from "../components/ui";
import PipelineBar from "../components/PipelineBar";
import "./Dashboard.css";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([api.dashboard(), api.listLeads({ page_size: 6, sort: "-updated_at" })])
      .then(([s, leads]) => {
        setStats(s);
        setRecent(leads.items);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page"><Spinner label="Loading dashboard…" /></div>;

  const empty = stats.total_leads === 0;

  return (
    <div className="page">
      <PageHeader
        title="Dashboard"
        subtitle="Your pipeline at a glance."
        actions={
          <Link to="/leads" className="btn btn-primary">
            View all leads
          </Link>
        }
      />

      {empty ? (
        <div className="card">
          <EmptyState
            icon="◈"
            title="No leads yet"
            message="Add your first lead or bulk-import from your scraper to see your pipeline come to life."
            action={
              <Link to="/leads" className="btn btn-accent">
                Add your first lead
              </Link>
            }
          />
        </div>
      ) : (
        <>
          <div className="dash-stats">
            <StatCard
              label="Open pipeline"
              value={formatMoney(stats.total_pipeline_value)}
              accent
              sub="Value of leads still in play"
            />
            <StatCard label="Total leads" value={stats.total_leads} sub="Across all stages" />
            <StatCard
              label="Won value"
              value={formatMoney(stats.won_value)}
              sub="Closed and banked"
            />
            <StatCard
              label="Win rate"
              value={`${stats.conversion_rate}%`}
              sub="Won ÷ closed deals"
            />
          </div>

          <section className="card dash-pipeline">
            <div className="dash-section-head">
              <h2 className="dash-section-title">Pipeline by stage</h2>
              <span className="dash-section-note">Segment width = share of value</span>
            </div>
            <PipelineBar byStatus={stats.by_status} />
          </section>

          <section className="card dash-recent">
            <div className="dash-section-head">
              <h2 className="dash-section-title">Recent activity</h2>
              <Link to="/leads" className="dash-section-link">
                See all →
              </Link>
            </div>
            <div className="dash-recent-list">
              {recent.map((lead) => (
                <button
                  key={lead.id}
                  className="dash-recent-row"
                  onClick={() => navigate(`/leads/${lead.id}`)}
                >
                  <span className={`pill pill-${lead.status}`}>
                    {statusLabel(lead.status)}
                  </span>
                  <span className="dash-recent-company">{lead.company}</span>
                  <span className="dash-recent-contact">{lead.contact_name || "—"}</span>
                  <span className="dash-recent-value tnum">{formatMoney(lead.estimated_value)}</span>
                  <span className="dash-recent-time">{formatRelative(lead.updated_at)}</span>
                </button>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
