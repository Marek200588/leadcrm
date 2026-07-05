import { useState } from "react";
import { STATUSES } from "../lib/constants";
import { ApiError } from "../lib/api";
import "./LeadForm.css";

const EMPTY = {
  company: "",
  contact_name: "",
  email: "",
  phone: "",
  website: "",
  address: "",
  category: "",
  status: "new",
  estimated_value: "",
  notes: "",
};

export default function LeadForm({ onSubmit, onCancel }) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const payload = {
        ...form,
        estimated_value: form.estimated_value === "" ? null : Number(form.estimated_value),
      };
      // Strip empty optional strings to null.
      for (const k of ["contact_name", "email", "phone", "website", "address", "category", "notes"]) {
        if (payload[k] === "") payload[k] = null;
      }
      await onSubmit(payload);
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Couldn't save the lead.");
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="lead-form">
      <div className="field">
        <label htmlFor="company">Company *</label>
        <input
          id="company"
          className="input"
          value={form.company}
          onChange={update("company")}
          placeholder="Bud-Mistrz Sp. z o.o."
          required
          autoFocus
        />
      </div>

      <div className="lead-form-row">
        <div className="field">
          <label htmlFor="contact_name">Contact name</label>
          <input
            id="contact_name"
            className="input"
            value={form.contact_name}
            onChange={update("contact_name")}
            placeholder="Jan Kowalski"
          />
        </div>
        <div className="field">
          <label htmlFor="category">Category</label>
          <input
            id="category"
            className="input"
            value={form.category}
            onChange={update("category")}
            placeholder="construction"
          />
        </div>
      </div>

      <div className="lead-form-row">
        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            className="input"
            value={form.email}
            onChange={update("email")}
            placeholder="jan@firma.pl"
          />
        </div>
        <div className="field">
          <label htmlFor="phone">Phone</label>
          <input
            id="phone"
            className="input"
            value={form.phone}
            onChange={update("phone")}
            placeholder="+48 500 600 700"
          />
        </div>
      </div>

      <div className="field">
        <label htmlFor="website">Website</label>
        <input
          id="website"
          className="input"
          value={form.website}
          onChange={update("website")}
          placeholder="https://firma.pl"
        />
      </div>

      <div className="lead-form-row">
        <div className="field">
          <label htmlFor="status">Stage</label>
          <select id="status" className="input" value={form.status} onChange={update("status")}>
            {STATUSES.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="estimated_value">Estimated value ($)</label>
          <input
            id="estimated_value"
            type="number"
            min="0"
            step="100"
            className="input"
            value={form.estimated_value}
            onChange={update("estimated_value")}
            placeholder="5000"
          />
        </div>
      </div>

      <div className="field">
        <label htmlFor="notes">Notes</label>
        <textarea
          id="notes"
          className="input"
          value={form.notes}
          onChange={update("notes")}
          placeholder="Context, next steps, anything useful…"
        />
      </div>

      {error && <div className="auth-error">{error}</div>}

      <div className="lead-form-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? "Saving…" : "Add lead"}
        </button>
      </div>
    </form>
  );
}
