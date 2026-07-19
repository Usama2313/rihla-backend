"use client";

import { useEffect, useMemo, useState } from "react";

type Settings = { businessName: string; whatsapp: string; facebook: string; instagram: string; x: string; linkedin: string; tiktok: string; youtube: string; snapchat: string };
type RecordItem = { id: string; type: string; status: string; customerName: string; email?: string; phone?: string; detailsJson: string; createdAt: string };
type TemplateItem = { id?: number; name: string; badge: string; nights: string; hotel: string; price: string; active: boolean | number; sortOrder: number };
type AccountItem = { id: string; phone: string; role: string; status: string; createdAt: string; lastLoginAt?: string | null };
const emptySettings: Settings = { businessName: "Rihla", whatsapp: "", facebook: "", instagram: "", x: "", linkedin: "", tiktok: "", youtube: "", snapchat: "" };
const emptyTemplate: TemplateItem = { name: "", badge: "Umrah package", nights: "", hotel: "", price: "", active: true, sortOrder: 0 };

export default function AdminDashboard({ owner }: { owner: string }) {
  const [settings, setSettings] = useState(emptySettings);
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [templateDraft, setTemplateDraft] = useState<TemplateItem>(emptyTemplate);
  const [bookingDraft, setBookingDraft] = useState<RecordItem | null>(null);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("Loading saved data…");

  const load = async () => {
    const response = await fetch("/api/admin", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) return setMessage(data.error || "Unable to load data.");
    setSettings({ ...emptySettings, ...data.settings });
    setRecords(data.records || []);
    setTemplates((data.templates || []).map((item: TemplateItem) => ({ ...item, active: Boolean(item.active) })));
    setAccounts(data.accounts || []);
    setMessage("");
  };
  useEffect(() => { load(); }, []);

  const saveSettings = async (event: React.FormEvent) => {
    event.preventDefault(); setMessage("Saving social accounts…");
    const response = await fetch("/api/admin", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(settings) });
    setMessage(response.ok ? "Social accounts saved." : "Could not save settings.");
  };
  const saveTemplate = async (event: React.FormEvent) => {
    event.preventDefault(); setMessage("Saving Umrah template…");
    const response = await fetch("/api/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(templateDraft) });
    const data = await response.json();
    if (!response.ok) return setMessage(data.error || "Template could not be saved.");
    setTemplateDraft(emptyTemplate); await load(); setMessage("Umrah template saved and published.");
  };
  const deleteItem = async (resource: "template" | "booking", id: number | string) => {
    if (!window.confirm(`Delete this ${resource}? This cannot be undone.`)) return;
    const response = await fetch("/api/admin", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ resource, id }) });
    if (!response.ok) return setMessage(`Could not delete ${resource}.`);
    if (resource === "template" && templateDraft.id === id) setTemplateDraft(emptyTemplate);
    if (resource === "booking" && bookingDraft?.id === id) setBookingDraft(null);
    await load(); setMessage(`${resource === "template" ? "Template" : "Booking"} deleted.`);
  };
  const saveBooking = async (event: React.FormEvent) => {
    event.preventDefault(); if (!bookingDraft) return;
    try { JSON.parse(bookingDraft.detailsJson || "{}"); } catch { return setMessage("Booking details must be valid JSON."); }
    const response = await fetch("/api/admin", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ resource: "booking", ...bookingDraft }) });
    if (!response.ok) return setMessage("Booking could not be saved.");
    setBookingDraft(null); await load(); setMessage("Booking record updated.");
  };
  const exportBackup = () => {
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), settings, umrahTemplates: templates, bookingRecords: records, portalAccounts: accounts }, null, 2)], { type: "application/json" });
    const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `rihla-backup-${new Date().toISOString().slice(0, 10)}.json`; link.click(); URL.revokeObjectURL(link.href);
  };
  const updateAccount = async (id: string, status: "pending" | "active" | "suspended") => {
    setMessage("Updating account access…");
    const response = await fetch("/api/admin", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ resource: "account", id, status }) });
    if (!response.ok) return setMessage("Account access could not be updated.");
    await load(); setMessage(`Account marked ${status}.`);
  };
  const filteredRecords = useMemo(() => records.filter((item) => `${item.id} ${item.customerName} ${item.email || ""} ${item.phone || ""} ${item.type} ${item.status}`.toLowerCase().includes(query.toLowerCase())), [records, query]);

  return <main className="adminShell"><header><div><small>Rihla owner workspace</small><h1>Booking back office</h1><p>Signed in as {owner} · Database-backed editable storage</p></div><div><button onClick={exportBackup}>Export complete backup</button><a href="/">View live site</a></div></header>{message && <p className="adminMessage">{message}</p>}
    <section className="adminWorkspace">
      <section className="adminCard recordsCard"><div className="recordsTitle"><div><h2>Customer, Agent & Supplier accounts</h2><p>Approve privileged registrations or suspend access. Customer accounts activate after mobile verification.</p></div><span>{accounts.filter((item) => item.status === "pending").length} pending</span></div><div className="recordList accountAdminList">{accounts.map((item) => <article key={item.id}><div><strong>{item.phone}</strong><small>{item.role} · registered {new Date(item.createdAt).toLocaleString()}</small><span>{item.lastLoginAt ? `Last login ${new Date(item.lastLoginAt).toLocaleString()}` : "No login recorded"}</span></div><span className={`statusBadge status-${item.status}`}>{item.status}</span><button onClick={() => updateAccount(item.id, "active")}>Approve</button><button className="dangerLink" onClick={() => updateAccount(item.id, "suspended")}>Suspend</button></article>)}{!accounts.length && !message && <p>No portal accounts yet.</p>}</div></section>
      <section className="adminCard templateManager"><div className="recordsTitle"><div><h2>Umrah package templates</h2><p>Add, edit, publish, unpublish, or delete packages shown on the booking page.</p></div><button type="button" onClick={() => setTemplateDraft(emptyTemplate)}>+ New template</button></div><div className="templateWorkspace"><form className="adminEditor" onSubmit={saveTemplate}><h3>{templateDraft.id ? `Edit template #${templateDraft.id}` : "New Umrah template"}</h3><label>Package name<input required value={templateDraft.name} onChange={(e) => setTemplateDraft({ ...templateDraft, name: e.target.value })} /></label><div className="adminFormGrid"><label>Badge<input value={templateDraft.badge} onChange={(e) => setTemplateDraft({ ...templateDraft, badge: e.target.value })} /></label><label>Nights<input required placeholder="7 nights" value={templateDraft.nights} onChange={(e) => setTemplateDraft({ ...templateDraft, nights: e.target.value })} /></label><label>Price<input required placeholder="from BHD 329" value={templateDraft.price} onChange={(e) => setTemplateDraft({ ...templateDraft, price: e.target.value })} /></label><label>Display order<input type="number" value={templateDraft.sortOrder} onChange={(e) => setTemplateDraft({ ...templateDraft, sortOrder: Number(e.target.value) })} /></label></div><label>Hotel and package description<textarea required value={templateDraft.hotel} onChange={(e) => setTemplateDraft({ ...templateDraft, hotel: e.target.value })} /></label><label className="adminCheckbox"><input type="checkbox" checked={Boolean(templateDraft.active)} onChange={(e) => setTemplateDraft({ ...templateDraft, active: e.target.checked })} /> Published on the Umrah booking page</label><div className="adminActions"><button type="submit">Save template</button>{templateDraft.id && <button type="button" className="dangerButton" onClick={() => deleteItem("template", templateDraft.id!)}>Delete template</button>}</div></form><div className="templateList">{templates.map((item) => <article key={item.id} className={!item.active ? "inactive" : ""}><span>{item.badge}</span><strong>{item.name}</strong><small>{item.nights} · {item.price}</small><p>{item.hotel}</p><div><button onClick={() => setTemplateDraft({ ...item, active: Boolean(item.active) })}>Edit</button><button className="dangerLink" onClick={() => deleteItem("template", item.id!)}>Delete</button></div></article>)}{!templates.length && <p>No Umrah templates saved.</p>}</div></div></section>
      <section className="adminCard recordsCard"><div className="recordsTitle"><div><h2>Editable booking data store</h2><p>{records.length} durable database records</p></div><div className="recordTools"><input type="search" placeholder="Search bookings…" value={query} onChange={(e) => setQuery(e.target.value)} /><button onClick={exportBackup}>Download JSON</button></div></div>{bookingDraft && <form className="bookingRecordEditor" onSubmit={saveBooking}><div className="recordsTitle"><h3>Edit {bookingDraft.id}</h3><button type="button" onClick={() => setBookingDraft(null)}>Close</button></div><div className="adminFormGrid"><label>Customer<input required value={bookingDraft.customerName} onChange={(e) => setBookingDraft({ ...bookingDraft, customerName: e.target.value })} /></label><label>Type<select value={bookingDraft.type} onChange={(e) => setBookingDraft({ ...bookingDraft, type: e.target.value })}><option>flight</option><option>umrah</option><option>hotel</option><option>travel</option></select></label><label>Status<select value={bookingDraft.status} onChange={(e) => setBookingDraft({ ...bookingDraft, status: e.target.value })}><option>new</option><option>contacted</option><option>confirmed</option><option>closed</option></select></label><label>Email<input type="email" value={bookingDraft.email || ""} onChange={(e) => setBookingDraft({ ...bookingDraft, email: e.target.value })} /></label><label>Phone<input value={bookingDraft.phone || ""} onChange={(e) => setBookingDraft({ ...bookingDraft, phone: e.target.value })} /></label></div><label>Booking details JSON<textarea rows={8} value={bookingDraft.detailsJson} onChange={(e) => setBookingDraft({ ...bookingDraft, detailsJson: e.target.value })} /></label><div className="adminActions"><button type="submit">Save booking record</button><button type="button" className="dangerButton" onClick={() => deleteItem("booking", bookingDraft.id)}>Delete booking</button></div></form>}<div className="recordList">{filteredRecords.map((item) => <article key={item.id}><div><strong>{item.customerName}</strong><small>{item.id} · {item.type} · {new Date(item.createdAt).toLocaleString()}</small><span>{item.email || item.phone || "No contact"}</span></div><span className={`statusBadge status-${item.status}`}>{item.status}</span><button onClick={() => setBookingDraft({ ...item })}>Edit</button><button className="dangerLink" onClick={() => deleteItem("booking", item.id)}>Delete</button></article>)}{!filteredRecords.length && !message && <p>No matching booking records.</p>}</div></section>
      <form className="adminCard" onSubmit={saveSettings}><h2>Social media accounts</h2><p>Paste the full account URL for each platform. Empty accounts stay hidden.</p><label>Business name<input value={settings.businessName} onChange={(e) => setSettings({ ...settings, businessName: e.target.value })} /></label>{(["whatsapp", "facebook", "instagram", "x", "linkedin", "tiktok", "youtube", "snapchat"] as const).map((field) => <label key={field}>{field[0].toUpperCase() + field.slice(1)}<input type="url" placeholder="https://…" value={settings[field]} onChange={(e) => setSettings({ ...settings, [field]: e.target.value })} /></label>)}<button type="submit">Save social accounts</button></form>
    </section>
  </main>;
}
