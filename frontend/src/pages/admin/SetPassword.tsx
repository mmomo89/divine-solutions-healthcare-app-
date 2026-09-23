import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { adminPath } from "../../config";
import api from "../../api/client";

const SetPassword: React.FC = () => {
  const { token } = useParams();
  const [checking, setChecking] = useState(true);
  const [validInfo, setValidInfo] = useState<{ username: string; email: string } | null>(null);
  const [invalidReason, setInvalidReason] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (!token) return;
    api
      .get(`/auth/invitation/${token}/`)
      .then((res) => setValidInfo(res.data))
      .catch((err) => setInvalidReason(err?.response?.data?.detail || "This setup link is invalid."))
      .finally(() => setChecking(false));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setResult({ ok: false, text: "Password must be at least 8 characters." });
      return;
    }
    if (password !== confirmPassword) {
      setResult({ ok: false, text: "Passwords do not match." });
      return;
    }
    setSubmitting(true);
    setResult(null);
    try {
      await api.post(`/auth/invitation/${token}/accept/`, { password });
      setResult({ ok: true, text: "Your password has been set. You can now sign in." });
    } catch (err: any) {
      setResult({ ok: false, text: err?.response?.data?.detail || "Something went wrong. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="adm-login-shell">
      <div className="adm-login-box">
        <h1>Divine Solutions Healthcare</h1>
        <p className="sub">Set Up Your Admin Account</p>

        {checking && <p className="muted">Checking your setup link\u2026</p>}

        {!checking && invalidReason && (
          <>
            <div className="adm-alert error">{invalidReason}</div>
            <p className="muted" style={{ fontSize: "0.85rem" }}>
              Ask a Super Admin to resend your invitation from the Users page.
            </p>
            <Link to={adminPath("/login")} className="adm-btn secondary" style={{ width: "100%", justifyContent: "center" }}>
              Back to Login
            </Link>
          </>
        )}

        {!checking && validInfo && !result?.ok && (
          <>
            <p className="muted" style={{ fontSize: "0.9rem" }}>
              Welcome, <strong>{validInfo.username}</strong>. Choose a password to activate your account.
            </p>
            {result && !result.ok && <div className="adm-alert error">{result.text}</div>}
            <form onSubmit={handleSubmit}>
              <div className="adm-field">
                <label htmlFor="password">New Password</label>
                <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus required />
                <div className="hint">At least 8 characters.</div>
              </div>
              <div className="adm-field">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
              </div>
              <button type="submit" className="adm-btn" style={{ width: "100%", justifyContent: "center" }} disabled={submitting}>
                {submitting ? "Setting Password\u2026" : "Set Password & Continue"}
              </button>
            </form>
          </>
        )}

        {result?.ok && (
          <>
            <div className="adm-alert success">{result.text}</div>
            <Link to={adminPath("/login")} className="adm-btn" style={{ width: "100%", justifyContent: "center" }}>
              Go to Login
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default SetPassword;
