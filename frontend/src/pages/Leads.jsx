import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { STATUSES, formatMoney, formatRelative, statusLabel } from "../lib/constants";
import { PageHeader, Spinner, EmptyState } from "../components/ui";
import Modal from "../components/Modal";
import LeadForm from "../components/LeadForm";
import ImportForm from "../components/ImportForm";
import "./Leads.css";

const PAGE_SIZE = 15;

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sort, setSort] = useState("-created_at");
  const [showCreate, setShowCreate] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [toast, setToast] = useState("");
  const navigate = useNavigate();

  // Debounce the search box.
  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(() => {
    setLoading(true);
    api
      .listLeads({
        page,
        page_size: PAGE_SIZE,
        search: debounced,
        status: statusFilter,
        sort,
      })
      .then((data) => {
        setLeads(data.items);
        setTotal(data.total);
      })
      .finally(() => setLoading(false));
  }, [page, debounced, statusFilter, sort]);

  useEffect(() => { load(); }, [load]);

  const flash = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2600);
  };

  const handleCreate = async (payload) => {
    await api.createLead(payload);
    setShowCreate(false);
    setPage(1);
    load();
    flash("Lead added.");
  };

  const handleImport = async (rows) => {
    const res = await api.importLeads(rows);
    setShowImport(false);
    setPage(1);
    load();
    flash(`Imported ${res.imported} lead${res.imported === 1 ? "" : "s"}.`);
  };

  const toggleSort = (key) => {
    setSort((cur) => (cur === `-${key}` ? key : `-${key}`));
  };

  const sortArrow = (key) =>
    sort === `-${key}` ? " ↓" : sort === key ? " ↑" : "";

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const noFilters = !debounced && !statusFilter;

  return (
    <div className="page">
      <PageHeader
        title="Leads"
        subtitle="Every prospect in your pipeline."
        actions={
          <>
            <button className="btn btn-ghost" onClick={() => setShowImport(true)}>
              Import
            </button>
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
              + New lead
            </button>
          </>
        }
      />

      {/* Filter bar */}
      <div className="leads-controls">
        <div className="leads-search">
          <span className="leads-search-icon">⌕</span>
          <input
            className="leads-search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search company, contact, email…"
          />
        </div>
        <div className="leads-filter-tabs">
          <button
            className={statusFilter === "" ? "leads-filter active" : "leads-filter"}
            onClick={() => { setStatusFilter(""); setPage(1); }}
          >
            All
          </button>
          {STATUSES.map((s) => (
            <button
              key={s.key}
              className={statusFilter === s.key ? "leads-filter active" : "leads-filter"}
              onClick={() => { setStatusFilter(s.key); setPage(1); }}
            >
              <span className="leads-filter-dot" style={{ background: s.color }} />
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card leads-card">
        {loading ? (
          <Spinner label="Loading leads…" />
        ) : leads.length === 0 ? (
          <EmptyState
            icon="◈"
            title={noFilters ? "No leads yet" : "No matches"}
            message={
              noFilters
                ? "Add a lead manually or import a batch from your scraper."
                : "Try a different search or clear the status filter."
            }
            action={
              noFilters ? (
                <button className="btn btn-accent" onClick={() => setShowCreate(true)}>
                  Add your first lead
                </button>
              ) : (
                <button
                  className="btn btn-ghost"
                  onClick={() => { setSearch(""); setStatusFilter(""); }}
                >
                  Clear filters
                </button>
              )
            }
          />
        ) : (
          <table className="leads-table">
            <thead>
              <tr>
                <th className="sortable" onClick={() => toggleSort("company")}>
                  Company{sortArrow("company")}
                </th>
                <th>Contact</th>
                <th>Stage</th>
                <th className="sortable num" onClick={() => toggleSort("score")}>
                  Score{sortArrow("score")}
                </th>
                <th className="sortable num" onClick={() => toggleSort("estimated_value")}>
                  Value{sortArrow("estimated_value")}
                </th>
                <th className="sortable num" onClick={() => toggleSort("updated_at")}>
                  Updated{sortArrow("updated_at")}
                </th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} onClick={() => navigate(`/leads/${lead.id}`)}>
                  <td>
                    <div className="leads-company">{lead.company}</div>
                    {lead.category && <div className="leads-category">{lead.category}</div>}
                  </td>
                  <td className="leads-contact">
                    {lead.contact_name || <span className="muted">—</span>}
                    {lead.email && <div className="leads-email">{lead.email}</div>}
                  </td>
                  <td>
                    <span className={`pill pill-${lead.status}`}>
                      {statusLabel(lead.status)}
                    </span>
                  </td>
                  <td className="num tnum">
                    {lead.score > 0 ? lead.score.toFixed(0) : <span className="muted">—</span>}
                  </td>
                  <td className="num tnum leads-value">
                    {formatMoney(lead.estimated_value)}
                  </td>
                  <td className="num leads-updated">{formatRelative(lead.updated_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {!loading && total > PAGE_SIZE && (
        <div className="leads-pagination">
          <span className="leads-page-info">
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
          </span>
          <div className="leads-page-btns">
            <button
              className="btn btn-ghost"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              ← Prev
            </button>
            <span className="leads-page-num">
              {page} / {totalPages}
            </span>
            <button
              className="btn btn-ghost"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next →
            </button>
          </div>
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New lead" width={560}>
        <LeadForm onSubmit={handleCreate} onCancel={() => setShowCreate(false)} />
      </Modal>

      <Modal open={showImport} onClose={() => setShowImport(false)} title="Import leads">
        <ImportForm onImport={handleImport} onCancel={() => setShowImport(false)} />
      </Modal>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
