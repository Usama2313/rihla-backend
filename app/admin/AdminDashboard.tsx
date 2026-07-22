"use client";

import { useEffect, useMemo, useState } from "react";
import "./admin.css";

type Settings = { businessName: string; whatsapp: string; facebook: string; instagram: string; x: string; linkedin: string; tiktok: string; youtube: string; snapchat: string };
type RecordItem = { id: string; type: string; status: string; customerName: string; email?: string; phone?: string; detailsJson: string; createdAt: string };
type TemplateItem = { id?: number; name: string; badge: string; nights: string; hotel: string; price: string; active: boolean | number; sortOrder: number };
type DestinationItem = { id?: number; place: string; country: string; tag: string; days: string; color: string; sortOrder: number };
const emptySettings: Settings = { businessName: "Rihla", whatsapp: "", facebook: "", instagram: "", x: "", linkedin: "", tiktok: "", youtube: "", snapchat: "" };
const emptyTemplate: TemplateItem = { name: "", badge: "Umrah package", nights: "", hotel: "", price: "", active: true, sortOrder: 0 };
const emptyDestination: DestinationItem = { place: "", country: "", tag: "", days: "", color: "blue", sortOrder: 0 };

export default function AdminDashboard({ owner }: { owner: string }) {
  const [activeTab, setActiveTab] = useState<"overview" | "bookings" | "packages" | "destinations" | "settings">("overview");
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
      if (response.status === 401) window.location.reload();
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
    setTemplateDraft(emptyTemplate); await load(); setMessage("Umrah template saved.");
  };
  const saveDestination = async (event: React.FormEvent) => {
    event.preventDefault(); setMessage("Saving Destination...");
    const response = await fetch("/api/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ resource: "destination", ...destinationDraft }) });
    const data = await response.json();
    if (!response.ok) return setMessage(data.error || "Destination could not be saved.");
    setDestinationDraft(emptyDestination); await load(); setMessage("Destination saved.");
  };
  const saveBooking = async (event: React.FormEvent) => {
    event.preventDefault(); if (!bookingDraft) return;
    try { JSON.parse(bookingDraft.detailsJson || "{}"); } catch { return setMessage("Booking details must be valid JSON."); }
    const response = await fetch("/api/admin", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ resource: "booking", ...bookingDraft }) });
    if (!response.ok) return setMessage("Booking could not be saved.");
    setBookingDraft(null); await load(); setMessage("Booking updated.");
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
  const exportBackup = () => {
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), settings, umrahTemplates: templates, bookingRecords: records, destinations }, null, 2)], { type: "application/json" });
    const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `rihla-backup-${new Date().toISOString().slice(0, 10)}.json`; link.click(); URL.revokeObjectURL(link.href);
  };
  const logout = async () => {
    await fetch("/api/admin/login", { method: "DELETE" });
    window.location.reload();
  };

  const filteredRecords = useMemo(() => records.filter((item) => `${item.id} ${item.customerName} ${item.email || ""} ${item.phone || ""} ${item.type} ${item.status}`.toLowerCase().includes(query.toLowerCase())), [records, query]);
  
  // Calculate stats for overview
  const totalBookings = records.length;
  const bookingsThisMonth = records.filter(r => new Date(r.createdAt).getMonth() === new Date().getMonth()).length;
  const pendingCount = records.filter(r => r.status === 'new').length;
  const grossValue = records.length * 1540; // Dummy calculation for display

  return (
    <div className="r1-layout">
      {/* Sidebar */}
      <aside className="r1-sidebar">
        <div className="r1-brand">
          <div className="r1-logo-icon">R1</div>
          <div className="r1-brand-text">RihlaOne</div>
        </div>
        
        <div className="r1-workspace">
          <div className="r1-workspace-avatar">AU</div>
          <div className="r1-workspace-info">
            <strong>AL ULAYA</strong>
            <span>Hajj & Umrah</span>
          </div>
          <span className="r1-workspace-chevron">▼</span>
        </div>

        <div className="r1-nav-section">
          <div className="r1-nav-title">Operations</div>
          <button className={`r1-nav-item ${activeTab === "overview" ? "active" : ""}`} onClick={() => setActiveTab("overview")}><span className="r1-nav-icon">⌂</span> Overview</button>
          <button className={`r1-nav-item ${activeTab === "bookings" ? "active" : ""}`} onClick={() => setActiveTab("bookings")}>
            <span className="r1-nav-icon">▣</span> Bookings <span className="r1-badge-count">12</span>
          </button>
          <button className={`r1-nav-item ${activeTab === "passengers" ? "active" : ""}`} onClick={() => setActiveTab("passengers")}><span className="r1-nav-icon">♟</span> Passengers</button>
          <button className={`r1-nav-item ${activeTab === "visa" ? "active" : ""}`} onClick={() => setActiveTab("visa")}>
            <span className="r1-nav-icon">⬖</span> Visa processing <span className="r1-badge-count" style={{ backgroundColor: '#b26829' }}>7</span>
          </button>
          <button className={`r1-nav-item ${activeTab === "packages" ? "active" : ""}`} onClick={() => setActiveTab("packages")}><span className="r1-nav-icon">≣</span> Package templates</button>
        </div>

        <div className="r1-nav-section">
          <div className="r1-nav-title">Supply</div>
          <button className={`r1-nav-item ${activeTab === "hotel-inventory" ? "active" : ""}`} onClick={() => setActiveTab("hotel-inventory")}><span className="r1-nav-icon">▦</span> Hotel inventory</button>
          <button className={`r1-nav-item ${activeTab === "visa-inventory" ? "active" : ""}`} onClick={() => setActiveTab("visa-inventory")}><span className="r1-nav-icon">⬖</span> Visa inventory</button>
          <button className={`r1-nav-item ${activeTab === "supplier-inventory" ? "active" : ""}`} onClick={() => setActiveTab("supplier-inventory")}><span className="r1-nav-icon">▦</span> Supplier inventory</button>
          <button className={`r1-nav-item ${activeTab === "suppliers" ? "active" : ""}`} onClick={() => setActiveTab("suppliers")}><span className="r1-nav-icon">⋈</span> Suppliers</button>
        </div>

        <div className="r1-nav-section">
          <div className="r1-nav-title">System</div>
          <button className={`r1-nav-item ${activeTab === "integrations" ? "active" : ""}`} onClick={() => setActiveTab("integrations")}><span className="r1-nav-icon">⌘</span> Integrations</button>
        </div>

        <div className="r1-sidebar-footer">
          <div className="r1-progress">
            <span>1448 AH season</span>
            <strong>68% ready</strong>
            <div className="r1-progress-bar"><div className="r1-progress-fill"></div></div>
          </div>
          <button className="r1-nav-item" onClick={logout}><span className="r1-nav-icon">?</span> Help centre</button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="r1-main">
        <header className="r1-topbar">
          <div className="r1-search">
            <span>⌕</span>
            <input type="text" placeholder="Search booking, passport or supplier..." value={query} onChange={(e) => setQuery(e.target.value)} />
            <span className="r1-search-shortcut">⌘K</span>
          </div>
          <div className="r1-top-actions">
            <div className="r1-notification"></div>
            <div className="r1-profile">
              <div className="r1-profile-avatar">{owner.slice(0,2).toUpperCase() || "AD"}</div>
              <div className="r1-profile-info">
                <strong>{owner}</strong>
                <span>Administrator</span>
              </div>
            </div>
          </div>
        </header>

        <div className="r1-content">
          {message && <div className="r1-message">{message}</div>}

          {activeTab === "overview" && (
            <>
              <header className="r1-page-header">
                <div>
                  <div className="r1-page-header-text"><span>MONDAY • 20 JULY 2026</span></div>
                  <h1>Good morning, {owner.split(" ")[0]}</h1>
                  <p>Here is what needs your attention across the Umrah operation.</p>
                </div>
                <div className="r1-page-actions">
                  <button className="r1-btn-secondary" onClick={exportBackup}>↓ Export report</button>
                  <button className="r1-btn-primary" onClick={() => setActiveTab("bookings")}>+ New booking</button>
                </div>
              </header>

              <div className="r1-metrics-grid">
                <div className="r1-metric-card">
                  <div className="r1-metric-header">
                    <span className="r1-metric-title">Active bookings</span>
                    <div className="r1-metric-icon">▣</div>
                  </div>
                  <div className="r1-metric-body">
                    <div className="r1-metric-value">
                      <strong>{totalBookings}</strong>
                      <span className="r1-metric-badge positive">+12.5%</span>
                    </div>
                    <span className="r1-metric-subtitle">versus last month</span>
                  </div>
                </div>

                <div className="r1-metric-card">
                  <div className="r1-metric-header">
                    <span className="r1-metric-title">Travellers this month</span>
                    <div className="r1-metric-icon">♟</div>
                  </div>
                  <div className="r1-metric-body">
                    <div className="r1-metric-value">
                      <strong>{bookingsThisMonth * 2 || 74}</strong>
                      <span className="r1-metric-badge positive">+8.2%</span>
                    </div>
                    <span className="r1-metric-subtitle">across 7 departure groups</span>
                  </div>
                </div>

                <div className="r1-metric-card">
                  <div className="r1-metric-header">
                    <span className="r1-metric-title">Visa cases pending</span>
                    <div className="r1-metric-icon">⬖</div>
                  </div>
                  <div className="r1-metric-body">
                    <div className="r1-metric-value">
                      <strong>{pendingCount}</strong>
                      <span className="r1-metric-badge negative">-3 today</span>
                    </div>
                    <span className="r1-metric-subtitle">7 require review</span>
                  </div>
                </div>

                <div className="r1-metric-card">
                  <div className="r1-metric-header">
                    <span className="r1-metric-title">Gross booking value</span>
                    <div className="r1-metric-icon">ريال</div>
                  </div>
                  <div className="r1-metric-body">
                    <div className="r1-metric-value">
                      <strong>SAR {grossValue.toLocaleString()}</strong>
                      <span className="r1-metric-badge positive">+18.4%</span>
                    </div>
                    <span className="r1-metric-subtitle">confirmed and pending</span>
                  </div>
                </div>
              </div>

              <div className="r1-section-card">
                <div className="r1-section-header">
                  <div>
                    <h2>Action queue</h2>
                    <p>Prioritized operational tasks</p>
                  </div>
                  <a href="#">View all</a>
                </div>
                <div className="r1-list">
                  <div className="r1-list-item">
                    <div className="r1-list-icon">⬖</div>
                    <div className="r1-list-content">
                      <strong>7 visa cases need review</strong>
                      <span>Passport or photo validation</span>
                    </div>
                    <span className="r1-status-badge r1-status-due">DUE TODAY</span>
                  </div>
                  <div className="r1-list-item">
                    <div className="r1-list-icon" style={{ background: '#fdf4e7', color: '#b26829' }}>▦</div>
                    <div className="r1-list-content">
                      <strong>Madinah hotel inventory is low</strong>
                      <span>18 rooms remain for August</span>
                    </div>
                    <span className="r1-status-badge r1-status-review">REVIEW</span>
                  </div>
                  <div className="r1-list-item">
                    <div className="r1-list-icon" style={{ background: '#fef3c7', color: '#b45309' }}>ريال</div>
                    <div className="r1-list-content">
                      <strong>3 agency payments overdue</strong>
                      <span>SAR 28,450 outstanding</span>
                    </div>
                    <span className="r1-status-badge r1-status-followup">FOLLOW UP</span>
                  </div>
                  <div className="r1-list-item">
                    <div className="r1-list-icon" style={{ background: '#fef3c7', color: '#b45309' }}>▣</div>
                    <div className="r1-list-content">
                      <strong>Group RO-24072 incomplete</strong>
                      <span>2 passengers missing documents</span>
                    </div>
                    <span className="r1-status-badge r1-status-open">OPEN</span>
                  </div>
                </div>
              </div>

              <div className="r1-section-card">
                <div className="r1-section-header">
                  <div>
                    <h2>Upcoming departures</h2>
                    <p>Live operational view</p>
                  </div>
                  <a href="#">All bookings →</a>
                </div>
                <table className="r1-table">
                  <thead>
                    <tr>
                      <th>BOOKING</th>
                      <th>AGENCY / PACKAGE</th>
                      <th>TRAVELLERS</th>
                      <th>ARRIVAL</th>
                      <th>TOTAL</th>
                      <th>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>RO-<br/>24071</strong></td>
                      <td>
                        <div className="r1-agency-cell">
                          <div className="r1-agency-avatar" style={{ background: '#d1fae5', color: '#065f46' }}>AS</div>
                          <div className="r1-agency-info">
                            <strong>Al Safwa Travel</strong>
                            <span>Essential Umrah</span>
                          </div>
                        </div>
                      </td>
                      <td>12</td>
                      <td>04 Aug<br/>2026</td>
                      <td><strong>SAR 39,480</strong></td>
                      <td><span className="r1-status-badge r1-status-success">CONFIRMED</span></td>
                    </tr>
                    <tr>
                      <td><strong>RO-<br/>24072</strong></td>
                      <td>
                        <div className="r1-agency-cell">
                          <div className="r1-agency-avatar" style={{ background: '#dcfce7', color: '#166534' }}>BT</div>
                          <div className="r1-agency-info">
                            <strong>Baba Travel<br/>Tourism</strong>
                            <span>Golden Journey</span>
                          </div>
                        </div>
                      </td>
                      <td>8</td>
                      <td>08 Aug<br/>2026</td>
                      <td><strong>SAR 43,840</strong></td>
                      <td><span className="r1-status-badge r1-status-due">DOCUMENTS</span></td>
                    </tr>
                    <tr>
                      <td><strong>RO-<br/>24073</strong></td>
                      <td>
                        <div className="r1-agency-cell">
                          <div className="r1-agency-avatar" style={{ background: '#d1fae5', color: '#065f46' }}>AV</div>
                          <div className="r1-agency-info">
                            <strong>Atlas Voyages</strong>
                          </div>
                        </div>
                      </td>
                      <td>23</td>
                      <td>12 Aug<br/>2026</td>
                      <td><strong>SAR 43,470</strong></td>
                      <td><span className="r1-status-badge r1-status-danger">PAYMENT DUE</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeTab === "bookings" && (
            <div className="r1-section-card">
              <div className="r1-section-header">
                <div>
                  <h2>Booking Records</h2>
                  <p>Manage customer reservations</p>
                </div>
              </div>

              {bookingDraft && (
                <form onSubmit={saveBooking} style={{ marginBottom: 32, padding: 24, border: "1px solid #e5e7eb", borderRadius: 12 }}>
                  <h3>Edit {bookingDraft.id}</h3>
                  <div className="r1-form-grid">
                    <div><label className="r1-form-label">Customer</label><input className="r1-input" required value={bookingDraft.customerName} onChange={(e) => setBookingDraft({ ...bookingDraft, customerName: e.target.value })} /></div>
                    <div><label className="r1-form-label">Type</label><select className="r1-input" value={bookingDraft.type} onChange={(e) => setBookingDraft({ ...bookingDraft, type: e.target.value })}><option>flight</option><option>umrah</option><option>hotel</option></select></div>
                    <div><label className="r1-form-label">Status</label><select className="r1-input" value={bookingDraft.status} onChange={(e) => setBookingDraft({ ...bookingDraft, status: e.target.value })}><option>new</option><option>contacted</option><option>confirmed</option><option>closed</option></select></div>
                  </div>
                  <label className="r1-form-label">Booking details JSON</label>
                  <textarea className="r1-textarea" value={bookingDraft.detailsJson} onChange={(e) => setBookingDraft({ ...bookingDraft, detailsJson: e.target.value })} />
                  <div className="r1-editor-actions">
                    <button type="submit" className="r1-btn-primary">Save booking</button>
                    <button type="button" className="r1-btn-secondary" onClick={() => setBookingDraft(null)}>Cancel</button>
                    <button type="button" className="r1-btn-danger" onClick={() => deleteItem("booking", bookingDraft.id)}>Delete</button>
                  </div>
                </form>
              )}

              <div className="r1-record-list">
                {filteredRecords.map((item) => (
                  <div className="r1-record-card" key={item.id}>
                    <div className="r1-record-info">
                      <strong>{item.customerName}</strong>
                      <span>{item.id} · {item.type} · {new Date(item.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="r1-record-actions">
                      <span className="r1-status-badge r1-status-open">{item.status}</span>
                      <button className="r1-btn-secondary" onClick={() => setBookingDraft({ ...item })}>Edit</button>
                    </div>
                  </div>
                ))}
                {!filteredRecords.length && <p>No bookings found.</p>}
              </div>
            </div>
          )}

          {activeTab === "packages" && (
            <div className="r1-section-card">
              <div className="r1-section-header">
                <div>
                  <h2>Package Templates</h2>
                  <p>Manage Umrah packages shown on the website</p>
                </div>
                <button className="r1-btn-primary" onClick={() => setTemplateDraft(emptyTemplate)}>+ New template</button>
              </div>

              <form onSubmit={saveTemplate} style={{ marginBottom: 32, padding: 24, border: "1px solid #e5e7eb", borderRadius: 12 }}>
                <h3>{templateDraft.id ? `Edit ${templateDraft.name}` : "New Template"}</h3>
                <label className="r1-form-label">Name</label>
                <input className="r1-input" required value={templateDraft.name} onChange={(e) => setTemplateDraft({ ...templateDraft, name: e.target.value })} />
                <div className="r1-form-grid">
                  <div><label className="r1-form-label">Nights</label><input className="r1-input" value={templateDraft.nights} onChange={(e) => setTemplateDraft({ ...templateDraft, nights: e.target.value })} /></div>
                  <div><label className="r1-form-label">Price</label><input className="r1-input" value={templateDraft.price} onChange={(e) => setTemplateDraft({ ...templateDraft, price: e.target.value })} /></div>
                </div>
                <label className="r1-form-label">Hotel</label>
                <textarea className="r1-textarea" value={templateDraft.hotel} onChange={(e) => setTemplateDraft({ ...templateDraft, hotel: e.target.value })} />
                <div className="r1-editor-actions">
                  <button type="submit" className="r1-btn-primary">Save template</button>
                  {templateDraft.id && <button type="button" className="r1-btn-danger" onClick={() => deleteItem("template", templateDraft.id!)}>Delete</button>}
                </div>
              </form>

              <div className="r1-record-list">
                {templates.map((item) => (
                  <div className="r1-record-card" key={item.id}>
                    <div className="r1-record-info">
                      <strong>{item.name}</strong>
                      <span>{item.nights} · {item.price}</span>
                    </div>
                    <button className="r1-btn-secondary" onClick={() => setTemplateDraft({ ...item, active: Boolean(item.active) })}>Edit</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "destinations" && (
            <div className="r1-section-card">
              <div className="r1-section-header">
                <div>
                  <h2>Destinations</h2>
                  <p>Featured locations on the homepage</p>
                </div>
                <button className="r1-btn-primary" onClick={() => setDestinationDraft(emptyDestination)}>+ New destination</button>
              </div>

              <form onSubmit={saveDestination} style={{ marginBottom: 32, padding: 24, border: "1px solid #e5e7eb", borderRadius: 12 }}>
                <h3>{destinationDraft.id ? `Edit ${destinationDraft.place}` : "New Destination"}</h3>
                <div className="r1-form-grid">
                  <div><label className="r1-form-label">Place</label><input className="r1-input" required value={destinationDraft.place} onChange={(e) => setDestinationDraft({ ...destinationDraft, place: e.target.value })} /></div>
                  <div><label className="r1-form-label">Country</label><input className="r1-input" required value={destinationDraft.country} onChange={(e) => setDestinationDraft({ ...destinationDraft, country: e.target.value })} /></div>
                  <div><label className="r1-form-label">Tag</label><input className="r1-input" value={destinationDraft.tag} onChange={(e) => setDestinationDraft({ ...destinationDraft, tag: e.target.value })} /></div>
                  <div><label className="r1-form-label">Duration</label><input className="r1-input" value={destinationDraft.days} onChange={(e) => setDestinationDraft({ ...destinationDraft, days: e.target.value })} /></div>
                </div>
                <div className="r1-editor-actions">
                  <button type="submit" className="r1-btn-primary">Save destination</button>
                  {destinationDraft.id && <button type="button" className="r1-btn-danger" onClick={() => deleteItem("destination", destinationDraft.id!)}>Delete</button>}
                </div>
              </form>

              <div className="r1-record-list">
                {destinations.map((item) => (
                  <div className="r1-record-card" key={item.id}>
                    <div className="r1-record-info">
                      <strong>{item.place}, {item.country}</strong>
                      <span>{item.tag} · {item.days}</span>
                    </div>
                    <button className="r1-btn-secondary" onClick={() => setDestinationDraft({ ...item })}>Edit</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="r1-section-card">
              <div className="r1-section-header">
                <div>
                  <h2>Settings & Integrations</h2>
                  <p>Manage system properties</p>
                </div>
              </div>
              <form onSubmit={saveSettings}>
                <label className="r1-form-label">Business name</label>
                <input className="r1-input" value={settings.businessName} onChange={(e) => setSettings({ ...settings, businessName: e.target.value })} />
                <div className="r1-form-grid">
                  {(["whatsapp", "facebook", "instagram", "x", "linkedin", "tiktok", "youtube", "snapchat"] as const).map((field) => (
                    <div key={field}>
                      <label className="r1-form-label">{field}</label>
                      <input className="r1-input" type="url" placeholder="https://..." value={settings[field]} onChange={(e) => setSettings({ ...settings, [field]: e.target.value })} />
                    </div>
                  ))}
                </div>
                <button type="submit" className="r1-btn-primary">Save settings</button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
