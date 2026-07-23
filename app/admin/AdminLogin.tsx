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
              style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#6b7e77", display: "flex", alignItems: "center", justifyContent: "center" }}
              title={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
              )}
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
