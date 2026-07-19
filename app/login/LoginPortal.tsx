"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const countryCodes = [
  ["Bahrain", "973"], ["Saudi Arabia", "966"], ["United Arab Emirates", "971"], ["Kuwait", "965"],
  ["Oman", "968"], ["Qatar", "974"], ["India", "91"], ["Pakistan", "92"], ["United Kingdom", "44"],
  ["United States / Canada", "1"], ["Egypt", "20"], ["Jordan", "962"], ["Indonesia", "62"], ["Malaysia", "60"],
];

type Role = "customer" | "agent" | "supplier";
type Mode = "login" | "otp" | "verify" | "password";

export default function LoginPortal() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("customer");
  const [mode, setMode] = useState<Mode>("login");
  const [countryCode, setCountryCode] = useState("973");
  const [mobile, setMobile] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [setupToken, setSetupToken] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const call = async (action: string, extra: Record<string, string> = {}) => {
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, role, countryCode, mobile, ...extra }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to continue.");
      return data;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to continue.");
      return null;
    } finally { setBusy(false); }
  };

  const login = async (event: React.FormEvent) => {
    event.preventDefault();
    const data = await call("login", { password });
    if (data) router.push("/account");
  };

  const requestOtp = async () => {
    const data = await call("request-otp");
    if (data) { setMode("verify"); setMessage(`OTP sent to ${data.phoneMasked}.`); }
  };

  const verifyOtp = async (event: React.FormEvent) => {
    event.preventDefault();
    const data = await call("verify-otp", { code });
    if (data) { setSetupToken(data.setupToken); setMode("password"); setMessage("Mobile verified. Create your secure password."); }
  };

  const savePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password !== confirmPassword) return setMessage("Passwords do not match.");
    const data = await call("set-password", { setupToken, password });
    if (data) router.push("/account");
  };

  return <main className="authPage"><section className="authStory"><a href="/" className="authBrand"><span>R</span> rihla</a><div><p>SECURE TRAVEL PLATFORM</p><h1>One verified mobile.<br />Your whole journey.</h1><span>Customer bookings, agent operations and supplier access—protected with mobile OTP verification.</span></div><ul><li><b>01</b> Verify your mobile number</li><li><b>02</b> Create or reset your password</li><li><b>03</b> Enter your secure role workspace</li></ul></section>
    <section className="authPanel"><div className="authCard"><header><small>Rihla account access</small><h2>{mode === "login" ? "Welcome back" : mode === "verify" ? "Enter your OTP" : mode === "password" ? "Create a password" : "Verify your mobile"}</h2><p>{mode === "login" ? "Sign in with your registered mobile number." : "We use mobile verification to protect every account."}</p></header>
      <div className="roleTabs" role="tablist" aria-label="Account type">{(["customer", "agent", "supplier"] as Role[]).map((item) => <button key={item} className={role === item ? "active" : ""} onClick={() => { setRole(item); setMessage(""); }} type="button">{item[0].toUpperCase() + item.slice(1)}</button>)}</div>
      {(mode === "login" || mode === "otp") && <form onSubmit={mode === "login" ? login : (event) => { event.preventDefault(); requestOtp(); }}><label>Country code<select value={countryCode} onChange={(event) => setCountryCode(event.target.value)}>{countryCodes.map(([country, codeValue]) => <option key={`${country}-${codeValue}`} value={codeValue}>+{codeValue} · {country}</option>)}</select></label><label>Mobile number<input autoComplete="tel-national" inputMode="tel" required value={mobile} onChange={(event) => setMobile(event.target.value)} placeholder="3445 1249" /></label>{mode === "login" && <label>Password<input autoComplete="current-password" type="password" required value={password} onChange={(event) => setPassword(event.target.value)} /></label>}<button className="authPrimary" disabled={busy} type="submit">{busy ? "Please wait…" : mode === "login" ? "Sign in securely →" : "Send OTP →"}</button></form>}
      {mode === "verify" && <form onSubmit={verifyOtp}><label>One-time password<input className="otpInput" autoComplete="one-time-code" inputMode="numeric" required value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))} placeholder="••••••" /></label><button className="authPrimary" disabled={busy} type="submit">{busy ? "Verifying…" : "Verify OTP →"}</button><button className="authLink" type="button" onClick={requestOtp}>Send a new code</button></form>}
      {mode === "password" && <form onSubmit={savePassword}><label>New password<input autoComplete="new-password" type="password" minLength={10} required value={password} onChange={(event) => setPassword(event.target.value)} /><small>At least 10 characters.</small></label><label>Confirm password<input autoComplete="new-password" type="password" minLength={10} required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} /></label><button className="authPrimary" disabled={busy} type="submit">{busy ? "Saving…" : "Save password →"}</button></form>}
      {message && <p className="authMessage" role="status">{message}</p>}
      {(mode === "login" || mode === "otp") && <div className="authSwitch">{mode === "login" ? <><span>New account or forgot password?</span><button type="button" onClick={() => { setMode("otp"); setMessage(""); }}>Verify by OTP</button></> : <><span>Already registered?</span><button type="button" onClick={() => { setMode("login"); setMessage(""); }}>Sign in</button></>}</div>}
      {(role === "agent" || role === "supplier") && <p className="approvalNote">New {role} accounts require owner approval before privileged access is activated.</p>}
      <footer><span>🔒 Passwords are encrypted and OTP codes are never stored.</span><a href="/">Back to Rihla</a></footer>
    </div></section></main>;
}
