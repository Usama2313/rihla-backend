"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type User = { phone: string; role: string; status: string; lastLoginAt?: string | null };

export default function AccountPortal() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { fetch("/api/auth", { cache: "no-store" }).then((response) => response.json()).then((data) => { if (!data.user) router.replace("/login"); else setUser(data.user); }).finally(() => setLoading(false)); }, [router]);
  const logout = async () => { await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "logout" }) }); router.push("/login"); };
  if (loading || !user) return <main className="accountLoading">Opening your secure workspace…</main>;
  const pending = user.status === "pending";
  return <main className="accountPage"><header><a href="/" className="authBrand"><span>R</span> rihla</a><button onClick={logout}>Sign out</button></header><section><aside><small>{user.role} PORTAL</small><h1>{pending ? "Account received" : `Welcome to your ${user.role} workspace`}</h1><p>{user.phone}</p></aside><article><span className={`accountStatus ${pending ? "pending" : "active"}`}>{pending ? "Awaiting owner approval" : "Verified and active"}</span>{pending ? <><h2>Your mobile is verified.</h2><p>The Rihla owner will review your {user.role} registration. You can sign in and check the status at any time.</p></> : <><h2>Your secure account is ready.</h2><p>Bookings, quotes and account tools assigned to this mobile number will appear here.</p><div className="accountTiles"><div><strong>Bookings</strong><span>View your booking records</span></div><div><strong>Profile</strong><span>Verified mobile account</span></div><div><strong>Support</strong><span>Contact the Rihla team</span></div></div></>}<a className="accountHome" href="/">Continue to booking platform →</a></article></section></main>;
}
