"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "Login failed");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="adminShell" style={{ minHeight: "100vh", display: "grid", placeContent: "center" }}>
      <form onSubmit={handleLogin} className="adminCard" style={{ width: "100%", maxWidth: "400px", padding: "32px", textAlign: "center" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "32px", margin: "0 0 8px" }}>Admin Access</h1>
        <p style={{ color: "#6b7e77", fontSize: "14px", marginBottom: "24px" }}>Sign in to manage Rihla records</p>
        
        {error && (
          <div className="adminMessage" style={{ background: "#fee2e2", borderColor: "#fca5a5", color: "#991b1b", marginBottom: "16px" }}>
            {error}
          </div>
        )}

        <div style={{ textAlign: "left" }}>
          <label style={{ display: "block", fontSize: "12px", textTransform: "uppercase", color: "#506b61", marginBottom: "6px" }}>Username</label>
          <input
            required
            autoFocus
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #d6e3dd", marginBottom: "16px", boxSizing: "border-box" }}
          />

          <label style={{ display: "block", fontSize: "12px", textTransform: "uppercase", color: "#506b61", marginBottom: "6px" }}>Password</label>
          <div style={{ position: "relative", marginBottom: "24px" }}>
            <input
              required
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: "100%", padding: "12px", paddingRight: "40px", borderRadius: "8px", border: "1px solid #d6e3dd", boxSizing: "border-box" }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: "16px", color: "#6b7e77" }}
            >
              {showPassword ? "👁️" : "👁️‍🗨️"}
            </button>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          style={{ width: "100%", padding: "14px", background: "#17624e", color: "white", border: "none", borderRadius: "8px", cursor: loading ? "wait" : "pointer", fontWeight: "bold" }}
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </main>
  );
}
