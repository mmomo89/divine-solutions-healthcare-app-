import React, { useState } from "react";
import api from "../../api/client";
import { useAuth } from "../../context/AuthContext";

const Account: React.FC = () => {
  const { user } = useAuth();
  const [username, setUsername] = useState(user?.username || "");
  const [email, setEmail] = useState(user?.email || "");
  const [profileMsg, setProfileMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [savingPassword, setSavingPassword] = useState(false);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg(null);
    try {
      await api.patch("/auth/me/", { username, email });
      setProfileMsg({ ok: true, text: "Profile updated. Your new username takes effect immediately." });
    } catch (err: any) {
      const data = err?.response?.data;
      setProfileMsg({ ok: false, text: (data && Object.values(data).flat().join(" ")) || "Could not update profile." });
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);
    if (newPassword.length < 8) {
      setPasswordMsg({ ok: false, text: "New password must be at least 8 characters." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ ok: false, text: "New password and confirmation do not match." });
      return;
    }
    setSavingPassword(true);
    try {
      await api.post("/auth/change-password/", { current_password: currentPassword, new_password: newPassword });
      setPasswordMsg({ ok: true, text: "Password changed successfully." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordMsg({ ok: false, text: err?.response?.data?.detail || "Could not change password." });
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div>
      <div className="adm-page-title"><h1>My Account</h1></div>

      <div className="adm-two-col">
        <div className="adm-panel">
          <h2>Profile</h2>
          {profileMsg && <div className={`adm-alert ${profileMsg.ok ? "success" : "error"}`}>{profileMsg.text}</div>}
          <form onSubmit={saveProfile}>
            <div className="adm-field">
              <label>Username</label>
              <input value={username} onChange={(e) => setUsername(e.target.value)} required />
            </div>
            <div className="adm-field">
              <label>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <button className="adm-btn" type="submit" disabled={savingProfile}>
              {savingProfile ? "Saving\u2026" : "Save Profile"}
            </button>
          </form>
        </div>

        <div className="adm-panel">
          <h2>Change Password</h2>
          {passwordMsg && <div className={`adm-alert ${passwordMsg.ok ? "success" : "error"}`}>{passwordMsg.text}</div>}
          <form onSubmit={savePassword}>
            <div className="adm-field">
              <label>Current Password</label>
              <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
            </div>
            <div className="adm-field">
              <label>New Password</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
              <div className="hint">At least 8 characters.</div>
            </div>
            <div className="adm-field">
              <label>Confirm New Password</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            </div>
            <button className="adm-btn" type="submit" disabled={savingPassword}>
              {savingPassword ? "Updating\u2026" : "Change Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Account;
