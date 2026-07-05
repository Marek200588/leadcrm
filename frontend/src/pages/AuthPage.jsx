import { useState } from "react";
import { useAuth } from "../lib/auth";
import { ApiError } from "../lib/api";
import "./AuthPage.css";

export default function AuthPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ email: "", fullName: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const isLogin = mode === "login";
  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (isLogin) {
        await login(form.email, form.password);
      } else {
        await register(form.email, form.fullName, form.password);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.detail || "Something went wrong. Try again.");
      } else {
        setError("Can't reach the server. Is the backend running?");
      }
      setBusy(false);
    }
  };

  return (
    <div className="auth">
      <aside className="auth-brand">
        <div className="auth-brand-inner">
          <div className="auth-logo">
            <span className="auth-logo-mark">◆</span> LeadCRM
          </div>
          <div className="auth-pitch">
            <p className="auth-pitch-eyebrow">Pipeline that pays</p>
            <h1 className="auth-pitch-head">
              Every lead,
              <br />
              from first touch
              <br />
              to <em>closed–won</em>.
            </h1>
            <p className="auth-pitch-sub">
              Capture, qualify, and track prospects in one place. Import
              straight from your scraper and watch the pipeline fill.
            </p>
          </div>
          <div className="auth-brand-foot">
            <div className="auth-metric">
              <span className="auth-metric-num">6</span>
              <span className="auth-metric-label">pipeline stages</span>
            </div>
            <div className="auth-metric">
              <span className="auth-metric-num">1</span>
              <span className="auth-metric-label">click bulk import</span>
            </div>
          </div>
        </div>
      </aside>

      <main className="auth-form-wrap">
        <div className="auth-form-card">
          <div className="auth-tabs">
            <button
              className={isLogin ? "auth-tab active" : "auth-tab"}
              onClick={() => { setMode("login"); setError(""); }}
            >
              Sign in
            </button>
            <button
              className={!isLogin ? "auth-tab active" : "auth-tab"}
              onClick={() => { setMode("register"); setError(""); }}
            >
              Create account
            </button>
          </div>

          <h2 className="auth-form-title">
            {isLogin ? "Welcome back" : "Start your pipeline"}
          </h2>
          <p className="auth-form-sub">
            {isLogin
              ? "Sign in to pick up where you left off."
              : "Create an account — it takes about ten seconds."}
          </p>

          <form onSubmit={submit} className="auth-fields">
            {!isLogin && (
              <div className="field">
                <label htmlFor="fullName">Full name</label>
                <input
                  id="fullName"
                  className="input"
                  value={form.fullName}
                  onChange={update("fullName")}
                  placeholder="Jane Doe"
                  required
                />
              </div>
            )}
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                className="input"
                value={form.email}
                onChange={update("email")}
                placeholder="you@company.com"
                required
              />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                className="input"
                value={form.password}
                onChange={update("password")}
                placeholder={isLogin ? "Your password" : "At least 8 characters"}
                minLength={isLogin ? undefined : 8}
                required
              />
            </div>

            {error && <div className="auth-error">{error}</div>}

            <button type="submit" className="btn btn-primary auth-submit" disabled={busy}>
              {busy ? "Working…" : isLogin ? "Sign in" : "Create your account"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
