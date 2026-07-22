"use client";

import { useEffect, useMemo, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

type Settings = { businessName: string; whatsapp: string; facebook: string; instagram: string; x: string; linkedin: string; tiktok: string; youtube: string; snapchat: string };
type RecordItem = { id: string; type: string; status: string; customerName: string; email?: string; phone?: string; detailsJson: string; createdAt: string };
type TemplateItem = { id?: number; name: string; badge: string; nights: string; hotel: string; price: string; active: boolean | number; sortOrder: number };
type DestinationItem = { id?: number; place: string; country: string; tag: string; days: string; color: string; sortOrder: number };
const emptySettings: Settings = { businessName: "Rihla", whatsapp: "", facebook: "", instagram: "", x: "", linkedin: "", tiktok: "", youtube: "", snapchat: "" };
const emptyTemplate: TemplateItem = { name: "", badge: "Umrah package", nights: "", hotel: "", price: "", active: true, sortOrder: 0 };
const emptyDestination: DestinationItem = { place: "", country: "", tag: "", days: "", color: "blue", sortOrder: 0 };

export default function AdminDashboard({ owner }: { owner: string }) {
  const [activeTab, setActiveTab] = useState<"overview" | "bookings" | "packages" | "destinations" | "settings">("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const [settings, setSettings] = useState(emptySettings);
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [destinations, setDestinations] = useState<DestinationItem[]>([]);
  const [templateDraft, setTemplateDraft] = useState<TemplateItem>(emptyTemplate);
  const [destinationDraft, setDestinationDraft] = useState<DestinationItem>(emptyDestination);
  const [bookingDraft, setBookingDraft] = useState<RecordItem | null>(null);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("Loading saved data...");

  const load = async () => {
    const response = await fetch("/api/admin", { cache: "no-store" });
    if (!response.ok) {
      if (response.status === 401) {
        window.location.reload();
      }
      const data = await response.json().catch(() => ({}));
      return setMessage(data.error || "Unable to load data.");
    }
    const data = await response.json();
    setSettings({ ...emptySettings, ...data.settings });
    setRecords(data.records || []);
    setTemplates((data.templates || []).map((item: TemplateItem) => ({ ...item, active: Boolean(item.active) })));
    setDestinations(data.destinations || []);
    setMessage("");
  };
  
  useEffect(() => { load(); }, []);

  const saveSettings = async (event: React.FormEvent) => {
    event.preventDefault(); setMessage("Saving social accounts...");
    const response = await fetch("/api/admin", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(settings) });
    setMessage(response.ok ? "Social accounts saved." : "Could not save settings.");
  };
  const saveTemplate = async (event: React.FormEvent) => {
    event.preventDefault(); setMessage("Saving Umrah template...");
    const response = await fetch("/api/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(templateDraft) });
    const data = await response.json();
    if (!response.ok) return setMessage(data.error || "Template could not be saved.");
    setTemplateDraft(emptyTemplate); await load(); setMessage("Umrah template saved and published.");
  };
  const saveDestination = async (event: React.FormEvent) => {
    event.preventDefault(); setMessage("Saving Destination...");
    const response = await fetch("/api/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ resource: "destination", ...destinationDraft }) });
    const data = await response.json();
    if (!response.ok) return setMessage(data.error || "Destination could not be saved.");
    setDestinationDraft(emptyDestination); await load(); setMessage("Destination saved.");
  };
  const deleteItem = async (resource: "template" | "booking" | "destination", id: number | string) => {
    if (!window.confirm(`Delete this ${resource}? This cannot be undone.`)) return;
    const response = await fetch("/api/admin", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ resource, id }) });
    if (!response.ok) return setMessage(`Could not delete ${resource}.`);
    if (resource === "template" && templateDraft.id === id) setTemplateDraft(emptyTemplate);
    if (resource === "destination" && destinationDraft.id === id) setDestinationDraft(emptyDestination);
    if (resource === "booking" && bookingDraft?.id === id) setBookingDraft(null);
    await load(); setMessage(`${resource.charAt(0).toUpperCase() + resource.slice(1)} deleted.`);
  };
  const saveBooking = async (event: React.FormEvent) => {
    event.preventDefault(); if (!bookingDraft) return;
    try { JSON.parse(bookingDraft.detailsJson || "{}"); } catch { return setMessage("Booking details must be valid JSON."); }
    const response = await fetch("/api/admin", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ resource: "booking", ...bookingDraft }) });
    if (!response.ok) return setMessage("Booking could not be saved.");
    setBookingDraft(null); await load(); setMessage("Booking record updated.");
  };
  const exportBackup = () => {
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), settings, umrahTemplates: templates, bookingRecords: records, destinations }, null, 2)], { type: "application/json" });
    const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `rihla-backup-${new Date().toISOString().slice(0, 10)}.json`; link.click(); URL.revokeObjectURL(link.href);
  };
  const logout = async () => {
    await fetch("/api/admin/login", { method: "DELETE" });
    window.location.reload();
  };

  const filteredRecords = useMemo(() => records.filter((item) => `${item.id} ${item.customerName} ${item.email || ""} ${item.phone || ""} ${item.type} ${item.status}`.toLowerCase().includes(query.toLowerCase())), [records, query]);

  const chartData = useMemo(() => {
    const dailyCounts: Record<string, number> = {};
    records.forEach(r => {
      const date = new Date(r.createdAt).toLocaleDateString();
      dailyCounts[date] = (dailyCounts[date] || 0) + 1;
    });
    return Object.entries(dailyCounts).map(([date, count]) => ({ date, count })).reverse();
  }, [records]);

  return (
    <div className="adminLayout">
      <aside className={`adminSidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebarHeader">
          <span className="brandMark">R</span>
          <h2>Rihla Admin</h2>
          <button className="closeSidebar" onClick={() => setSidebarOpen(false)}>×</button>
        </div>
        <nav className="sidebarNav">
          <button className={activeTab === "overview" ? "active" : ""} onClick={() => { setActiveTab("overview"); setSidebarOpen(false); }}>Overview</button>
          <button className={activeTab === "bookings" ? "active" : ""} onClick={() => { setActiveTab("bookings"); setSidebarOpen(false); }}>Bookings</button>
          <button className={activeTab === "packages" ? "active" : ""} onClick={() => { setActiveTab("packages"); setSidebarOpen(false); }}>Packages</button>
          <button className={activeTab === "destinations" ? "active" : ""} onClick={() => { setActiveTab("destinations"); setSidebarOpen(false); }}>Destinations</button>
          <button className={activeTab === "settings" ? "active" : ""} onClick={() => { setActiveTab("settings"); setSidebarOpen(false); }}>Settings</button>
        </nav>
        <div className="sidebarFooter">
          <small>Logged in as {owner}</small>
          <button onClick={logout}>Sign out</button>
        </div>
      </aside>

      <main className="adminMain">
        <header className="mobileHeader">
          <button onClick={() => setSidebarOpen(true)}>☰ Menu</button>
          <h2>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h2>
        </header>

        {message && <div className="adminMessage">{message}</div>}

        {activeTab === "overview" && (
          <div className="adminContent">
            <header className="contentHeader">
              <div>
                <h1>Dashboard Overview</h1>
                <p>Metrics and analytics for your platform</p>
              </div>
              <button onClick={exportBackup}>Export Backup</button>
            </header>
            
            <div className="metricsGrid">
              <div className="metricCard">
                <h3>Total Bookings</h3>
                <strong>{records.length}</strong>
              </div>
              <div className="metricCard">
                <h3>Active Packages</h3>
                <strong>{templates.filter(t => t.active).length}</strong>
              </div>
              <div className="metricCard">
                <h3>Featured Destinations</h3>
                <strong>{destinations.length}</strong>
              </div>
            </div>

            <div className="adminCard chartCard" style={{ marginTop: "24px" }}>
              <h2>Booking Volume</h2>
              <p>Daily booking creation trends</p>
              <div style={{ width: "100%", height: 300, marginTop: "20px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e1ebe6" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6b7e77" }} />
                    <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6b7e77" }} />
                    <Tooltip cursor={{ fill: "#f2f6f3" }} contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }} />
                    <Bar dataKey="count" fill="#17624e" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === "bookings" && (
          <section className="adminCard recordsCard">
            <div className="recordsTitle">
              <div>
                <h2>Editable booking data store</h2>
                <p>{records.length} durable database records</p>
              </div>
              <div className="recordTools">
                <input type="search" placeholder="Search bookings..." value={query} onChange={(e) => setQuery(e.target.value)} />
              </div>
            </div>
            
            {bookingDraft && (
              <form className="bookingRecordEditor" onSubmit={saveBooking}>
                <div className="recordsTitle">
                  <h3>Edit {bookingDraft.id}</h3>
                  <button type="button" onClick={() => setBookingDraft(null)}>Close</button>
                </div>
                <div className="adminFormGrid">
                  <label>Customer<input required value={bookingDraft.customerName} onChange={(e) => setBookingDraft({ ...bookingDraft, customerName: e.target.value })} /></label>
                  <label>Type<select value={bookingDraft.type} onChange={(e) => setBookingDraft({ ...bookingDraft, type: e.target.value })}><option>flight</option><option>umrah</option><option>hotel</option><option>travel</option></select></label>
                  <label>Status<select value={bookingDraft.status} onChange={(e) => setBookingDraft({ ...bookingDraft, status: e.target.value })}><option>new</option><option>contacted</option><option>confirmed</option><option>closed</option></select></label>
                  <label>Email<input type="email" value={bookingDraft.email || ""} onChange={(e) => setBookingDraft({ ...bookingDraft, email: e.target.value })} /></label>
                  <label>Phone<input value={bookingDraft.phone || ""} onChange={(e) => setBookingDraft({ ...bookingDraft, phone: e.target.value })} /></label>
                </div>
                <label>Booking details JSON<textarea rows={8} value={bookingDraft.detailsJson} onChange={(e) => setBookingDraft({ ...bookingDraft, detailsJson: e.target.value })} /></label>
                <div className="adminActions">
                  <button type="submit">Save booking record</button>
                  <button type="button" className="dangerButton" onClick={() => deleteItem("booking", bookingDraft.id)}>Delete booking</button>
                </div>
              </form>
            )}

            <div className="recordList">
              {filteredRecords.map((item) => (
                <article key={item.id}>
                  <div>
                    <strong>{item.customerName}</strong>
                    <small>{item.id} · {item.type} · {new Date(item.createdAt).toLocaleString()}</small>
                    <span>{item.email || item.phone || "No contact"}</span>
                  </div>
                  <span className={`statusBadge status-${item.status}`}>{item.status}</span>
                  <button onClick={() => setBookingDraft({ ...item })}>Edit</button>
                  <button className="dangerLink" onClick={() => deleteItem("booking", item.id)}>Delete</button>
                </article>
              ))}
              {!filteredRecords.length && !message && <p>No matching booking records.</p>}
            </div>
          </section>
        )}

        {activeTab === "packages" && (
          <section className="adminCard templateManager">
            <div className="recordsTitle">
              <div>
                <h2>Umrah package templates</h2>
                <p>Add, edit, publish, unpublish, or delete packages shown on the booking page.</p>
              </div>
              <button type="button" onClick={() => setTemplateDraft(emptyTemplate)}>+ New template</button>
            </div>
            <div className="templateWorkspace">
              <form className="adminEditor" onSubmit={saveTemplate}>
                <h3>{templateDraft.id ? `Edit template #${templateDraft.id}` : "New Umrah template"}</h3>
                <label>Package name<input required value={templateDraft.name} onChange={(e) => setTemplateDraft({ ...templateDraft, name: e.target.value })} /></label>
                <div className="adminFormGrid">
                  <label>Badge<input value={templateDraft.badge} onChange={(e) => setTemplateDraft({ ...templateDraft, badge: e.target.value })} /></label>
                  <label>Nights<input required placeholder="7 nights" value={templateDraft.nights} onChange={(e) => setTemplateDraft({ ...templateDraft, nights: e.target.value })} /></label>
                  <label>Price<input required placeholder="from BHD 329" value={templateDraft.price} onChange={(e) => setTemplateDraft({ ...templateDraft, price: e.target.value })} /></label>
                  <label>Display order<input type="number" value={templateDraft.sortOrder} onChange={(e) => setTemplateDraft({ ...templateDraft, sortOrder: Number(e.target.value) })} /></label>
                </div>
                <label>Hotel and package description<textarea required value={templateDraft.hotel} onChange={(e) => setTemplateDraft({ ...templateDraft, hotel: e.target.value })} /></label>
                <label className="adminCheckbox"><input type="checkbox" checked={Boolean(templateDraft.active)} onChange={(e) => setTemplateDraft({ ...templateDraft, active: e.target.checked })} /> Published on the Umrah booking page</label>
                <div className="adminActions">
                  <button type="submit">Save template</button>
                  {templateDraft.id && <button type="button" className="dangerButton" onClick={() => deleteItem("template", templateDraft.id!)}>Delete template</button>}
                </div>
              </form>
              <div className="templateList">
                {templates.map((item) => (
                  <article key={item.id} className={!item.active ? "inactive" : ""}>
                    <span>{item.badge}</span>
                    <strong>{item.name}</strong>
                    <small>{item.nights} · {item.price}</small>
                    <p>{item.hotel}</p>
                    <div>
                      <button onClick={() => setTemplateDraft({ ...item, active: Boolean(item.active) })}>Edit</button>
                      <button className="dangerLink" onClick={() => deleteItem("template", item.id!)}>Delete</button>
                    </div>
                  </article>
                ))}
                {!templates.length && <p>No Umrah templates saved.</p>}
              </div>
            </div>
          </section>
        )}

        {activeTab === "destinations" && (
          <section className="adminCard templateManager">
            <div className="recordsTitle">
              <div>
                <h2>Featured Destinations</h2>
                <p>Manage the inspirational trips shown on the homepage.</p>
              </div>
              <button type="button" onClick={() => setDestinationDraft(emptyDestination)}>+ New destination</button>
            </div>
            <div className="templateWorkspace">
              <form className="adminEditor" onSubmit={saveDestination}>
                <h3>{destinationDraft.id ? `Edit destination #${destinationDraft.id}` : "New destination"}</h3>
                <label>Place<input required value={destinationDraft.place} onChange={(e) => setDestinationDraft({ ...destinationDraft, place: e.target.value })} /></label>
                <div className="adminFormGrid">
                  <label>Country<input required value={destinationDraft.country} onChange={(e) => setDestinationDraft({ ...destinationDraft, country: e.target.value })} /></label>
                  <label>Tag<input required placeholder="Desert wonder" value={destinationDraft.tag} onChange={(e) => setDestinationDraft({ ...destinationDraft, tag: e.target.value })} /></label>
                  <label>Duration<input required placeholder="4 days" value={destinationDraft.days} onChange={(e) => setDestinationDraft({ ...destinationDraft, days: e.target.value })} /></label>
                  <label>Color Theme<select value={destinationDraft.color} onChange={(e) => setDestinationDraft({ ...destinationDraft, color: e.target.value })}><option value="blue">Blue</option><option value="sunset">Sunset</option><option value="green">Green</option></select></label>
                  <label>Display order<input type="number" value={destinationDraft.sortOrder} onChange={(e) => setDestinationDraft({ ...destinationDraft, sortOrder: Number(e.target.value) })} /></label>
                </div>
                <div className="adminActions">
                  <button type="submit">Save destination</button>
                  {destinationDraft.id && <button type="button" className="dangerButton" onClick={() => deleteItem("destination", destinationDraft.id!)}>Delete destination</button>}
                </div>
              </form>
              <div className="templateList">
                {destinations.map((item) => (
                  <article key={item.id}>
                    <span>{item.tag}</span>
                    <strong>{item.place}</strong>
                    <small>{item.country} · {item.days}</small>
                    <p>Color Theme: {item.color}</p>
                    <div>
                      <button onClick={() => setDestinationDraft({ ...item })}>Edit</button>
                      <button className="dangerLink" onClick={() => deleteItem("destination", item.id!)}>Delete</button>
                    </div>
                  </article>
                ))}
                {!destinations.length && <p>No destinations saved.</p>}
              </div>
            </div>
          </section>
        )}

        {activeTab === "settings" && (
          <div className="adminContent">
            <form className="adminCard" onSubmit={saveSettings}>
              <h2>Social media accounts</h2>
              <p>Paste the full account URL for each platform. Empty accounts stay hidden.</p>
              <label>Business name<input value={settings.businessName} onChange={(e) => setSettings({ ...settings, businessName: e.target.value })} /></label>
              <div className="adminFormGrid">
                {(["whatsapp", "facebook", "instagram", "x", "linkedin", "tiktok", "youtube", "snapchat"] as const).map((field) => (
                  <label key={field}>{field[0].toUpperCase() + field.slice(1)}<input type="url" placeholder="https://..." value={settings[field]} onChange={(e) => setSettings({ ...settings, [field]: e.target.value })} /></label>
                ))}
              </div>
              <button type="submit" style={{ marginTop: "24px" }}>Save social accounts</button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
