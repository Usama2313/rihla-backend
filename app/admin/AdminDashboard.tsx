"use client";

import { useEffect, useMemo, useState } from "react";
import "./admin.css";

type Settings = { businessName: string; whatsapp: string; facebook: string; instagram: string; x: string; linkedin: string; tiktok: string; youtube: string; snapchat: string; adminEmail?: string; adminPassword?: string; adminAvatar?: string };
type RecordItem = { id: string; type: string; status: string; customerName: string; email?: string; phone?: string; detailsJson: string; createdAt: string };
type TemplateItem = { id?: number; name: string; badge: string; nights: string; hotel: string; price: string; active: boolean | number; sortOrder: number };
type DestinationItem = { id?: number; place: string; country: string; tag: string; days: string; color: string; sortOrder: number };
type PassengerItem = { id?: number; booking_id: string; name: string; passport: string; nationality: string; created_at: string };
type VisaAppItem = { id?: number; passenger_id: number; status: string; type: string; submitted_at: string };
type InventoryItem = { id?: number; type: string; name: string; stock: number; details: string };
type SupplierItem = { id?: number; name: string; type: string; balance: string; status: string };
type IntegrationItem = { id?: number; name: string; status: string; api_key: string };

const emptySettings: Settings = { businessName: "Rihla", whatsapp: "", facebook: "", instagram: "", x: "", linkedin: "", tiktok: "", youtube: "", snapchat: "", adminEmail: "mirali200@gmail.com", adminPassword: "password", adminAvatar: "" };
const emptyTemplate: TemplateItem = { name: "", badge: "Umrah package", nights: "", hotel: "", price: "", active: true, sortOrder: 0 };
const emptyDestination: DestinationItem = { place: "", country: "", tag: "", days: "", color: "blue", sortOrder: 0 };
const emptyPassenger: PassengerItem = { booking_id: "", name: "", passport: "", nationality: "", created_at: "" };
const emptyVisaApp: VisaAppItem = { passenger_id: 0, status: "pending", type: "tourist", submitted_at: "" };
const emptyInventory: InventoryItem = { type: "hotel", name: "", stock: 0, details: "" };
const emptySupplier: SupplierItem = { name: "", type: "agency", balance: "0", status: "active" };
const emptyIntegration: IntegrationItem = { name: "", status: "disconnected", api_key: "" };

