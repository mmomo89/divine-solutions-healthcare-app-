import React, { useEffect, useState } from "react";
import api from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import type { AdminUser } from "../../types";

interface NewUserForm {
  username: string;
  email: string;
  role: "super_admin" | "content_admin";
  is_active: boolean;
}

interface EditForm {
  id: number;
  username: string;
  email: string;
  role: "super_admin" | "content_admin";
  is_active: boolean;
}

const emptyNewUser: NewUserForm = { username: "", email: "", role: "content_admin", is_active: true };

const Users: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [creating, setCreating] = useState<NewUserForm | null>(null);
  const [editing, setEditing] = useState<EditForm | null>(null);
  const [resetTarget, setResetTarget] = useState<AdminUser | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [inviteLink, setInviteLink] = useState<{ username: string; link: string } | null>(null);

  const load = () => {
    api.get("/users/").then((res) => setUsers(res.data.results || res.data));
  };
  useEffect(() => { load(); }, []);

  const createUser = async () => {
    if (!creating) return;
    if (!creating.username.trim() || !creating.email.trim()) {
      setMessage({ ok: false, text: "Username and email are required." });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const res = await api.post("/users/", creating);
      setMessage({ ok: true, text: `User "${creating.username}" created. A setup link was emailed to them.` });
      setInviteLink({ username: creating.username, link: res.data.invite_link });
      setCreating(null);
      load();
    } catch (err: any) {
      const data = err?.response?.data;
      setMessage({ ok: false, text: (data && Object.values(data).flat().join(" ")) || "Something went wrong." });
    } finally {
      setSaving(false);
    }
  };

  const saveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    setMessage(null);
    try {
      await api.patch(`/users/${editing.id}/`, {
        username: editing.username,
        email: editing.email,
        role: editing.role,
        is_active: editing.is_active,
      });
      setMessage({ ok: true, text: "User updated." });
      setEditing(null);
      load();
    } catch (err: any) {
      const data = err?.response?.data;
      setMessage({ ok: false, text: (data && (data.detail || Object.values(data).flat().join(" "))) || "Something went wrong." });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (u: AdminUser) => {
    if (!confirm(`Delete user "${u.username}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/users/${u.id}/`);
      load();
    } catch (err: any) {
      alert(err?.response?.data?.detail || "Could not delete this user.");
    }
  };

  const doResetPassword = async () => {
    if (!resetTarget) return;
    if (resetPassword.length < 8) {
      setMessage({ ok: false, text: "New password must be at least 8 characters." });
      return;
    }
    setSaving(true);
    try {
      await api.post(`/users/${resetTarget.id}/reset_password/`, { new_password: resetPassword });
      setMessage({ ok: true, text: `Password reset for ${resetTarget.username}.` });
      setResetTarget(null);
      setResetPassword("");
    } catch (err: any) {
      setMessage({ ok: false, text: err?.response?.data?.detail || "Could not reset password." });
    } finally {
      setSaving(false);
    }
  };

  const resendInvite = async (u: AdminUser) => {
    setMessage(null);
    try {
      const res = await api.post(`/users/${u.id}/resend_invite/`);
      setMessage({ ok: true, text: res.data.detail });
      setInviteLink({ username: u.username, link: res.data.invite_link });
      load();
    } catch (err: any) {
      setMessage({ ok: false, text: err?.response?.data?.detail || "Could not resend invitation." });
    }
  };

  const copyLink = (link: string) => {
    navigator.clipboard?.writeText(link);
  };

  return (
    <div>
      <div className="adm-page-title">
        <h1>Users</h1>
        <button className="adm-btn" onClick={() => { setCreating({ ...emptyNewUser }); setMessage(null); }}>Add User</button>
      </div>

      {message && <div className={`adm-alert ${message.ok ? "success" : "error"}`}>{message.text}</div>}

      {inviteLink && (
        <div className="adm-panel">
          <h2>Setup Link for {inviteLink.username}</h2>
          <p className="muted" style={{ marginTop: -4 }}>
            An email was sent automatically. If your mail server isn't configured yet (or for convenience), you
            can also copy this one-time link and share it directly \u2014 it expires in 7 days.
          </p>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input readOnly value={inviteLink.link} style={{ flex: 1 }} onFocus={(e) => e.target.select()} />
            <button className="adm-btn small secondary" onClick={() => copyLink(inviteLink.link)}>Copy</button>
            <button className="adm-btn small secondary" onClick={() => setInviteLink(null)}>Dismiss</button>
          </div>
        </div>
      )}

      <div className="adm-panel">
        <p className="muted" style={{ marginTop: -4 }}>
          Super Admins have full access, including managing other administrator accounts. Content Admins can
          manage pages, services, resources, media, and view submissions, but cannot manage users. New users set
          their own password via an emailed one-time setup link \u2014 Super Admins never type a password for them.
        </p>
        <table className="adm-table">
          <thead><tr><th>Username</th><th>Email</th><th>Role</th><th>Active</th><th>Setup</th><th></th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.username}{u.id === currentUser?.id && <span className="muted"> (you)</span>}</td>
                <td className="muted">{u.email}</td>
                <td style={{ textTransform: "capitalize" }}>{u.role.replace("_", " ")}</td>
                <td>{u.is_active ? "Yes" : "No"}</td>
                <td>
                  {u.needs_setup ? <span className="adm-badge draft">Pending setup</span> : <span className="adm-badge published">Complete</span>}
                </td>
                <td style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    className="adm-btn small secondary"
                    onClick={() => { setEditing({ id: u.id, username: u.username, email: u.email, role: u.role, is_active: u.is_active }); setMessage(null); }}
                  >
                    Edit
                  </button>
                  {u.needs_setup ? (
                    <button className="adm-btn small secondary" onClick={() => resendInvite(u)}>Resend Invite</button>
                  ) : (
                    <button className="adm-btn small secondary" onClick={() => { setResetTarget(u); setResetPassword(""); setMessage(null); }}>
                      Reset Password
                    </button>
                  )}
                  {u.id !== currentUser?.id && (
                    <button className="adm-btn small danger" onClick={() => remove(u)}>Delete</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {creating && (
        <div className="adm-panel">
          <h2>New User</h2>
          <p className="muted" style={{ marginTop: -4, fontSize: "0.85rem" }}>
            They'll receive a one-time link to set their own password \u2014 no password is set here.
          </p>
          <div className="adm-two-col" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <div>
              <div className="adm-field">
                <label>Username</label>
                <input value={creating.username} onChange={(e) => setCreating({ ...creating, username: e.target.value })} />
              </div>
              <div className="adm-field">
                <label>Email</label>
                <input type="email" value={creating.email} onChange={(e) => setCreating({ ...creating, email: e.target.value })} />
                <div className="hint">The setup link is emailed here.</div>
              </div>
            </div>
            <div>
              <div className="adm-field">
                <label>Role</label>
                <select value={creating.role} onChange={(e) => setCreating({ ...creating, role: e.target.value as NewUserForm["role"] })}>
                  <option value="content_admin">Content Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
              <div className="adm-field checkbox">
                <input type="checkbox" id="new_is_active" checked={creating.is_active} onChange={(e) => setCreating({ ...creating, is_active: e.target.checked })} />
                <label htmlFor="new_is_active" style={{ marginBottom: 0 }}>Active</label>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="adm-btn" onClick={createUser} disabled={saving}>{saving ? "Creating\u2026" : "Create & Send Invite"}</button>
            <button className="adm-btn secondary" onClick={() => setCreating(null)}>Cancel</button>
          </div>
        </div>
      )}

      {editing && (
        <div className="adm-panel">
          <h2>Edit User: {editing.username}</h2>
          <div className="adm-two-col" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <div>
              <div className="adm-field">
                <label>Username</label>
                <input value={editing.username} onChange={(e) => setEditing({ ...editing, username: e.target.value })} />
              </div>
              <div className="adm-field">
                <label>Email</label>
                <input type="email" value={editing.email} onChange={(e) => setEditing({ ...editing, email: e.target.value })} />
              </div>
            </div>
            <div>
              <div className="adm-field">
                <label>Role</label>
                <select
                  value={editing.role}
                  onChange={(e) => setEditing({ ...editing, role: e.target.value as EditForm["role"] })}
                  disabled={editing.id === currentUser?.id}
                >
                  <option value="content_admin">Content Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
                {editing.id === currentUser?.id && <div className="hint">You can't change your own role.</div>}
              </div>
              <div className="adm-field checkbox">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={editing.is_active}
                  onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })}
                  disabled={editing.id === currentUser?.id}
                />
                <label htmlFor="is_active" style={{ marginBottom: 0 }}>Active</label>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="adm-btn" onClick={saveEdit} disabled={saving}>{saving ? "Saving\u2026" : "Save"}</button>
            <button className="adm-btn secondary" onClick={() => setEditing(null)}>Cancel</button>
          </div>
        </div>
      )}

      {resetTarget && (
        <div className="adm-panel">
          <h2>Reset Password: {resetTarget.username}</h2>
          <div className="adm-field">
            <label>New Password</label>
            <input type="password" value={resetPassword} onChange={(e) => setResetPassword(e.target.value)} />
            <div className="hint">At least 8 characters. The user will need this new password on their next login.</div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="adm-btn" onClick={doResetPassword} disabled={saving}>{saving ? "Resetting\u2026" : "Reset Password"}</button>
            <button className="adm-btn secondary" onClick={() => setResetTarget(null)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
