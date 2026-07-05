import { useState } from "react";
import "./ImportForm.css";

const SAMPLE = `[
  { "company": "Bud-Mistrz", "category": "construction", "phone": "+48 500 100 200", "estimated_value": 4000 },
  { "company": "Ubezpieczenia Nowak", "category": "insurance", "email": "biuro@nowak.pl", "estimated_value": 3000 }
]`;

export default function ImportForm({ onImport, onCancel }) {
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError("");
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      setError("That's not valid JSON. Paste an array of lead objects.");
      return;
    }
    if (!Array.isArray(parsed)) {
      setError("Expected a JSON array, like the sample below.");
      return;
    }
    if (parsed.length === 0) {
      setError("The array is empty — nothing to import.");
      return;
    }
    const missing = parsed.find((l) => !l.company);
    if (missing) {
      setError("Every lead needs at least a \"company\" field.");
      return;
    }
    setBusy(true);
    try {
      await onImport(parsed);
    } catch (err) {
      setError(err.detail || "Import failed.");
      setBusy(false);
    }
  };

  return (
    <div className="import-form">
      <p className="import-intro">
        Paste a JSON array exported from your Google Maps scraper. Each object
        needs a <code>company</code>; everything else is optional.
      </p>
      <textarea
        className="input import-textarea"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={SAMPLE}
        spellCheck={false}
      />
      <button className="import-sample-btn" onClick={() => setText(SAMPLE)} type="button">
        Insert sample data
      </button>

      {error && <div className="auth-error">{error}</div>}

      <div className="lead-form-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="button" className="btn btn-primary" onClick={submit} disabled={busy}>
          {busy ? "Importing…" : "Import leads"}
        </button>
      </div>
    </div>
  );
}