export default function AdminDashboard({ owner }: { owner: string }) {
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNewBooking, setShowNewBooking] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [settings, setSettings] = useState(emptySettings);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [destinations, setDestinations] = useState<DestinationItem[]>([]);
  const [passengers, setPassengers] = useState<PassengerItem[]>([]);
  const [visaApps, setVisaApps] = useState<VisaAppItem[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierItem[]>([]);
  const [integrations, setIntegrations] = useState<IntegrationItem[]>([]);
  
  const [templateDraft, setTemplateDraft] = useState<TemplateItem>(emptyTemplate);
  const [destinationDraft, setDestinationDraft] = useState<DestinationItem>(emptyDestination);
  const [passengerDraft, setPassengerDraft] = useState<PassengerItem>(emptyPassenger);
  const [visaAppDraft, setVisaAppDraft] = useState<VisaAppItem>(emptyVisaApp);
  const [inventoryDraft, setInventoryDraft] = useState<InventoryItem>(emptyInventory);
  const [supplierDraft, setSupplierDraft] = useState<SupplierItem>(emptySupplier);
  const [integrationDraft, setIntegrationDraft] = useState<IntegrationItem>(emptyIntegration);
  const [bookingDraft, setBookingDraft] = useState<RecordItem | null>(null);
  
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("Loading saved data...");
  const [showProfilePassword, setShowProfilePassword] = useState(false);
  const [toasts, setToasts] = useState<Array<{ id: number; text: string; type: "success" | "error" | "info" }>>([]);

  const addToast = (text: string, type: "success" | "error" | "info" = "info") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  const load = async () => {
    try {
      const response = await fetch("/api/admin", { cache: "no-store" });
      if (!response.ok) {
        if (response.status === 401) window.location.reload();
        const data = await response.json().catch(() => ({}));
        addToast(data.error || "Unable to load data.", "error");
        return;
      }
      const data = await response.json();
      setSettings({ ...emptySettings, ...data.settings });
      setRecords(data.records || []);
      setTemplates((data.templates || []).map((item: TemplateItem) => ({ ...item, active: Boolean(item.active) })));
      setDestinations(data.destinations || []);
      setPassengers(data.passengers || []);
      setVisaApps(data.visaApplications || []);
      setInventory(data.inventory || []);
      setSuppliers(data.suppliers || []);
      setIntegrations(data.integrations || []);
      setMessage("");
    } catch (err: any) {
      addToast(err.message || "Could not retrieve system data.", "error");
    }
  };
  
  useEffect(() => { load(); }, []);

  const saveSettings = async (event: React.FormEvent) => {
    event.preventDefault();
    addToast("Saving social accounts...", "info");
    try {
      const response = await fetch("/api/admin", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(settings) });
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        addToast("Social accounts saved.", "success");
      } else {
        addToast(data.error || "Could not save settings.", "error");
      }
    } catch (err: any) {
      addToast(err.message || "Failed to save settings.", "error");
    }
  };

  const saveTemplate = async (event: React.FormEvent) => {
    event.preventDefault();
    addToast("Saving Umrah template...", "info");
    try {
      const response = await fetch("/api/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(templateDraft) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) return addToast(data.error || "Template could not be saved.", "error");
      setTemplateDraft(emptyTemplate);
      await load();
      addToast("Umrah template saved.", "success");
    } catch (err: any) {
      addToast(err.message || "Failed to save template.", "error");
    }
  };

  const saveGeneric = async (resource: string, payload: any, setter: any, empty: any) => {
    addToast(`Saving ${resource}...`, "info");
    try {
      const response = await fetch("/api/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ resource, ...payload }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) return addToast(data.error || `${resource} could not be saved.`, "error");
      setter(empty);
      await load();
      addToast(`${resource.charAt(0).toUpperCase() + resource.slice(1)} saved.`, "success");
    } catch (err: any) {
      addToast(err.message || `Failed to save ${resource}.`, "error");
    }
  };

  const saveDestination = async (event: React.FormEvent) => { event.preventDefault(); await saveGeneric("destination", destinationDraft, setDestinationDraft, emptyDestination); };
  const savePassenger = async (event: React.FormEvent) => { event.preventDefault(); await saveGeneric("passenger", passengerDraft, setPassengerDraft, emptyPassenger); };
  const saveVisaApp = async (event: React.FormEvent) => { event.preventDefault(); await saveGeneric("visa_application", visaAppDraft, setVisaAppDraft, emptyVisaApp); };
  const saveInventory = async (event: React.FormEvent) => { event.preventDefault(); await saveGeneric("inventory", inventoryDraft, setInventoryDraft, emptyInventory); };
  const saveSupplier = async (event: React.FormEvent) => { event.preventDefault(); await saveGeneric("supplier", supplierDraft, setSupplierDraft, emptySupplier); };
  const saveIntegration = async (event: React.FormEvent) => { event.preventDefault(); await saveGeneric("integration", integrationDraft, setIntegrationDraft, emptyIntegration); };

  const saveBooking = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!bookingDraft) return;
    try { JSON.parse(bookingDraft.detailsJson || "{}"); } catch { return addToast("Booking details must be valid JSON.", "error"); }
    try {
      const response = await fetch("/api/admin", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ resource: "booking", ...bookingDraft }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) return addToast(data.error || "Booking could not be saved.", "error");
      setBookingDraft(null);
      await load();
      addToast("Booking updated.", "success");
    } catch (err: any) {
      addToast(err.message || "Failed to save booking.", "error");
    }
  };

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    addToast("Saving profile...", "info");
    try {
      const response = await fetch("/api/admin", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(settings) });
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        addToast("Profile updated.", "success");
        setShowProfileEdit(false);
        await load();
      } else {
        addToast(data.error || "Could not update profile.", "error");
      }
    } catch (err: any) {
      addToast(err.message || "Failed to save profile.", "error");
    }
  };

  const deleteItem = async (resource: string, id: number | string) => {
    if (!window.confirm(`Delete this ${resource}? This cannot be undone.`)) return;
    try {
      const response = await fetch("/api/admin", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ resource, id }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) return addToast(data.error || `Could not delete ${resource}.`, "error");
      if (resource === "template" && templateDraft.id === id) setTemplateDraft(emptyTemplate);
      if (resource === "destination" && destinationDraft.id === id) setDestinationDraft(emptyDestination);
      if (resource === "passenger" && passengerDraft.id === id) setPassengerDraft(emptyPassenger);
      if (resource === "visa_application" && visaAppDraft.id === id) setVisaAppDraft(emptyVisaApp);
      if (resource === "inventory" && inventoryDraft.id === id) setInventoryDraft(emptyInventory);
      if (resource === "supplier" && supplierDraft.id === id) setSupplierDraft(emptySupplier);
      if (resource === "integration" && integrationDraft.id === id) setIntegrationDraft(emptyIntegration);
      if (resource === "booking" && bookingDraft?.id === id) setBookingDraft(null);
      await load();
      addToast(`${resource.charAt(0).toUpperCase() + resource.slice(1)} deleted.`, "success");
    } catch (err: any) {
      addToast(err.message || `Failed to delete ${resource}.`, "error");
    }
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
  
  // Calculate dynamic metrics for Overview
  const activeBookings = records.filter(r => r.status !== "closed").length;
  const totalTravellers = records.reduce((acc, r) => acc + (JSON.parse(r.detailsJson || "{}").passengers || 1), 0);
  const pendingVisasCount = visaApps.filter(v => v.status === "pending").length;
  const grossValue = records.reduce((acc, r) => {
    const details = JSON.parse(r.detailsJson || "{}");
    const priceStr = details.flight?.price || details.price || "0";
    return acc + Number(String(priceStr).replace(/[^0-9.-]+/g,""));
  }, 0);

  const bookingsThisMonth = records.filter(r => new Date(r.createdAt).getMonth() === new Date().getMonth()).length;
  const pendingCount = records.filter(r => r.status === 'new').length;

  const selectTab = (tab: string) => {
    setActiveTab(tab);
    setShowMobileSidebar(false);
  };

  return (
    <div className="r1-layout">
      {showMobileSidebar && <div className="r1-sidebar-overlay" onClick={() => setShowMobileSidebar(false)}></div>}
      {/* Sidebar */}
      <aside className={`r1-sidebar ${showMobileSidebar ? "show" : ""}`}>
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
          <button className={`r1-nav-item ${activeTab === "overview" ? "active" : ""}`} onClick={() => selectTab("overview")}><span className="r1-nav-icon">⌂</span> Overview</button>
          <button className={`r1-nav-item ${activeTab === "bookings" ? "active" : ""}`} onClick={() => selectTab("bookings")}>
            <span className="r1-nav-icon">▣</span> Bookings <span className="r1-badge-count">12</span>
          </button>
          <button className={`r1-nav-item ${activeTab === "passengers" ? "active" : ""}`} onClick={() => selectTab("passengers")}><span className="r1-nav-icon">♟</span> Passengers</button>
          <button className={`r1-nav-item ${activeTab === "visa" ? "active" : ""}`} onClick={() => selectTab("visa")}>
            <span className="r1-nav-icon">⬖</span> Visa processing <span className="r1-badge-count" style={{ backgroundColor: '#b26829' }}>7</span>
          </button>
          <button className={`r1-nav-item ${activeTab === "packages" ? "active" : ""}`} onClick={() => selectTab("packages")}><span className="r1-nav-icon">≣</span> Package templates</button>
        </div>

        <div className="r1-nav-section">
          <div className="r1-nav-title">Supply</div>
          <button className={`r1-nav-item ${activeTab === "hotel-inventory" ? "active" : ""}`} onClick={() => selectTab("hotel-inventory")}><span className="r1-nav-icon">▦</span> Hotel inventory</button>
          <button className={`r1-nav-item ${activeTab === "visa-inventory" ? "active" : ""}`} onClick={() => selectTab("visa-inventory")}><span className="r1-nav-icon">⬖</span> Visa inventory</button>
          <button className={`r1-nav-item ${activeTab === "supplier-inventory" ? "active" : ""}`} onClick={() => selectTab("supplier-inventory")}><span className="r1-nav-icon">▦</span> Supplier inventory</button>
          <button className={`r1-nav-item ${activeTab === "suppliers" ? "active" : ""}`} onClick={() => selectTab("suppliers")}><span className="r1-nav-icon">⋈</span> Suppliers</button>
        </div>

        <div className="r1-nav-section">
          <div className="r1-nav-title">System</div>
          <button className={`r1-nav-item ${activeTab === "integrations" ? "active" : ""}`} onClick={() => selectTab("integrations")}><span className="r1-nav-icon">⌘</span> Integrations</button>
        </div>

        <div className="r1-sidebar-footer">
          <button className="r1-nav-item" onClick={logout}><span className="r1-nav-icon">?</span> Help centre</button>
        </div>
      </aside>

       {/* Main Container */}
      <div className="r1-main">
        <header className="r1-topbar">
          <button className="r1-mobile-nav-toggle" onClick={() => setShowMobileSidebar(!showMobileSidebar)} aria-label="Toggle Navigation">
            ☰
          </button>
          <div className="r1-search">
            <span>⌕</span>
            <input type="text" placeholder="Search booking, passport or supplier..." value={query} onChange={(e) => setQuery(e.target.value)} />
            <span className="r1-search-shortcut">⌘K</span>
          </div>
          <div className="r1-top-actions">
            <div className="r1-notification"></div>
            <div className="r1-profile" style={{ position: "relative", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }} onClick={() => setShowProfileMenu(!showProfileMenu)}>
              {settings.adminAvatar ? (
                <img src={settings.adminAvatar} alt="Profile" style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }} />
              ) : (
                <div className="r1-profile-avatar">{settings.adminEmail ? settings.adminEmail.slice(0,2).toUpperCase() : "AD"}</div>
              )}
              <div className="r1-profile-info">
                <strong>{settings.adminEmail || owner}</strong>
                <span>Administrator ▼</span>
              </div>
              {showProfileMenu && (
                <div style={{ position: "absolute", top: "100%", right: 0, marginTop: 8, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.1)", zIndex: 100, width: 160, padding: 8 }}>
                  <button className="r1-btn-secondary" style={{ width: "100%", textAlign: "left", marginBottom: 4 }} onClick={() => { setShowProfileEdit(true); setShowProfileMenu(false); }}>Edit Profile</button>
                  <button className="r1-btn-danger" style={{ width: "100%", textAlign: "left" }} onClick={logout}>Sign out</button>
                </div>
              )}
            </div>
          </div>
        </header>

        {showProfileEdit && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ background: "#fff", padding: 24, borderRadius: 12, width: 450, maxWidth: "90%", maxHeight: "90vh", overflowY: "auto" }}>
              <h3>Admin Profile</h3>
              <form onSubmit={saveProfile}>
                <div style={{ display: "flex", flexDirection: "column", gap: 12, margin: "16px 0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    {settings.adminAvatar ? (
                      <img src={settings.adminAvatar} alt="Profile" style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover" }} />
                    ) : (
                      <div className="r1-profile-avatar" style={{ width: 64, height: 64, fontSize: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>{settings.adminEmail ? settings.adminEmail.slice(0,2).toUpperCase() : "AD"}</div>
                    )}
                    <div>
                      <label className="r1-form-label" style={{ marginBottom: 4 }}>Profile Picture</label>
                      <input type="file" accept="image/*" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setSettings({ ...settings, adminAvatar: reader.result as string });
                          };
                          reader.readAsDataURL(file);
                        }
                      }} />
                    </div>
                  </div>
                  <div>
                    <label className="r1-form-label">Email Address</label>
                    <input className="r1-input" required type="email" value={settings.adminEmail || ""} onChange={(e) => setSettings({ ...settings, adminEmail: e.target.value })} />
                  </div>
                  <div>
                    <label className="r1-form-label">Password</label>
                    <div style={{ position: "relative" }}>
                      <input className="r1-input" required type={showProfilePassword ? "text" : "password"} value={settings.adminPassword || ""} onChange={(e) => setSettings({ ...settings, adminPassword: e.target.value })} style={{ paddingRight: "40px", marginBottom: 0 }} />
                      <button
                        type="button"
                        onClick={() => setShowProfilePassword(!showProfilePassword)}
                        style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#6b7280", display: "flex", alignItems: "center", justifyContent: "center" }}
                        title={showProfilePassword ? "Hide password" : "Show password"}
                      >
                        {showProfilePassword ? (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        ) : (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                        )}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="r1-form-label">Role</label>
                    <input className="r1-input" disabled value="Administrator" />
                  </div>
                </div>
                <div className="r1-editor-actions">
                  <button type="submit" className="r1-btn-primary">Save Profile</button>
                  <button type="button" className="r1-btn-secondary" onClick={() => setShowProfileEdit(false)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showNewBooking && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ background: "#fff", padding: 24, borderRadius: 12, width: 500, maxWidth: "90%" }}>
              <h3>+ New Booking Entry</h3>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const customerName = (form.elements.namedItem("custName") as HTMLInputElement).value;
                const email = (form.elements.namedItem("email") as HTMLInputElement).value;
                const phone = (form.elements.namedItem("phone") as HTMLInputElement).value;
                const type = (form.elements.namedItem("type") as HTMLSelectElement).value;
                const ref = `MAN-${Date.now().toString().slice(-6)}`;
                try {
                  const response = await fetch("/api/records", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type, reference: ref, customerName, email, phone, details: { manual: true } }) });
                  const data = await response.json().catch(() => ({}));
                  if (!response.ok) {
                    addToast(data.error || "Could not create manual booking.", "error");
                    return;
                  }
                  setShowNewBooking(false);
                  await load();
                  addToast("Manual booking created successfully!", "success");
                } catch (err: any) {
                  addToast(err.message || "Failed to create manual booking.", "error");
                }
              }}>
                <div className="r1-form-grid" style={{ gridTemplateColumns: "1fr", gap: 12, margin: "16px 0" }}>
                  <div><label className="r1-form-label">Customer Name</label><input name="custName" className="r1-input" required placeholder="Full Name" /></div>
                  <div><label className="r1-form-label">Email Address</label><input name="email" type="email" className="r1-input" placeholder="email@example.com" /></div>
                  <div><label className="r1-form-label">Phone Number</label><input name="phone" className="r1-input" placeholder="+966 ..." /></div>
                  <div><label className="r1-form-label">Booking Type</label><select name="type" className="r1-input"><option value="umrah">Umrah</option><option value="flight">Flight</option><option value="hotel">Hotel</option></select></div>
                </div>
                <div className="r1-editor-actions">
                  <button type="submit" className="r1-btn-primary">Create Booking</button>
                  <button type="button" className="r1-btn-secondary" onClick={() => setShowNewBooking(false)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

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
                  <button className="r1-btn-primary" onClick={() => setShowNewBooking(true)}>+ New booking</button>
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
                      <strong>{activeBookings}</strong>
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
                    {records.slice(0, 5).map((r) => {
                      const details = JSON.parse(r.detailsJson || "{}");
                      return (
                        <tr key={r.id}>
                          <td><strong>{r.id}</strong></td>
                          <td>
                            <div className="r1-agency-cell">
                              <div className="r1-agency-avatar" style={{ background: '#d1fae5', color: '#065f46' }}>{r.customerName.slice(0,2).toUpperCase()}</div>
                              <div className="r1-agency-info">
                                <strong>{r.customerName}</strong>
                                <span>{r.type.toUpperCase()} Booking</span>
                              </div>
                            </div>
                          </td>
                          <td>{details.passengers || 1}</td>
                          <td>{new Date(r.createdAt).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                          <td><strong>{details.flight?.price || details.price || "SAR 3,500"}</strong></td>
                          <td><span className={`r1-status-badge ${r.status === 'confirmed' ? 'r1-status-success' : 'r1-status-due'}`}>{r.status.toUpperCase()}</span></td>
                        </tr>
                      );
                    })}
                    {!records.length && (
                      <tr>
                        <td colSpan={6} style={{ textAlign: "center", color: "#6b7280" }}>No upcoming departure records available.</td>
                      </tr>
                    )}
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
          {activeTab === "passengers" && (
            <div className="r1-section-card">
              <div className="r1-section-header">
                <div>
                  <h2>Passenger Profiles</h2>
                  <p>Manage traveller passport and personal records</p>
                </div>
                <button className="r1-btn-primary" onClick={() => setPassengerDraft(emptyPassenger)}>+ New passenger</button>
              </div>
              <form onSubmit={savePassenger} style={{ marginBottom: 24, padding: 20, border: "1px solid #e5e7eb", borderRadius: 8 }}>
                <h3>{passengerDraft.id ? "Edit Passenger" : "Add Passenger"}</h3>
                <div className="r1-form-grid">
                  <div><label className="r1-form-label">Booking Reference</label><input className="r1-input" required value={passengerDraft.booking_id} onChange={(e) => setPassengerDraft({ ...passengerDraft, booking_id: e.target.value })} /></div>
                  <div><label className="r1-form-label">Full Name</label><input className="r1-input" required value={passengerDraft.name} onChange={(e) => setPassengerDraft({ ...passengerDraft, name: e.target.value })} /></div>
                  <div><label className="r1-form-label">Passport No.</label><input className="r1-input" required value={passengerDraft.passport} onChange={(e) => setPassengerDraft({ ...passengerDraft, passport: e.target.value })} /></div>
                  <div><label className="r1-form-label">Nationality</label><input className="r1-input" required value={passengerDraft.nationality} onChange={(e) => setPassengerDraft({ ...passengerDraft, nationality: e.target.value })} /></div>
                </div>
                <div className="r1-editor-actions">
                  <button type="submit" className="r1-btn-primary">Save Passenger</button>
                  {passengerDraft.id && <button type="button" className="r1-btn-danger" onClick={() => deleteItem("passenger", passengerDraft.id!)}>Delete</button>}
                </div>
              </form>
              <table className="r1-table">
                <thead><tr><th>NAME</th><th>BOOKING</th><th>PASSPORT</th><th>NATIONALITY</th><th>ACTIONS</th></tr></thead>
                <tbody>
                  {passengers.map((p) => (
                    <tr key={p.id}>
                      <td><strong>{p.name}</strong></td>
                      <td>{p.booking_id}</td>
                      <td>{p.passport}</td>
                      <td>{p.nationality}</td>
                      <td><button className="r1-btn-secondary" onClick={() => setPassengerDraft(p)}>Edit</button></td>
                    </tr>
                  ))}
                  {!passengers.length && <tr><td colSpan={5} style={{ textAlign: "center" }}>No passengers recorded.</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "visa" && (
            <div className="r1-section-card">
              <div className="r1-section-header">
                <div>
                  <h2>Visa Processing</h2>
                  <p>Track Saudi Umrah and Tourist visa applications</p>
                </div>
                <button className="r1-btn-primary" onClick={() => setVisaAppDraft(emptyVisaApp)}>+ New Visa Case</button>
              </div>
              <form onSubmit={saveVisaApp} style={{ marginBottom: 24, padding: 20, border: "1px solid #e5e7eb", borderRadius: 8 }}>
                <h3>{visaAppDraft.id ? "Edit Visa Case" : "New Visa Case"}</h3>
                <div className="r1-form-grid">
                  <div><label className="r1-form-label">Passenger ID</label><input type="number" className="r1-input" required value={visaAppDraft.passenger_id} onChange={(e) => setVisaAppDraft({ ...visaAppDraft, passenger_id: Number(e.target.value) })} /></div>
                  <div><label className="r1-form-label">Visa Type</label><select className="r1-input" value={visaAppDraft.type} onChange={(e) => setVisaAppDraft({ ...visaAppDraft, type: e.target.value })}><option value="umrah">Umrah Visa</option><option value="tourist">Tourist Visa</option></select></div>
                  <div><label className="r1-form-label">Status</label><select className="r1-input" value={visaAppDraft.status} onChange={(e) => setVisaAppDraft({ ...visaAppDraft, status: e.target.value })}><option value="pending">Pending Review</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select></div>
                </div>
                <div className="r1-editor-actions">
                  <button type="submit" className="r1-btn-primary">Save Visa Case</button>
                  {visaAppDraft.id && <button type="button" className="r1-btn-danger" onClick={() => deleteItem("visa_application", visaAppDraft.id!)}>Delete</button>}
                </div>
              </form>
              <table className="r1-table">
                <thead><tr><th>ID</th><th>PASSENGER ID</th><th>TYPE</th><th>STATUS</th><th>SUBMITTED</th><th>ACTIONS</th></tr></thead>
                <tbody>
                  {visaApps.map((v) => (
                    <tr key={v.id}>
                      <td><strong>#VS-{v.id}</strong></td>
                      <td>Passenger #{v.passenger_id}</td>
                      <td>{v.type.toUpperCase()}</td>
                      <td><span className={`r1-status-badge ${v.status === 'approved' ? 'r1-status-success' : 'r1-status-due'}`}>{v.status.toUpperCase()}</span></td>
                      <td>{new Date(v.submitted_at).toLocaleDateString()}</td>
                      <td><button className="r1-btn-secondary" onClick={() => setVisaAppDraft(v)}>Edit</button></td>
                    </tr>
                  ))}
                  {!visaApps.length && <tr><td colSpan={6} style={{ textAlign: "center" }}>No visa applications found.</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {(activeTab === "hotel-inventory" || activeTab === "visa-inventory" || activeTab === "supplier-inventory") && (
            <div className="r1-section-card">
              <div className="r1-section-header">
                <div>
                  <h2>{activeTab.replace("-", " ").toUpperCase()}</h2>
                  <p>Manage stock, rooms, and quota limits</p>
                </div>
                <button className="r1-btn-primary" onClick={() => setInventoryDraft({ ...emptyInventory, type: activeTab.split("-")[0] })}>+ Add Stock Item</button>
              </div>
              <form onSubmit={saveInventory} style={{ marginBottom: 24, padding: 20, border: "1px solid #e5e7eb", borderRadius: 8 }}>
                <h3>{inventoryDraft.id ? "Edit Stock Item" : "Add Stock Item"}</h3>
                <div className="r1-form-grid">
                  <div><label className="r1-form-label">Resource Name</label><input className="r1-input" required value={inventoryDraft.name} onChange={(e) => setInventoryDraft({ ...inventoryDraft, name: e.target.value })} /></div>
                  <div><label className="r1-form-label">Available Stock / Units</label><input type="number" className="r1-input" required value={inventoryDraft.stock} onChange={(e) => setInventoryDraft({ ...inventoryDraft, stock: Number(e.target.value) })} /></div>
                  <div><label className="r1-form-label">Details / Notes</label><input className="r1-input" value={inventoryDraft.details} onChange={(e) => setInventoryDraft({ ...inventoryDraft, details: e.target.value })} /></div>
                </div>
                <div className="r1-editor-actions">
                  <button type="submit" className="r1-btn-primary">Save Item</button>
                  {inventoryDraft.id && <button type="button" className="r1-btn-danger" onClick={() => deleteItem("inventory", inventoryDraft.id!)}>Delete</button>}
                </div>
              </form>
              <table className="r1-table">
                <thead><tr><th>NAME</th><th>TYPE</th><th>STOCK UNITS</th><th>DETAILS</th><th>ACTIONS</th></tr></thead>
                <tbody>
                  {inventory.filter(i => i.type === activeTab.split("-")[0]).map((i) => (
                    <tr key={i.id}>
                      <td><strong>{i.name}</strong></td>
                      <td>{i.type.toUpperCase()}</td>
                      <td>{i.stock} units</td>
                      <td>{i.details}</td>
                      <td><button className="r1-btn-secondary" onClick={() => setInventoryDraft(i)}>Edit</button></td>
                    </tr>
                  ))}
                  {!inventory.filter(i => i.type === activeTab.split("-")[0]).length && <tr><td colSpan={5} style={{ textAlign: "center" }}>No inventory records for this section.</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "suppliers" && (
            <div className="r1-section-card">
              <div className="r1-section-header">
                <div>
                  <h2>Suppliers & Agencies</h2>
                  <p>Manage external contracts and accounts</p>
                </div>
                <button className="r1-btn-primary" onClick={() => setSupplierDraft(emptySupplier)}>+ Add Supplier</button>
              </div>
              <form onSubmit={saveSupplier} style={{ marginBottom: 24, padding: 20, border: "1px solid #e5e7eb", borderRadius: 8 }}>
                <h3>{supplierDraft.id ? "Edit Supplier" : "Add Supplier"}</h3>
                <div className="r1-form-grid">
                  <div><label className="r1-form-label">Supplier Name</label><input className="r1-input" required value={supplierDraft.name} onChange={(e) => setSupplierDraft({ ...supplierDraft, name: e.target.value })} /></div>
                  <div><label className="r1-form-label">Category</label><input className="r1-input" required value={supplierDraft.type} onChange={(e) => setSupplierDraft({ ...supplierDraft, type: e.target.value })} /></div>
                  <div><label className="r1-form-label">Outstanding Balance</label><input className="r1-input" value={supplierDraft.balance} onChange={(e) => setSupplierDraft({ ...supplierDraft, balance: e.target.value })} /></div>
                  <div><label className="r1-form-label">Status</label><select className="r1-input" value={supplierDraft.status} onChange={(e) => setSupplierDraft({ ...supplierDraft, status: e.target.value })}><option value="active">Active</option><option value="suspended">Suspended</option></select></div>
                </div>
                <div className="r1-editor-actions">
                  <button type="submit" className="r1-btn-primary">Save Supplier</button>
                  {supplierDraft.id && <button type="button" className="r1-btn-danger" onClick={() => deleteItem("supplier", supplierDraft.id!)}>Delete</button>}
                </div>
              </form>
              <table className="r1-table">
                <thead><tr><th>NAME</th><th>TYPE</th><th>BALANCE</th><th>STATUS</th><th>ACTIONS</th></tr></thead>
                <tbody>
                  {suppliers.map((s) => (
                    <tr key={s.id}>
                      <td><strong>{s.name}</strong></td>
                      <td>{s.type}</td>
                      <td>{s.balance}</td>
                      <td><span className={`r1-status-badge ${s.status === 'active' ? 'r1-status-success' : 'r1-status-danger'}`}>{s.status.toUpperCase()}</span></td>
                      <td><button className="r1-btn-secondary" onClick={() => setSupplierDraft(s)}>Edit</button></td>
                    </tr>
                  ))}
                  {!suppliers.length && <tr><td colSpan={5} style={{ textAlign: "center" }}>No suppliers found.</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "integrations" && (
            <div className="r1-section-card">
              <div className="r1-section-header">
                <div>
                  <h2>System Integrations</h2>
                  <p>Manage XML Suppliers, Flight APIs and Gateways</p>
                </div>
                <button className="r1-btn-primary" onClick={() => setIntegrationDraft(emptyIntegration)}>+ Add Integration</button>
              </div>
              <form onSubmit={saveIntegration} style={{ marginBottom: 24, padding: 20, border: "1px solid #e5e7eb", borderRadius: 8 }}>
                <h3>{integrationDraft.id ? "Edit Integration" : "Add Integration"}</h3>
                <div className="r1-form-grid">
                  <div><label className="r1-form-label">Integration Name</label><input className="r1-input" required value={integrationDraft.name} onChange={(e) => setIntegrationDraft({ ...integrationDraft, name: e.target.value })} /></div>
                  <div><label className="r1-form-label">API Key / Credentials</label><input className="r1-input" value={integrationDraft.api_key} onChange={(e) => setIntegrationDraft({ ...integrationDraft, api_key: e.target.value })} /></div>
                  <div><label className="r1-form-label">Status</label><select className="r1-input" value={integrationDraft.status} onChange={(e) => setIntegrationDraft({ ...integrationDraft, status: e.target.value })}><option value="connected">Connected</option><option value="disconnected">Disconnected</option></select></div>
                </div>
                <div className="r1-editor-actions">
                  <button type="submit" className="r1-btn-primary">Save Integration</button>
                  {integrationDraft.id && <button type="button" className="r1-btn-danger" onClick={() => deleteItem("integration", integrationDraft.id!)}>Delete</button>}
                </div>
              </form>
              <table className="r1-table">
                <thead><tr><th>NAME</th><th>API KEY</th><th>STATUS</th><th>ACTIONS</th></tr></thead>
                <tbody>
                  {integrations.map((ig) => (
                    <tr key={ig.id}>
                      <td><strong>{ig.name}</strong></td>
                      <td>{ig.api_key ? "••••••••" + ig.api_key.slice(-4) : "None"}</td>
                      <td><span className={`r1-status-badge ${ig.status === 'connected' ? 'r1-status-success' : 'r1-status-due'}`}>{ig.status.toUpperCase()}</span></td>
                      <td><button className="r1-btn-secondary" onClick={() => setIntegrationDraft(ig)}>Edit</button></td>
                    </tr>
                  ))}
                  {!integrations.length && <tr><td colSpan={4} style={{ textAlign: "center" }}>No external integrations configured.</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      {toasts.length > 0 && (
        <div className="r1-toast-container">
          {toasts.map((toast) => (
            <div key={toast.id} className={`r1-toast r1-toast-${toast.type}`}>
              <span>{toast.text}</span>
              <button
                type="button"
                className="r1-toast-close"
                onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
