import React, { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { adminPath } from "../../config";

const Login: React.FC = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionNotice] = useState(() => {
    const reason = sessionStorage.getItem("dsh_logout_reason");
    if (reason) sessionStorage.removeItem("dsh_logout_reason");
    return reason === "idle" ? "You were signed out after a period of inactivity. Please sign in again." : "";
  });

  if (user) return <Navigate to={adminPath()} replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(username, password);
      navigate(adminPath());
    } catch (err) {
      setError("Invalid username or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="adm-login-shell">
      <div className="adm-login-box">
        <h1>Divine Solutions Healthcare</h1>
        <p className="sub">Admin CMS Login</p>
        {sessionNotice && <div className="adm-alert" style={{ background: "#fff4e0", color: "#8a6416" }}>{sessionNotice}</div>}
        {error && <div className="adm-alert error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="adm-field">
            <label htmlFor="username">Username</label>
            <input id="username" value={username} onChange={(e) => setUsername(e.target.value)} autoFocus required />
          </div>
          <div className="adm-field">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="adm-btn" style={{ width: "100%", justifyContent: "center" }} disabled={loading}>
            {loading ? "Signing in\u2026" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
