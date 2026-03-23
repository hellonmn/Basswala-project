/**
 * DJsManagement.tsx — Admin panel page for managing all DJs
 * - View / search / filter DJs
 * - Toggle availability
 * - Edit DJ details (name, rate, minimumHours, description)
 * - Upload / remove DJ photos (drag-and-drop or click)
 * - Add new DJ
 * - Delete DJ
 */

import React, { useEffect, useState, useCallback, useRef } from "react";
import { api } from "../utils/api";

// ─── Types ───────────────────────────────────────────────────────────────────

interface DJ {
  id: number;
  name: string;
  genres: any;
  hourlyRate: number;
  isAvailable: boolean;
  locationCity?: string;
  locationState?: string;
  ratingAverage?: number | string;
  ratingCount?: number;
  minimumHours?: number;
  description?: string;
  images?: string[];
  equipment?: {
    speakers?: string;
    mixer?: string;
    lightingSystem?: boolean;
    turntables?: boolean;
  };
  owner?: { id: number; firstName: string; lastName: string; email: string; phone?: string };
  createdAt?: string;
  totalBookings?: number;
}

// ─── Helper ───────────────────────────────────────────────────────────────────

const toArray = (val: any): string[] => {
  if (Array.isArray(val)) return val;
  if (typeof val === "string" && val.trim()) return val.split(",").map(s => s.trim());
  return [];
};

const BASE = "http://localhost:5000/api";
const tok = () => localStorage.getItem("bw_admin_token");
const authHeaders = () => ({ Authorization: `Bearer ${tok()}` });

// ─── Image Uploader ───────────────────────────────────────────────────────────

