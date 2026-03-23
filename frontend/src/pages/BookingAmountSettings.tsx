/**
 * BookingAmountSettings.tsx — Admin page to manage the platform booking fee
 *
 * How it works:
 *  - Admin sets a flat "Booking Amount" (e.g. ₹499) that users pay when booking a DJ.
 *  - The actual DJ service price is discussed and collected separately by the team.
 *  - This page lets admin view, update, and see history of these settings.
 */

import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "https://eternal-viper-hardly.ngrok-free.app/api";

const api = axios.create({ baseURL: API_BASE });
api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem("adminToken") || localStorage.getItem("token");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// ─── Types ────────────────────────────────────────────────────────────────────

interface BookingAmountConfig {
  id?: number;
  amount: number;           // The flat booking fee (e.g. 499)
  currency: string;         // "INR"
  label: string;            // e.g. "Platform Booking Fee"
  description: string;      // Text shown to users
  isActive: boolean;
  updatedAt?: string;
  updatedBy?: string;
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, color, sub }: { icon: string; label: string; value: string | number; color: string; sub?: string }) {
  return (
    <div style={{ background: "#fff", borderRadius: 16, padding: "20px 22px", border: "1px solid #e5e7eb", flex: 1, minWidth: 160 }}>
      <div style={{ fontSize: 26, marginBottom: 10 }}>{icon}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color, letterSpacing: -0.5, marginBottom: 2 }}>{value}</div>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#6b7280" }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BookingAmountSettings() {
  const [config, setConfig] = useState<BookingAmountConfig>({
    amount: 499,
    currency: "INR",
    label: "Platform Booking Fee",
    description: "Advance booking confirmation fee. DJ service charges to be discussed separately.",
    isActive: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [history, setHistory] = useState<BookingAmountConfig[]>([]);
  const [stats, setStats] = useState({ totalBookings: 0, totalRevenue: 0, avgPerDay: 0 });

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/settings/booking-amount");
      const data = res.data?.data || res.data;
      if (data?.amount !== undefined) setConfig(data);
      if (data?.history) setHistory(data.history);
    } catch (err: any) {
      // If endpoint doesn't exist yet, use defaults silently
      if (err?.response?.status !== 404) console.error("Failed to load config:", err);
    } finally { setLoading(false); }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get("/admin/settings/booking-amount/stats");
      const data = res.data?.data || res.data;
      if (data) setStats(data);
    } catch (_) {}
  }, []);

  useEffect(() => { fetchConfig(); fetchStats(); }, []);

  const handleSave = async () => {
    if (!config.amount || config.amount < 1) { setError("Amount must be at least ₹1"); return; }
    if (!config.label.trim()) { setError("Label is required"); return; }
    setSaving(true); setError(""); setSaved(false);
    try {
      const res = await api.put("/admin/settings/booking-amount", {
        amount: config.amount,
        currency: config.currency,
        label: config.label.trim(),
        description: config.description.trim(),
        isActive: config.isActive,
      });
      const updated = res.data?.data || res.data;
      if (updated?.amount !== undefined) setConfig(updated);
      setSaved(true);
      setEditMode(false);
      setTimeout(() => setSaved(false), 3000);
      fetchStats();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to save. Check backend endpoint PUT /admin/settings/booking-amount");
    } finally { setSaving(false); }
  };

  const inputStyle: React.CSSProperties = { width: "100%", border: "1.5px solid #e5e7eb", borderRadius: 11, padding: "11px 14px", fontSize: 15, outline: "none", boxSizing: "border-box", transition: "border-color 0.2s" };
  const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: "#6b7280", display: "block", marginBottom: 7, textTransform: "uppercase", letterSpacing: 0.6 };

  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: "#111827", minHeight: "100vh", background: "#f9fafb" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 24px" }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <div style={{ width: 44, height: 44, borderRadius: 13, background: "#0cadab", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>💳</div>
            <div>
              <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: -0.5 }}>Booking Amount</h1>
              <p style={{ margin: 0, fontSize: 14, color: "#6b7280" }}>Set the platform fee users pay when booking a DJ</p>
            </div>
          </div>

          {/* Info banner */}
          <div style={{ background: "#f0fafa", border: "1px solid #d0f0ef", borderRadius: 14, padding: "14px 18px", marginTop: 16, display: "flex", gap: 12 }}>
            <div style={{ fontSize: 20, flexShrink: 0 }}>ℹ️</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#0cadab", marginBottom: 4 }}>How this works</div>
              <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.6 }}>
                Users pay this <strong>booking confirmation fee</strong> through the app (e.g. ₹499). The actual DJ service fee is handled separately offline by your team. This keeps the booking process simple for users.
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: 16, marginBottom: 28, flexWrap: "wrap" }}>
          <StatCard icon="💰" label="Current Fee" value={`₹${config.amount}`} color="#0cadab" sub="Charged per booking" />
          <StatCard icon="📦" label="Total Bookings" value={stats.totalBookings} color="#6366f1" sub="All time" />
          <StatCard icon="💵" label="Fee Revenue" value={`₹${stats.totalRevenue.toLocaleString()}`} color="#10b981" sub="Platform earnings" />
          <StatCard icon="📅" label="Avg / Day" value={stats.avgPerDay} color="#f59e0b" sub="Bookings per day" />
        </div>

        {/* Current Config Card */}
        <div style={{ background: "#fff", borderRadius: 18, border: "1px solid #e5e7eb", overflow: "hidden", marginBottom: 24 }}>

          {/* Card Header */}
          <div style={{ padding: "18px 24px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#111827" }}>Current Settings</div>
              {config.updatedAt && <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>Last updated: {new Date(config.updatedAt).toLocaleString("en-IN")}</div>}
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <div style={{ background: config.isActive ? "#f0fdf4" : "#fef2f2", color: config.isActive ? "#16a34a" : "#dc2626", border: `1px solid ${config.isActive ? "#bbf7d0" : "#fecaca"}`, borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 700 }}>
                {config.isActive ? "● Active" : "● Inactive"}
              </div>
              <button onClick={() => setEditMode(!editMode)} style={{ background: editMode ? "#f3f4f6" : "#0cadab", color: editMode ? "#374151" : "#fff", border: "none", borderRadius: 10, padding: "8px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                {editMode ? "Cancel" : "✏️ Edit"}
              </button>
            </div>
          </div>

          <div style={{ padding: 24 }}>
            {loading ? (
              <div style={{ textAlign: "center", padding: "30px 0", color: "#9ca3af" }}>Loading settings...</div>
            ) : editMode ? (
              /* Edit Form */
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

                {/* Amount (most prominent) */}
                <div>
                  <label style={labelStyle}>Booking Fee Amount (₹)</label>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ position: "relative", width: 200 }}>
                      <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 20, fontWeight: 800, color: "#6b7280" }}>₹</span>
                      <input
                        type="number"
                        min={1}
                        value={config.amount}
                        onChange={e => setConfig(c => ({ ...c, amount: parseFloat(e.target.value) || 0 }))}
                        style={{ ...inputStyle, paddingLeft: 34, fontSize: 28, fontWeight: 800, color: "#0cadab", width: "100%", letterSpacing: -1 }}
                      />
                    </div>
                    <div style={{ fontSize: 13, color: "#6b7280" }}>This amount will be shown to users as the booking fee</div>
                  </div>
                  {/* Quick presets */}
                  <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                    <div style={{ fontSize: 12, color: "#9ca3af", marginRight: 4, lineHeight: "28px" }}>Quick set:</div>
                    {[199, 299, 399, 499, 699, 999, 1499].map(amt => (
                      <button key={amt} onClick={() => setConfig(c => ({ ...c, amount: amt }))} style={{ border: `1.5px solid ${config.amount === amt ? "#0cadab" : "#e5e7eb"}`, background: config.amount === amt ? "#f0fafa" : "#fff", color: config.amount === amt ? "#0cadab" : "#374151", borderRadius: 8, padding: "5px 12px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                        ₹{amt}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Label (shown to users)</label>
                  <input value={config.label} onChange={e => setConfig(c => ({ ...c, label: e.target.value }))} placeholder="e.g. Platform Booking Fee" style={inputStyle} />
                </div>

                <div>
                  <label style={labelStyle}>Description (shown to users)</label>
                  <textarea
                    value={config.description}
                    onChange={e => setConfig(c => ({ ...c, description: e.target.value }))}
                    rows={3}
                    placeholder="Explain what this fee covers..."
                    style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit", lineHeight: 1.6 }}
                  />
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <button onClick={() => setConfig(c => ({ ...c, isActive: !c.isActive }))} style={{ width: 44, height: 24, borderRadius: 12, background: config.isActive ? "#0cadab" : "#d1d5db", border: "none", cursor: "pointer", position: "relative", transition: "background 0.2s" }}>
                    <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: config.isActive ? 23 : 3, transition: "left 0.2s" }} />
                  </button>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{config.isActive ? "Fee is Active" : "Fee is Disabled"}</div>
                    <div style={{ fontSize: 12, color: "#9ca3af" }}>{config.isActive ? "Users will be charged this fee" : "No booking fee will be charged"}</div>
                  </div>
                </div>

                {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "#dc2626", fontWeight: 600 }}>⚠ {error}</div>}

                <div style={{ display: "flex", gap: 10, paddingTop: 4 }}>
                  <button onClick={() => setEditMode(false)} style={{ flex: 1, border: "1.5px solid #e5e7eb", background: "#fff", borderRadius: 12, padding: "13px", fontSize: 14, fontWeight: 700, cursor: "pointer", color: "#374151" }}>Cancel</button>
                  <button disabled={saving} onClick={handleSave} style={{ flex: 2, background: saving ? "#9ca3af" : "#0cadab", border: "none", color: "#fff", borderRadius: 12, padding: "13px", fontSize: 15, fontWeight: 800, cursor: saving ? "default" : "pointer" }}>
                    {saving ? "Saving..." : "✓ Save Booking Amount"}
                  </button>
                </div>
              </div>
            ) : (
              /* View Mode */
              <>
                {saved && (
                  <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "12px 16px", fontSize: 14, color: "#16a34a", fontWeight: 700, marginBottom: 20 }}>
                    ✓ Booking amount updated successfully
                  </div>
                )}

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                  {/* Big amount display */}
                  <div style={{ gridColumn: "span 2", background: "linear-gradient(135deg, #0cadab 0%, #0a9998 100%)", borderRadius: 16, padding: "24px 28px", color: "#fff" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, opacity: 0.7, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>{config.label}</div>
                    <div style={{ fontSize: 52, fontWeight: 800, letterSpacing: -2, marginBottom: 6 }}>₹{config.amount}</div>
                    <div style={{ fontSize: 14, opacity: 0.85, lineHeight: 1.5 }}>{config.description}</div>
                    <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
                      <span style={{ background: "rgba(255,255,255,0.2)", borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 700 }}>
                        {config.currency}
                      </span>
                      <span style={{ background: config.isActive ? "rgba(255,255,255,0.2)" : "rgba(239,68,68,0.3)", borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 700 }}>
                        {config.isActive ? "● Active" : "● Inactive"}
                      </span>
                    </div>
                  </div>

                  <div style={{ background: "#f9fafb", borderRadius: 12, padding: "16px 18px" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", marginBottom: 5 }}>WHAT USER PAYS</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: "#111827" }}>₹{config.amount}</div>
                    <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>Booking confirmation fee via app</div>
                  </div>
                  <div style={{ background: "#f9fafb", borderRadius: 12, padding: "16px 18px" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", marginBottom: 5 }}>DJ SERVICE FEE</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: "#374151" }}>Offline</div>
                    <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>Collected separately by team</div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* History */}
        {history.length > 0 && (
          <div style={{ background: "#fff", borderRadius: 18, border: "1px solid #e5e7eb", overflow: "hidden" }}>
            <div style={{ padding: "16px 24px", borderBottom: "1px solid #f3f4f6" }}>
              <div style={{ fontSize: 15, fontWeight: 800 }}>Change History</div>
            </div>
            <div>
              {history.map((h, i) => (
                <div key={i} style={{ padding: "14px 24px", borderBottom: i < history.length - 1 ? "1px solid #f3f4f6" : "none", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "#0cadab" }}>₹{h.amount}</div>
                    <div style={{ fontSize: 12, color: "#9ca3af" }}>{h.label}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    {h.updatedAt && <div style={{ fontSize: 13, color: "#6b7280" }}>{new Date(h.updatedAt).toLocaleDateString("en-IN")}</div>}
                    {h.updatedBy && <div style={{ fontSize: 12, color: "#9ca3af" }}>by {h.updatedBy}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Backend note */}
        <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 14, padding: "16px 20px", marginTop: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#92400e", marginBottom: 6 }}>⚙️ Backend Setup Required</div>
          <div style={{ fontSize: 12, color: "#78350f", lineHeight: 1.7 }}>
            Add these endpoints to your backend:<br />
            <code style={{ background: "#fef3c7", padding: "1px 6px", borderRadius: 4 }}>GET /api/admin/settings/booking-amount</code> — returns current config<br />
            <code style={{ background: "#fef3c7", padding: "1px 6px", borderRadius: 4 }}>PUT /api/admin/settings/booking-amount</code> — updates config (body: amount, label, description, isActive, currency)<br />
            <code style={{ background: "#fef3c7", padding: "1px 6px", borderRadius: 4 }}>GET /api/admin/settings/booking-amount/stats</code> — returns totalBookings, totalRevenue, avgPerDay<br />
            Store config in a <code style={{ background: "#fef3c7", padding: "1px 6px", borderRadius: 4 }}>settings</code> table and use it in the booking creation flow.
          </div>
        </div>
      </div>
    </div>
  );
}