/**
 * BookingsManagement.tsx — Admin panel page for managing all DJ bookings
 */

import React, { useEffect, useState, useCallback } from "react";
import { api } from "../utils/api";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Booking {
  id: number;
  status: string;
  eventType: string;
  eventDate: string;
  duration: number;
  basePrice: number;
  totalAmount: number;
  specialRequests?: string;
  eventCity?: string;
  eventState?: string;
  createdAt: string;
  user?: { id: number; firstName: string; lastName: string; email: string; phone?: string };
  dj?: { id: number; name: string; hourlyRate: number };
  rating?: number;
}

const STATUS_OPTIONS = ["All", "Pending", "Confirmed", "In Progress", "Completed", "Cancelled"];

const STATUS_COLORS: Record<string, string> = {
  Pending:       "#f59e0b",
  Confirmed:     "#3b82f6",
  "In Progress": "#8b5cf6",
  Completed:     "#10b981",
  Cancelled:     "#ef4444",
};

// ─── Components ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLORS[status] || "#6b7280";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: color + "18", color, border: `1px solid ${color}40`,
      borderRadius: 20, padding: "3px 10px", fontSize: 12, fontWeight: 700,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: 3, background: color, display: "inline-block" }} />
      {status}
    </span>
  );
}

function BookingDetailModal({ booking, onClose, onStatusChange }: {
  booking: Booking;
  onClose: () => void;
  onStatusChange: (id: number, status: string) => void;
}) {
  const [updating, setUpdating] = useState(false);

  const updateStatus = async (status: string) => {
    setUpdating(true);
    await onStatusChange(booking.id, status);
    setUpdating(false);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex",
      alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20,
    }}>
      <div style={{
        background: "#fff", borderRadius: 16, width: "100%", maxWidth: 580,
        maxHeight: "90vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
      }}>
        {/* Header */}
        <div style={{ padding: "24px 28px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#111827" }}>Booking #{booking.id}</h2>
            <div style={{ marginTop: 4 }}><StatusBadge status={booking.status} /></div>
          </div>
          <button onClick={onClose} style={{ border: "none", background: "#f3f4f6", borderRadius: 8, padding: "8px 12px", cursor: "pointer", fontSize: 16 }}>✕</button>
        </div>

        <div style={{ padding: 28 }}>
          {/* Event Info */}
          <section style={{ marginBottom: 24 }}>
            <h3 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: 1 }}>Event Details</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[
                ["Event Type", booking.eventType || "—"],
                ["Date", booking.eventDate ? new Date(booking.eventDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"],
                ["Duration", `${booking.duration || 1} day(s)`],
                ["Location", [booking.eventCity, booking.eventState].filter(Boolean).join(", ") || "—"],
                ["Base Price", `₹${(booking.basePrice || 0).toLocaleString()}`],
                ["Total Amount", `₹${(booking.totalAmount || 0).toLocaleString()}`],
              ].map(([label, value]) => (
                <div key={label} style={{ background: "#f9fafb", borderRadius: 10, padding: "12px 14px" }}>
                  <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600, marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{value}</div>
                </div>
              ))}
            </div>
            {booking.specialRequests && (
              <div style={{ marginTop: 12, background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: "12px 14px" }}>
                <div style={{ fontSize: 11, color: "#92400e", fontWeight: 600, marginBottom: 4 }}>Special Requests</div>
                <div style={{ fontSize: 13, color: "#78350f" }}>{booking.specialRequests}</div>
              </div>
            )}
          </section>

          {/* User Info */}
          {booking.user && (
            <section style={{ marginBottom: 24 }}>
              <h3 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: 1 }}>Customer</h3>
              <div style={{ display: "flex", alignItems: "center", gap: 14, background: "#f9fafb", borderRadius: 12, padding: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: 14, background: "#0cadab", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 16, flexShrink: 0 }}>
                  {booking.user.firstName?.[0] || "U"}
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>{booking.user.firstName} {booking.user.lastName}</div>
                  <div style={{ fontSize: 13, color: "#6b7280" }}>{booking.user.email}</div>
                  {booking.user.phone && <div style={{ fontSize: 12, color: "#9ca3af" }}>{booking.user.phone}</div>}
                </div>
              </div>
            </section>
          )}

          {/* DJ Info */}
          {booking.dj && (
            <section style={{ marginBottom: 24 }}>
              <h3 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: 1 }}>DJ</h3>
              <div style={{ display: "flex", alignItems: "center", gap: 14, background: "#f9fafb", borderRadius: 12, padding: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: 14, background: "#101720", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 16, flexShrink: 0 }}>
                  {booking.dj.name?.[0] || "D"}
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>{booking.dj.name}</div>
                  <div style={{ fontSize: 13, color: "#6b7280" }}>₹{booking.dj.hourlyRate?.toLocaleString() || 0}/hr</div>
                  {booking.rating && <div style={{ fontSize: 12, color: "#f59e0b" }}>★ {booking.rating} rating given</div>}
                </div>
              </div>
            </section>
          )}

          {/* Status Actions */}
          <section>
            <h3 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: 1 }}>Update Status</h3>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {["Confirmed", "In Progress", "Completed", "Cancelled"].map((s) => {
                const isActive = booking.status === s;
                return (
                  <button
                    key={s}
                    disabled={isActive || updating}
                    onClick={() => updateStatus(s)}
                    style={{
                      border: `1.5px solid ${isActive ? STATUS_COLORS[s] : "#e5e7eb"}`,
                      background: isActive ? STATUS_COLORS[s] + "18" : "#fff",
                      color: isActive ? STATUS_COLORS[s] : "#374151",
                      borderRadius: 10, padding: "8px 16px", fontSize: 13, fontWeight: 700,
                      cursor: isActive ? "default" : "pointer",
                      opacity: updating ? 0.6 : 1,
                    }}>
                    {isActive ? "✓ " : ""}{s}
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BookingsManagement() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const PAGE_SIZE = 15;

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
      if (selectedStatus !== "All") params.set("status", selectedStatus);
      if (search) params.set("search", search);

      const res = await api.getBookings("?" + params.toString());

      if (res.success) {
        const data = res.data;
        const list = Array.isArray(data?.bookings ?? data) ? (data?.bookings ?? data) : [];
        setBookings(list);
        setTotal(data?.total ?? list.length);
      }
    } catch (err) {
      console.error("Failed to load bookings:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedStatus, search, page]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const updateStatus = async (id: number, status: string) => {
    const res = await api.updateBookingStatus(id, status);
    if (res.success) {
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
      if (selectedBooking?.id === id)
        setSelectedBooking(prev => prev ? { ...prev, status } : null);
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;

  const stats = {
    all: total || bookings.length,
    pending: bookings.filter(b => b.status === "Pending").length,
    confirmed: bookings.filter(b => b.status === "Confirmed" || b.status === "In Progress").length,
    completed: bookings.filter(b => b.status === "Completed").length,
    revenue: bookings.filter(b => b.status !== "Cancelled").reduce((a, b) => a + (b.totalAmount || 0), 0),
  };

  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: "#111827", minHeight: "100vh", background: "#f9fafb" }}>
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "28px 24px" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: "#111827", letterSpacing: -0.5 }}>Bookings Management</h1>
            <p style={{ margin: "6px 0 0", fontSize: 14, color: "#6b7280" }}>View and manage all DJ bookings</p>
          </div>
          <button onClick={fetchBookings} style={{ background: "#111827", color: "#fff", border: "none", borderRadius: 10, padding: "10px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            ↻ Refresh
          </button>
        </div>

        {/* Stats Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16, marginBottom: 28 }}>
          {[
            { label: "Total Bookings", value: stats.all, color: "#6366f1", icon: "📋" },
            { label: "Pending",        value: stats.pending, color: "#f59e0b", icon: "⏳" },
            { label: "Active",         value: stats.confirmed, color: "#3b82f6", icon: "🎵" },
            { label: "Completed",      value: stats.completed, color: "#10b981", icon: "✅" },
            { label: "Revenue",        value: `₹${stats.revenue.toLocaleString()}`, color: "#0cadab", icon: "💰" },
          ].map((s) => (
            <div key={s.label} style={{ background: "#fff", borderRadius: 14, padding: "18px 20px", border: "1px solid #e5e7eb" }}>
              <div style={{ fontSize: 22, marginBottom: 8 }}>{s.icon}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: s.color, letterSpacing: -0.5 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 600, marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ background: "#fff", borderRadius: 14, padding: "16px 20px", border: "1px solid #e5e7eb", marginBottom: 20, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by user, DJ, city..."
            style={{ flex: 1, minWidth: 200, border: "1.5px solid #e5e7eb", borderRadius: 10, padding: "10px 14px", fontSize: 14, outline: "none" }}
          />
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {STATUS_OPTIONS.map(s => (
              <button
                key={s}
                onClick={() => { setSelectedStatus(s); setPage(1); }}
                style={{
                  border: "1.5px solid",
                  borderColor: selectedStatus === s ? "#0cadab" : "#e5e7eb",
                  background: selectedStatus === s ? "#0cadab" : "#fff",
                  color: selectedStatus === s ? "#fff" : "#374151",
                  borderRadius: 20, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer",
                }}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", overflow: "hidden" }}>
          {loading ? (
            <div style={{ padding: 60, textAlign: "center", color: "#9ca3af" }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Loading bookings...</div>
            </div>
          ) : bookings.length === 0 ? (
            <div style={{ padding: 60, textAlign: "center", color: "#9ca3af" }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📭</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>No bookings found</div>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #f3f4f6" }}>
                    {["ID", "Customer", "DJ", "Event Date", "Amount", "Status", "Created", "Actions"].map(h => (
                      <th key={h} style={{ padding: "14px 16px", textAlign: "left", fontSize: 11, fontWeight: 800, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.8, whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b, i) => (
                    <tr key={b.id} style={{ borderBottom: "1px solid #f3f4f6", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                      <td style={{ padding: "14px 16px", fontSize: 13, fontWeight: 700, color: "#0cadab" }}>#{b.id}</td>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>
                          {b.user ? `${b.user.firstName} ${b.user.lastName}` : "—"}
                        </div>
                        <div style={{ fontSize: 11, color: "#9ca3af" }}>{b.user?.email || ""}</div>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{b.dj?.name || "—"}</div>
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: 13, color: "#374151", whiteSpace: "nowrap" }}>
                        {b.eventDate ? new Date(b.eventDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                        <div style={{ fontSize: 11, color: "#9ca3af" }}>{b.eventType || ""}</div>
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: 14, fontWeight: 800, color: "#111827", whiteSpace: "nowrap" }}>
                        ₹{(b.totalAmount || 0).toLocaleString()}
                      </td>
                      <td style={{ padding: "14px 16px" }}><StatusBadge status={b.status} /></td>
                      <td style={{ padding: "14px 16px", fontSize: 12, color: "#9ca3af", whiteSpace: "nowrap" }}>
                        {new Date(b.createdAt).toLocaleDateString("en-IN")}
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            onClick={() => setSelectedBooking(b)}
                            style={{ border: "1.5px solid #e5e7eb", background: "#fff", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer", color: "#374151" }}>
                            View
                          </button>
                          {b.status === "Pending" && (
                            <button
                              onClick={() => updateStatus(b.id, "Confirmed")}
                              style={{ border: "none", background: "#3b82f6", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer", color: "#fff" }}>
                              Confirm
                            </button>
                          )}
                          {(b.status === "Pending" || b.status === "Confirmed") && (
                            <button
                              onClick={() => updateStatus(b.id, "Cancelled")}
                              style={{ border: "none", background: "#fef2f2", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer", color: "#ef4444" }}>
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ padding: "16px 20px", borderTop: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, color: "#6b7280" }}>Page {page} of {totalPages}</span>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  style={{ border: "1.5px solid #e5e7eb", background: page === 1 ? "#f3f4f6" : "#fff", borderRadius: 8, padding: "6px 14px", fontSize: 13, fontWeight: 600, cursor: page === 1 ? "default" : "pointer" }}>
                  ← Prev
                </button>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(p => p + 1)}
                  style={{ border: "1.5px solid #e5e7eb", background: page === totalPages ? "#f3f4f6" : "#fff", borderRadius: 8, padding: "6px 14px", fontSize: 13, fontWeight: 600, cursor: page === totalPages ? "default" : "pointer" }}>
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedBooking && (
        <BookingDetailModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onStatusChange={updateStatus}
        />
      )}
    </div>
  );
}