function ImageUploader({ djId, currentImages, onUploaded }: {
  djId: number;
  currentImages: string[];
  onUploaded: (urls: string[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string[]>(currentImages || []);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const uploadFiles = async (files: FileList | File[]) => {
    const fileArr = Array.from(files);
    if (!fileArr.length) return;
    for (const f of fileArr) {
      if (!f.type.startsWith("image/")) { setError("Only image files allowed"); return; }
      if (f.size > 5 * 1024 * 1024) { setError("Each file must be under 5MB"); return; }
    }
    setError(""); setUploading(true);
    try {
      const formData = new FormData();
      fileArr.forEach(f => formData.append("images", f));
      const res = await fetch(`${BASE}/admin/djs/${djId}/images`, {
        method: "POST",
        headers: authHeaders(),  // no Content-Type — browser sets it with boundary for multipart
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Upload failed");
      const urls: string[] = data?.images || data?.data?.images || [];
      const merged = [...preview, ...urls];
      setPreview(merged);
      onUploaded(merged);
    } catch (err: any) {
      setError(err?.message || "Upload failed. Ensure backend has POST /admin/djs/:id/images");
    } finally { setUploading(false); }
  };

  const removeImage = async (url: string, idx: number) => {
    try {
      await fetch(`${BASE}/admin/djs/${djId}/images`, {
        method: "DELETE",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: url }),
      });
    } catch (_) {}
    const updated = preview.filter((_, i) => i !== idx);
    setPreview(updated); onUploaded(updated);
  };

  return (
    <div>
      <label style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", display: "block", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.8 }}>
        DJ Photos
      </label>

      {preview.length > 0 && (
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
          {preview.map((url, i) => (
            <div key={i} style={{ position: "relative", width: 88, height: 88 }}>
              <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 10, border: "2px solid #e5e7eb" }} />
              <button
                onClick={() => removeImage(url, i)}
                style={{ position: "absolute", top: -7, right: -7, width: 22, height: 22, borderRadius: "50%", background: "#ef4444", border: "2px solid #fff", color: "#fff", fontSize: 10, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>
                ✕
              </button>
              {i === 0 && (
                <div style={{ position: "absolute", bottom: 4, left: 4, background: "rgba(0,0,0,0.65)", color: "#fff", fontSize: 9, fontWeight: 700, borderRadius: 4, padding: "1px 5px" }}>
                  COVER
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div
        onDrop={e => { e.preventDefault(); setDragOver(false); uploadFiles(e.dataTransfer.files); }}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => inputRef.current?.click()}
        style={{ border: `2px dashed ${dragOver ? "#0cadab" : "#d1d5db"}`, borderRadius: 12, padding: "22px 16px", textAlign: "center", cursor: "pointer", background: dragOver ? "#f0fafa" : "#f9fafb", transition: "all 0.2s" }}>
        <div style={{ fontSize: 28, marginBottom: 6 }}>📸</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 3 }}>
          {uploading ? "Uploading..." : "Click or drag photos here"}
        </div>
        <div style={{ fontSize: 11, color: "#9ca3af" }}>JPG, PNG, WEBP · Max 5MB each · Multiple allowed</div>
        <input ref={inputRef} type="file" accept="image/*" multiple style={{ display: "none" }}
          onChange={e => e.target.files && uploadFiles(e.target.files)} />
      </div>

      {uploading && (
        <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 15, height: 15, border: "2.5px solid #0cadab", borderTopColor: "transparent", borderRadius: "50%", animation: "djSpin 0.8s linear infinite" }} />
          <span style={{ fontSize: 13, color: "#0cadab", fontWeight: 600 }}>Uploading images...</span>
        </div>
      )}

      {error && (
        <div style={{ marginTop: 8, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#dc2626", fontWeight: 600 }}>
          ⚠ {error}
        </div>
      )}
    </div>
  );
}

// ─── Add DJ Modal ─────────────────────────────────────────────────────────────

function AddDJModal({ onClose, onAdded }: { onClose: () => void; onAdded: (dj: DJ) => void }) {
  const [form, setForm] = useState({
    name: "", hourlyRate: "", minimumHours: "2", description: "",
    locationCity: "", locationState: "", genres: "",
    email: "", phone: "", password: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [createdId, setCreatedId] = useState<number | null>(null);
  const [createdDJ, setCreatedDJ] = useState<DJ | null>(null);

  const set = (f: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [f]: e.target.value }));

  const handleCreate = async () => {
    if (!form.name || !form.hourlyRate || !form.email || !form.password) {
      setError("Name, hourly rate, email and password are required."); return;
    }
    setSaving(true); setError("");
    try {
      const res = await api.createDJ({
        name: form.name.trim(),
        hourlyRate: parseFloat(form.hourlyRate),
        minimumHours: parseInt(form.minimumHours) || 2,
        description: form.description.trim(),
        locationCity: form.locationCity.trim(),
        locationState: form.locationState.trim(),
        genres: form.genres.split(",").map(g => g.trim()).filter(Boolean),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        password: form.password,
      });
      if (!res.success) throw new Error(res.message || "Failed to create DJ");
      const dj: DJ = res.data?.dj || res.data || res;
      setCreatedId(dj.id);
      setCreatedDJ(dj);
    } catch (err: any) {
      setError(err?.message || "Failed to create DJ");
    } finally { setSaving(false); }
  };

  const inputStyle: React.CSSProperties = { width: "100%", border: "1.5px solid #e5e7eb", borderRadius: 10, padding: "10px 14px", fontSize: 14, outline: "none", boxSizing: "border-box" };
  const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: "#6b7280", display: "block", marginBottom: 5 };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
      <div style={{ background: "#fff", borderRadius: 18, width: "100%", maxWidth: 560, maxHeight: "92vh", overflow: "auto", boxShadow: "0 24px 60px rgba(0,0,0,0.25)" }}>

        <div style={{ padding: "22px 26px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#111827" }}>Add New DJ</h2>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6b7280" }}>Create profile then upload photos</p>
          </div>
          <button onClick={onClose} style={{ border: "none", background: "#f3f4f6", borderRadius: 8, padding: "8px 12px", cursor: "pointer", fontSize: 16 }}>✕</button>
        </div>

        <div style={{ padding: 26 }}>
          {!createdId ? (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                {([
                  { label: "DJ Name *", field: "name", span: 2 },
                  { label: "Email *", field: "email", type: "email" },
                  { label: "Phone", field: "phone", type: "tel" },
                  { label: "Password *", field: "password", type: "password" },
                  { label: "Hourly Rate (₹) *", field: "hourlyRate", type: "number" },
                  { label: "Minimum Hours", field: "minimumHours", type: "number" },
                  { label: "City", field: "locationCity" },
                  { label: "State", field: "locationState" },
                ] as any[]).map(({ label, field, type = "text", span }) => (
                  <div key={field} style={{ gridColumn: span ? `span ${span}` : undefined }}>
                    <label style={labelStyle}>{label}</label>
                    <input type={type} value={(form as any)[field]} onChange={set(field)} style={inputStyle} />
                  </div>
                ))}
                <div style={{ gridColumn: "span 2" }}>
                  <label style={labelStyle}>Genres (comma separated)</label>
                  <input value={form.genres} onChange={set("genres")} placeholder="Bollywood, EDM, Hip-Hop" style={inputStyle} />
                </div>
                <div style={{ gridColumn: "span 2" }}>
                  <label style={labelStyle}>Description</label>
                  <textarea value={form.description} onChange={set("description")} rows={3}
                    style={{ ...inputStyle, resize: "vertical" }} />
                </div>
              </div>

              {error && (
                <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#dc2626", fontWeight: 600, marginBottom: 14 }}>
                  ⚠ {error}
                </div>
              )}

              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={onClose} style={{ flex: 1, border: "1.5px solid #e5e7eb", background: "#fff", borderRadius: 12, padding: "12px", fontSize: 14, fontWeight: 700, cursor: "pointer", color: "#374151" }}>
                  Cancel
                </button>
                <button disabled={saving} onClick={handleCreate} style={{ flex: 2, background: "#0cadab", border: "none", color: "#fff", borderRadius: 12, padding: "12px", fontSize: 14, fontWeight: 700, cursor: saving ? "default" : "pointer", opacity: saving ? 0.7 : 1 }}>
                  {saving ? "Creating..." : "✓ Create DJ Profile"}
                </button>
              </div>
            </>
          ) : (
            <>
              <div style={{ textAlign: "center", marginBottom: 24 }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>🎉</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#111827", marginBottom: 4 }}>DJ Profile Created!</div>
                <div style={{ fontSize: 13, color: "#6b7280" }}>Now add photos for {form.name}</div>
              </div>
              <ImageUploader
                djId={createdId}
                currentImages={[]}
                onUploaded={urls => setCreatedDJ(prev => prev ? { ...prev, images: urls } : null)}
              />
              <button
                onClick={() => { if (createdDJ) onAdded(createdDJ); onClose(); }}
                style={{ width: "100%", background: "#111827", border: "none", color: "#fff", borderRadius: 12, padding: "13px", fontSize: 14, fontWeight: 700, cursor: "pointer", marginTop: 16 }}>
                Finish & Close →
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── DJ Detail / Edit Modal ───────────────────────────────────────────────────

function DJDetailModal({ dj, onClose, onSave, onDelete }: {
  dj: DJ;
  onClose: () => void;
  onSave: (id: number, data: Partial<DJ>) => void;
  onDelete: (id: number) => void;
}) {
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState<"info" | "photos">("info");
  const [form, setForm] = useState({
    name: dj.name,
    hourlyRate: dj.hourlyRate,
    description: dj.description || "",
    minimumHours: dj.minimumHours || 2,
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [djImages, setDjImages] = useState<string[]>(dj.images || []);

  const handleSave = async () => {
    setSaving(true);
    await onSave(dj.id, form);
    setSaving(false);
    setEditMode(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    await onDelete(dj.id);
    setDeleting(false);
    onClose();
  };

  const rating = parseFloat(String(dj.ratingAverage || 0)).toFixed(1);
  const genres = toArray(dj.genres);

  const inputStyle: React.CSSProperties = { width: "100%", border: "1.5px solid #e5e7eb", borderRadius: 10, padding: "10px 14px", fontSize: 14, outline: "none", boxSizing: "border-box" };
  const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: "#6b7280", display: "block", marginBottom: 5 };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
      <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 620, maxHeight: "90vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>

        {/* Header */}
        <div style={{ padding: "24px 28px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: "#101720", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 20, flexShrink: 0 }}>
              {djImages[0]
                ? <img src={djImages[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : (dj.name?.[0] || "D")}
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#111827" }}>{dj.name}</h2>
              <div style={{ display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
                <span style={{ background: dj.isAvailable ? "#f0fdf4" : "#fef2f2", color: dj.isAvailable ? "#16a34a" : "#dc2626", border: `1px solid ${dj.isAvailable ? "#bbf7d0" : "#fecaca"}`, borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>
                  {dj.isAvailable ? "● Available" : "● Unavailable"}
                </span>
                {dj.ratingCount ? (
                  <span style={{ background: "#fffbeb", color: "#92400e", border: "1px solid #fde68a", borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>
                    ★ {rating} ({dj.ratingCount} reviews)
                  </span>
                ) : null}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ border: "none", background: "#f3f4f6", borderRadius: 8, padding: "8px 12px", cursor: "pointer", fontSize: 16 }}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", padding: "10px 28px 0", borderBottom: "1px solid #f3f4f6" }}>
          {([{ id: "info", label: "📋 Info" }, { id: "photos", label: "📸 Photos" }] as any[]).map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ border: "none", background: "transparent", padding: "8px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", color: activeTab === t.id ? "#0cadab" : "#6b7280", borderBottom: activeTab === t.id ? "2.5px solid #0cadab" : "2.5px solid transparent", marginBottom: -1 }}>
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ padding: 28 }}>

          {/* ── Photos Tab ── */}
          {activeTab === "photos" && (
            <ImageUploader
              djId={dj.id}
              currentImages={djImages}
              onUploaded={urls => setDjImages(urls)}
            />
          )}

          {/* ── Info Tab ── */}
          {activeTab === "info" && (
            <>
              {/* Edit / Delete buttons */}
              <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                <button
                  onClick={() => setEditMode(!editMode)}
                  style={{ border: "1.5px solid #e5e7eb", background: editMode ? "#111827" : "#fff", color: editMode ? "#fff" : "#374151", borderRadius: 10, padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  {editMode ? "Cancel Edit" : "✏️ Edit Details"}
                </button>
                {!confirmDelete ? (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    style={{ border: "1.5px solid #fecaca", background: "#fef2f2", color: "#ef4444", borderRadius: 10, padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                    🗑 Delete DJ
                  </button>
                ) : (
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <span style={{ fontSize: 13, color: "#ef4444", fontWeight: 600 }}>Are you sure?</span>
                    <button disabled={deleting} onClick={handleDelete} style={{ border: "none", background: "#ef4444", color: "#fff", borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                      {deleting ? "Deleting..." : "Yes, Delete"}
                    </button>
                    <button onClick={() => setConfirmDelete(false)} style={{ border: "1.5px solid #e5e7eb", background: "#fff", borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>No</button>
                  </div>
                )}
              </div>

              {editMode ? (
                /* ── Edit Form ── */
                <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 }}>
                  {[
                    { label: "DJ Name", field: "name", type: "text" },
                    { label: "Hourly Rate (₹)", field: "hourlyRate", type: "number" },
                    { label: "Minimum Hours", field: "minimumHours", type: "number" },
                  ].map(({ label, field, type }) => (
                    <div key={field}>
                      <label style={labelStyle}>{label}</label>
                      <input
                        type={type}
                        value={(form as any)[field]}
                        onChange={e => setForm(f => ({ ...f, [field]: type === "number" ? +e.target.value : e.target.value }))}
                        style={inputStyle}
                      />
                    </div>
                  ))}
                  <div>
                    <label style={labelStyle}>Description</label>
                    <textarea
                      value={form.description}
                      onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      rows={3}
                      style={{ ...inputStyle, resize: "vertical" }}
                    />
                  </div>
                  <button
                    disabled={saving}
                    onClick={handleSave}
                    style={{ background: "#0cadab", border: "none", color: "#fff", borderRadius: 12, padding: "12px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                    {saving ? "Saving..." : "✓ Save Changes"}
                  </button>
                </div>
              ) : (
                /* ── View Mode ── */
                <>
                  {/* Info grid */}
                  <section style={{ marginBottom: 24 }}>
                    <h3 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: 1 }}>DJ Info</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      {[
                        ["Rate", `₹${dj.hourlyRate?.toLocaleString()}/hr`],
                        ["Min Hours", `${dj.minimumHours || 2} hrs`],
                        ["Location", [dj.locationCity, dj.locationState].filter(Boolean).join(", ") || "—"],
                        ["Total Bookings", dj.totalBookings ?? "—"],
                        ["Rating", dj.ratingCount ? `${rating} ★ (${dj.ratingCount})` : "No ratings yet"],
                        ["Joined", dj.createdAt ? new Date(dj.createdAt).toLocaleDateString("en-IN") : "—"],
                      ].map(([label, value]) => (
                        <div key={String(label)} style={{ background: "#f9fafb", borderRadius: 10, padding: "12px 14px" }}>
                          <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600, marginBottom: 3 }}>{label}</div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{String(value)}</div>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Genres */}
                  <section style={{ marginBottom: 20 }}>
                    <h3 style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: 1 }}>Genres</h3>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {genres.length > 0
                        ? genres.map(g => (
                            <span key={g} style={{ background: "#f3f4f6", border: "1px solid #e5e7eb", borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 600, color: "#374151" }}>{g}</span>
                          ))
                        : <span style={{ color: "#9ca3af", fontSize: 13 }}>No genres specified</span>
                      }
                    </div>
                  </section>

                  {/* Equipment */}
                  {dj.equipment && Object.keys(dj.equipment).length > 0 && (
                    <section style={{ marginBottom: 20 }}>
                      <h3 style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: 1 }}>Equipment</h3>
                      <div style={{ background: "#f9fafb", borderRadius: 12, padding: 14 }}>
                        {dj.equipment.speakers && <div style={{ fontSize: 13, color: "#374151", marginBottom: 4 }}>🔊 Speakers: {dj.equipment.speakers}</div>}
                        {dj.equipment.mixer && <div style={{ fontSize: 13, color: "#374151", marginBottom: 4 }}>🎚️ Mixer: {dj.equipment.mixer}</div>}
                        <div style={{ fontSize: 13, color: "#374151", marginBottom: 4 }}>💡 Lighting: {dj.equipment.lightingSystem ? "Yes" : "No"}</div>
                        <div style={{ fontSize: 13, color: "#374151" }}>🎛️ Turntables: {dj.equipment.turntables ? "Yes" : "No"}</div>
                      </div>
                    </section>
                  )}

                  {/* Owner */}
                  {dj.owner && (
                    <section>
                      <h3 style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: 1 }}>Account Owner</h3>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, background: "#f9fafb", borderRadius: 12, padding: 14 }}>
                        <div style={{ width: 38, height: 38, borderRadius: 12, background: "#0cadab", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 14 }}>
                          {dj.owner.firstName?.[0] || "U"}
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{dj.owner.firstName} {dj.owner.lastName}</div>
                          <div style={{ fontSize: 12, color: "#6b7280" }}>{dj.owner.email}</div>
                        </div>
                      </div>
                    </section>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DJsManagement() {
  const [djs, setDJs] = useState<DJ[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [availFilter, setAvailFilter] = useState<"all" | "available" | "unavailable">("all");
  const [selectedDJ, setSelectedDJ] = useState<DJ | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const PAGE_SIZE = 12;

  const fetchDJs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
      if (search) params.set("search", search);
      if (availFilter === "available") params.set("isAvailable", "true");
      if (availFilter === "unavailable") params.set("isAvailable", "false");

      const res = await api.getDJs("?" + params.toString());

      if (res.success) {
        const data = res.data;
        const list = Array.isArray(data?.djs ?? data) ? (data?.djs ?? data) : [];
        setDJs(list);
        setTotal(data?.total ?? list.length);
      }
    } catch (err) {
      console.error("Failed to load DJs:", err);
    } finally {
      setLoading(false);
    }
  }, [search, availFilter, page]);

  useEffect(() => { fetchDJs(); }, [fetchDJs]);

  const toggleAvailability = async (dj: DJ) => {
    const res = await api.toggleDJAvail(dj.id);
    if (res.success) {
      setDJs(prev => prev.map(d => d.id === dj.id ? { ...d, isAvailable: !d.isAvailable } : d));
      if (selectedDJ?.id === dj.id)
        setSelectedDJ(prev => prev ? { ...prev, isAvailable: !prev.isAvailable } : null);
    }
  };

  const saveDJ = async (id: number, data: Partial<DJ>) => {
    const res = await api.updateDJ(id, data);
    if (res.success)
      setDJs(prev => prev.map(d => d.id === id ? { ...d, ...data } : d));
  };

  const deleteDJ = async (id: number) => {
    const res = await api.deleteDJ(id);
    if (res.success) {
      setDJs(prev => prev.filter(d => d.id !== id));
      setSelectedDJ(null);
    }
  };

  const stats = {
    total: total || djs.length,
    available: djs.filter(d => d.isAvailable).length,
    unavailable: djs.filter(d => !d.isAvailable).length,
    avgRate: djs.length ? Math.round(djs.reduce((a, d) => a + d.hourlyRate, 0) / djs.length) : 0,
  };

  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: "#111827", minHeight: "100vh", background: "#f9fafb" }}>
      <style>{`@keyframes djSpin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "28px 24px" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: "#111827", letterSpacing: -0.5 }}>DJs Management</h1>
            <p style={{ margin: "6px 0 0", fontSize: 14, color: "#6b7280" }}>Manage DJ profiles, photos, availability, and settings</p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={fetchDJs} style={{ background: "#fff", color: "#374151", border: "1.5px solid #e5e7eb", borderRadius: 10, padding: "10px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              ↻ Refresh
            </button>
            <button onClick={() => setShowAddModal(true)} style={{ background: "#0cadab", color: "#fff", border: "none", borderRadius: 10, padding: "10px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              + Add DJ
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16, marginBottom: 28 }}>
          {[
            { label: "Total DJs", value: stats.total, icon: "🎧", color: "#6366f1" },
            { label: "Available", value: stats.available, icon: "🟢", color: "#10b981" },
            { label: "Unavailable", value: stats.unavailable, icon: "🔴", color: "#ef4444" },
            { label: "Avg Rate", value: `₹${stats.avgRate.toLocaleString()}/hr`, icon: "💰", color: "#0cadab" },
          ].map(s => (
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
            placeholder="Search DJs by name, city, genre..."
            style={{ flex: 1, minWidth: 200, border: "1.5px solid #e5e7eb", borderRadius: 10, padding: "10px 14px", fontSize: 14, outline: "none" }}
          />
          {(["all", "available", "unavailable"] as const).map(f => (
            <button
              key={f}
              onClick={() => { setAvailFilter(f); setPage(1); }}
              style={{
                border: "1.5px solid",
                borderColor: availFilter === f ? "#0cadab" : "#e5e7eb",
                background: availFilter === f ? "#0cadab" : "#fff",
                color: availFilter === f ? "#fff" : "#374151",
                borderRadius: 20, padding: "6px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", textTransform: "capitalize",
              }}>
              {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* DJ Cards Grid */}
        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Loading DJs...</div>
          </div>
        ) : djs.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🎧</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>No DJs found</div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {djs.map(dj => {
              const rating = parseFloat(String(dj.ratingAverage || 0)).toFixed(1);
              const genres = toArray(dj.genres);
              return (
                <div
                  key={dj.id}
                  style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", overflow: "hidden", transition: "box-shadow 0.2s", cursor: "pointer" }}
                  onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.1)")}
                  onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}>

                  {/* DJ Image / Avatar */}
                  <div style={{ height: 140, background: "#101720", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                    {dj.images && dj.images.length > 0 ? (
                      <img src={dj.images[0]} alt={dj.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ fontSize: 48, fontWeight: 800, color: "#fff", letterSpacing: -2 }}>{dj.name?.[0] || "D"}</div>
                    )}
                    {/* Availability toggle */}
                    <div style={{ position: "absolute", top: 10, right: 10 }}>
                      <button
                        onClick={e => { e.stopPropagation(); toggleAvailability(dj); }}
                        style={{ background: dj.isAvailable ? "#f0fdf4" : "#fef2f2", color: dj.isAvailable ? "#16a34a" : "#dc2626", border: `1.5px solid ${dj.isAvailable ? "#bbf7d0" : "#fecaca"}`, borderRadius: 20, padding: "4px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                        {dj.isAvailable ? "● Available" : "● Unavailable"}
                      </button>
                    </div>
                    {/* Photo count */}
                    {dj.images && dj.images.length > 0 && (
                      <div style={{ position: "absolute", bottom: 8, left: 8, background: "rgba(0,0,0,0.6)", color: "#fff", fontSize: 10, fontWeight: 700, borderRadius: 5, padding: "2px 7px" }}>
                        📸 {dj.images.length}
                      </div>
                    )}
                  </div>

                  {/* Body */}
                  <div style={{ padding: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: "#111827", marginBottom: 2 }}>{dj.name}</div>
                        <div style={{ fontSize: 12, color: "#9ca3af" }}>{[dj.locationCity, dj.locationState].filter(Boolean).join(", ") || "No location"}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 16, fontWeight: 800, color: "#0cadab" }}>₹{dj.hourlyRate?.toLocaleString()}</div>
                        <div style={{ fontSize: 11, color: "#9ca3af" }}>Min {dj.minimumHours || 2}h</div>
                      </div>
                    </div>

                    {/* Genres */}
                    <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 12 }}>
                      {genres.length > 0
                        ? genres.slice(0, 3).map(g => (
                            <span key={g} style={{ background: "#f3f4f6", borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 600, color: "#4b5563" }}>{g}</span>
                          ))
                        : <span style={{ fontSize: 11, color: "#9ca3af" }}>No genres</span>
                      }
                    </div>

                    {/* Rating & stats */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{ color: "#f59e0b", fontSize: 13 }}>★</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{rating}</span>
                        <span style={{ fontSize: 12, color: "#9ca3af" }}>({dj.ratingCount || 0})</span>
                      </div>
                      {dj.totalBookings !== undefined && (
                        <div style={{ fontSize: 12, color: "#6b7280" }}>{dj.totalBookings} bookings</div>
                      )}
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => setSelectedDJ(dj)}
                        style={{ flex: 1, border: "1.5px solid #e5e7eb", background: "#fff", borderRadius: 10, padding: "9px", fontSize: 13, fontWeight: 700, cursor: "pointer", color: "#374151" }}>
                        View Details
                      </button>
                      <button
                        onClick={() => toggleAvailability(dj)}
                        style={{ flex: 1, border: "none", background: dj.isAvailable ? "#fef2f2" : "#f0fdf4", borderRadius: 10, padding: "9px", fontSize: 12, fontWeight: 700, cursor: "pointer", color: dj.isAvailable ? "#dc2626" : "#16a34a" }}>
                        {dj.isAvailable ? "Set Unavailable" : "Set Available"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {Math.ceil(total / PAGE_SIZE) > 1 && (
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 28 }}>
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              style={{ border: "1.5px solid #e5e7eb", background: "#fff", borderRadius: 10, padding: "8px 18px", fontSize: 13, fontWeight: 600, cursor: page === 1 ? "default" : "pointer" }}>
              ← Prev
            </button>
            <span style={{ display: "flex", alignItems: "center", fontSize: 13, color: "#6b7280", padding: "0 8px" }}>
              Page {page} of {Math.ceil(total / PAGE_SIZE)}
            </span>
            <button
              disabled={page === Math.ceil(total / PAGE_SIZE)}
              onClick={() => setPage(p => p + 1)}
              style={{ border: "1.5px solid #e5e7eb", background: "#fff", borderRadius: 10, padding: "8px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              Next →
            </button>
          </div>
        )}
      </div>

      {selectedDJ && (
        <DJDetailModal
          dj={selectedDJ}
          onClose={() => setSelectedDJ(null)}
          onSave={saveDJ}
          onDelete={deleteDJ}
        />
      )}

      {showAddModal && (
        <AddDJModal
          onClose={() => setShowAddModal(false)}
          onAdded={dj => { setDJs(prev => [dj, ...prev]); setShowAddModal(false); }}
        />
      )}
    </div>
  );
}