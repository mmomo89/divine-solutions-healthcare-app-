import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../../api/client";
import { adminPath } from "../../config";
import type { FormSubmission, SubmissionReply } from "../../types";

const STATUS_FLOW: FormSubmission["status"][] = ["new", "read", "in_progress", "completed", "archived"];

const templateFor = (submission: FormSubmission): { subject: string; body: string } => {
  const firstName = submission.full_name.split(" ")[0] || submission.full_name;
  if (submission.form_type === "careers") {
    return {
      subject: "Re: Your application to Divine Solutions Healthcare LLC",
      body: `Hi ${firstName},\n\nThank you for applying to join Divine Solutions Healthcare LLC. We've received your application and our team is reviewing it.\n\n[Write your reply here]\n\nWarm regards,\nDivine Solutions Healthcare LLC`,
    };
  }
  return {
    subject: "Re: Your message to Divine Solutions Healthcare LLC",
    body: `Hi ${firstName},\n\nThank you for reaching out to Divine Solutions Healthcare LLC.\n\n[Write your reply here]\n\nWarm regards,\nDivine Solutions Healthcare LLC`,
  };
};

const SubmissionDetail: React.FC = () => {
  const { id } = useParams();
  const [submission, setSubmission] = useState<FormSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const [replies, setReplies] = useState<SubmissionReply[]>([]);
  const [replySubject, setReplySubject] = useState("");
  const [replyBody, setReplyBody] = useState("");
  const [sending, setSending] = useState(false);
  const [replyResult, setReplyResult] = useState<{ ok: boolean; message: string } | null>(null);

  const load = async () => {
    setLoading(true);
    setLoadError("");

    try {
      const { data } = await api.get(`/submissions/${id}/`);
      setSubmission(data);
      setNotes(data.admin_notes || "");

      if (data.status === "new") {
        try {
          const updated = await api.patch(`/submissions/${id}/`, { status: "read" });
          setSubmission(updated.data);
        } catch {
          // Keep the submission visible even if marking it as read fails.
        }
      }

      if (!replySubject && !replyBody) {
        const t = templateFor(data);
        setReplySubject(t.subject);
        setReplyBody(t.body);
      }

      try {
        const replyResponse = await api.get(`/submissions/${id}/replies/`);
        setReplies(replyResponse.data);
      } catch {
        setReplies([]);
      }
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 404) {
        setLoadError("This submission could not be found. It may have been deleted.");
      } else if (status === 401 || status === 403) {
        setLoadError("You do not have permission to view this submission. Please sign in again.");
      } else if (!err?.response) {
        setLoadError("Could not connect to the server. Check your connection and try again.");
      } else {
        setLoadError(`The submission could not be loaded (HTTP ${status || "error"}).`);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadReplies = async () => {
    try {
      const { data } = await api.get(`/submissions/${id}/replies/`);
      setReplies(data);
    } catch {
      setReplies([]);
    }
  };

  useEffect(() => {
    void load();
  }, [id]);

  const setStatus = async (status: string) => {
    const { data } = await api.patch(`/submissions/${id}/`, { status });
    setSubmission(data);
  };

  const saveNotes = async () => {
    setSaving(true);
    try {
      const { data } = await api.patch(`/submissions/${id}/`, { admin_notes: notes });
      setSubmission(data);
    } finally {
      setSaving(false);
    }
  };

  const sendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replySubject.trim() || !replyBody.trim()) return;
    setSending(true);
    setReplyResult(null);
    try {
      await api.post(`/submissions/${id}/replies/`, { subject: replySubject, body: replyBody });
      setReplyResult({ ok: true, message: `Reply sent to ${submission?.email}.` });
      loadReplies();
      // Refresh the submission in case status auto-advanced to "in progress"
      api.get(`/submissions/${id}/`).then((res) => setSubmission(res.data));
      const t = submission ? templateFor(submission) : { subject: "", body: "" };
      setReplySubject(t.subject);
      setReplyBody(t.body);
    } catch (err: any) {
      const detail = err?.response?.data?.error_message || err?.response?.data?.detail;
      setReplyResult({ ok: false, message: detail || "Could not send the reply. Check your email configuration and try again." });
    } finally {
      setSending(false);
    }
  };

  const downloadPdf = () => {
    const token = localStorage.getItem("dsh_access");
    const base = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
    fetch(`${base}/admin/submissions/${id}/pdf/`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `submission-${id}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      });
  };

  if (loading) return <div className="adm-empty">Loading submission…</div>;

  if (!submission) {
    return (
      <div className="adm-panel">
        <h1>Unable to Open Submission</h1>
        <p role="alert">{loadError || "The submission could not be loaded."}</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="adm-btn" onClick={() => void load()}>Try Again</button>
          <Link to={adminPath("/submissions")} className="adm-btn secondary">Back to List</Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="adm-page-title adm-no-print">
        <h1>Submission Detail</h1>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link to={adminPath("/submissions")} className="adm-btn secondary">Back to List</Link>
          <button className="adm-btn secondary" onClick={() => window.print()}>Print</button>
          <button className="adm-btn" onClick={downloadPdf}>Download PDF</button>
        </div>
      </div>

      <div className="adm-two-col">
        <div className="adm-panel">
          <div className="adm-print-only" style={{ marginBottom: 16 }}>
            <h2 style={{ margin: 0 }}>Divine Solutions Healthcare LLC</h2>
            <p className="muted">Submission Record</p>
          </div>

          <h2 style={{ textTransform: "capitalize" }}>{submission.form_type} Submission</h2>
          <table className="adm-table">
            <tbody>
              <tr><th>Submission ID</th><td>{submission.id}</td></tr>
              <tr><th>Date / Time</th><td>{new Date(submission.created_at).toLocaleString()}</td></tr>
              <tr><th>Full Name</th><td>{submission.full_name}</td></tr>
              <tr><th>Email</th><td>{submission.email}</td></tr>
              <tr><th>Phone</th><td>{submission.phone || "\u2014"}</td></tr>
              {Object.entries(submission.extra_data || {}).map(([k, v]) => {
                const displayValue =
                  v == null ? "—" :
                  typeof v === "string" ? v :
                  JSON.stringify(v, null, 2);

                return (
                  <tr key={k}>
                    <th style={{ textTransform: "capitalize" }}>{k.replace(/_/g, " ")}</th>
                    <td style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
                      {displayValue}
                    </td>
                  </tr>
                );
              })}
              <tr><th>Message</th><td>{submission.message || "\u2014"}</td></tr>
              {submission.resume_url && (
                <tr><th>Resume</th><td><a href={submission.resume_url} target="_blank" rel="noopener noreferrer">Download Resume</a></td></tr>
              )}
              <tr><th>Privacy Policy Accepted</th><td>{submission.privacy_accepted ? "Yes" : "No"}</td></tr>
              <tr><th>Source Page</th><td>{submission.source_page}</td></tr>
              <tr><th>Status</th><td><span className={`adm-badge ${submission.status}`}>{submission.status.replace("_", " ")}</span></td></tr>
            </tbody>
          </table>

          {/* Reply history — included in Print/PDF view too, so it's a full correspondence record */}
          <h2 style={{ marginTop: 24 }}>Correspondence</h2>
          {replies.length === 0 && <p className="muted">No replies sent yet.</p>}
          {replies.map((r) => (
            <div key={r.id} style={{ border: "1px solid var(--adm-border)", borderRadius: 8, padding: 12, marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", color: "var(--adm-muted)", marginBottom: 6 }}>
                <span>
                  <strong style={{ color: "var(--adm-text)" }}>{r.sent_by_display}</strong> {"\u2192"} {r.to_email}
                </span>
                <span>{new Date(r.created_at).toLocaleString()}</span>
              </div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>
                {r.subject}{" "}
                {r.status === "failed" && <span className="adm-badge archived" style={{ marginLeft: 6 }}>Failed to send</span>}
              </div>
              <div style={{ whiteSpace: "pre-wrap", fontSize: "0.9rem" }}>{r.body}</div>
              {r.status === "failed" && r.error_message && (
                <div className="form-error" style={{ marginTop: 6 }}>{r.error_message}</div>
              )}
            </div>
          ))}
        </div>

        <div className="adm-no-print">
          <div className="adm-panel">
            <h2>Status</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {STATUS_FLOW.map((s) => (
                <button
                  key={s}
                  className={`adm-btn small ${submission.status === s ? "" : "secondary"}`}
                  onClick={() => setStatus(s)}
                >
                  Mark as {s.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          <div className="adm-panel">
            <h2>Reply to {submission.full_name}</h2>
            <p className="muted" style={{ marginTop: -8, fontSize: "0.82rem" }}>
              Sends a real email to <strong>{submission.email}</strong>. Replies from them will land in{" "}
              your configured admin inbox (set via <code>ADMIN_NOTIFICATION_EMAIL</code>).
            </p>
            <form onSubmit={sendReply}>
              <div className="adm-field">
                <label>Subject</label>
                <input value={replySubject} onChange={(e) => setReplySubject(e.target.value)} required />
              </div>
              <div className="adm-field">
                <label>Message</label>
                <textarea rows={8} value={replyBody} onChange={(e) => setReplyBody(e.target.value)} required />
              </div>
              {replyResult && (
                <div className={`adm-alert ${replyResult.ok ? "success" : "error"}`}>{replyResult.message}</div>
              )}
              <button className="adm-btn" type="submit" disabled={sending}>
                {sending ? "Sending\u2026" : "Send Reply"}
              </button>
            </form>
          </div>

          <div className="adm-panel">
            <h2>Admin Notes</h2>
            <textarea rows={5} value={notes} onChange={(e) => setNotes(e.target.value)} />
            <button className="adm-btn small" style={{ marginTop: 10 }} onClick={saveNotes} disabled={saving}>
              Save Notes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmissionDetail;
