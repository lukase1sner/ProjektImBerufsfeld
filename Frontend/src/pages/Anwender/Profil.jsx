import React, { useEffect, useMemo, useState } from "react";
import "../../styles/Profil.css";
import AnwenderLayout from "../../layout/AnwenderLayout.jsx";

const API_BASE = "http://localhost:8080/api";

const Profil = () => {
  // ✅ Robust: Token normalisieren (wie bei Quiz.jsx)
  const getAuthToken = () => {
    const candidates = [
      localStorage.getItem("authToken"),
      localStorage.getItem("token"),
      localStorage.getItem("jwt"),
      sessionStorage.getItem("authToken"),
      sessionStorage.getItem("token"),
      sessionStorage.getItem("jwt"),
    ].filter(Boolean);

    if (candidates.length === 0) return null;

    let t = candidates[0];

    try {
      const parsed = JSON.parse(t);
      if (typeof parsed === "string") t = parsed;
      else if (parsed && typeof parsed === "object") {
        t = parsed.token || parsed.accessToken || parsed.jwt || t;
      }
    } catch {
      // ignore
    }

    if (typeof t !== "string") return null;

    t = t.replace(/^"+|"+$/g, "").trim();
    t = t.replace(/\s+/g, " ").trim();
    if (/^bearer\s+/i.test(t)) t = t.replace(/^bearer\s+/i, "").trim();
    t = t.replace(/\s/g, "");

    return t || null;
  };

  const authToken = useMemo(() => getAuthToken(), []);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [user, setUser] = useState({
    firstName: "",
    lastName: "",
    email: "",
    points: 0,
    finishedQuizzes: 0,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });

  const fetchJsonSafe = async (res) => {
    const raw = await res.text().catch(() => "");
    try {
      return { raw, json: raw ? JSON.parse(raw) : null };
    } catch {
      return { raw, json: null };
    }
  };

  const loadProfile = async () => {
    if (!authToken) {
      setError("Nicht eingeloggt.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await fetch(`${API_BASE}/profile`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const { raw, json } = await fetchJsonSafe(res);
      if (!res.ok) throw new Error(json?.message || raw || `HTTP ${res.status}`);

      setUser({
        firstName: json?.firstName || "",
        lastName: json?.lastName || "",
        email: json?.email || "",
        points: Number.isFinite(json?.points) ? json.points : 0,
        finishedQuizzes: Number.isFinite(json?.finishedQuizzes) ? json.finishedQuizzes : 0,
      });
    } catch (e) {
      console.error(e);
      setError(`Profil konnte nicht geladen werden: ${e?.message || "Fehler"}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authToken]);

  const initials =
    (user.firstName?.charAt(0) || "").toUpperCase() +
    (user.lastName?.charAt(0) || "").toUpperCase();

  const openModal = () => {
    setForm({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (!saving) setIsModalOpen(false);
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const onSave = async () => {
    if (!authToken) return;

    const payload = {
      firstName: (form.firstName || "").trim(),
      lastName: (form.lastName || "").trim(),
      email: (form.email || "").trim(),
    };

    try {
      setSaving(true);
      setError("");

      const res = await fetch(`${API_BASE}/profile`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const { raw, json } = await fetchJsonSafe(res);
      if (!res.ok) throw new Error(json?.message || raw || `HTTP ${res.status}`);

      setUser({
        firstName: json?.firstName || payload.firstName,
        lastName: json?.lastName || payload.lastName,
        email: json?.email || payload.email,
        points: Number.isFinite(json?.points) ? json.points : user.points,
        finishedQuizzes: Number.isFinite(json?.finishedQuizzes)
          ? json.finishedQuizzes
          : user.finishedQuizzes,
      });

      setIsModalOpen(false);
    } catch (e) {
      console.error(e);
      setError(`Speichern fehlgeschlagen: ${e?.message || "Fehler"}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnwenderLayout>
      <div className="profil-main-wrapper">
        <h2 className="dashboard-admin-title">Profil</h2>

        {loading && <div style={{ opacity: 0.85 }}>Lade...</div>}
        {!loading && error && <div style={{ color: "#ffb3b3" }}>{error}</div>}

        {!loading && !error && (
          <>
            <div className="profil-card">
              <div className="profil-header">
                <div className="profil-avatar">{initials || "?"}</div>

                <div className="profil-info">
                  <div className="profil-name">
                    {user.firstName || "—"} {user.lastName || ""}
                  </div>
                  <div className="profil-email">{user.email || "—"}</div>
                </div>
              </div>

              <button className="profil-edit-button btn-shine" onClick={openModal}>
                Profil bearbeiten
              </button>
            </div>

            <h3 className="profil-section-title">Deine Statistiken</h3>

            <div className="profil-stats">
              <div className="profil-stat-card">
                <div className="stat-value">{user.points}</div>
                <div className="stat-label">Punkte</div>
              </div>

              <div className="profil-stat-card">
                <div className="stat-value">{user.finishedQuizzes}</div>
                <div className="stat-label">Beendete Quizzes</div>
              </div>
            </div>
          </>
        )}
      </div>

      {isModalOpen && (
        <div className="profil-modal-overlay" onClick={closeModal}>
          <div className="profil-modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="profil-modal-title">Profil bearbeiten</h3>

            <div className="profil-form">
              <label className="profil-label">
                Vorname
                <input
                  className="profil-input"
                  name="firstName"
                  value={form.firstName}
                  onChange={onChange}
                  placeholder="Vorname"
                  disabled={saving}
                />
              </label>

              <label className="profil-label">
                Nachname
                <input
                  className="profil-input"
                  name="lastName"
                  value={form.lastName}
                  onChange={onChange}
                  placeholder="Nachname"
                  disabled={saving}
                />
              </label>

              <label className="profil-label">
                E-Mail
                <input
                  className="profil-input"
                  name="email"
                  value={form.email}
                  onChange={onChange}
                  placeholder="E-Mail"
                  disabled={saving}
                />
              </label>
            </div>

            <div className="profil-modal-actions">
              <button
                className="profil-modal-button profil-modal-cancel btn-shine"
                onClick={closeModal}
                disabled={saving}
              >
                Abbrechen
              </button>

              <button
                className="profil-modal-button profil-modal-save btn-shine"
                onClick={onSave}
                disabled={saving}
              >
                {saving ? "Speichere..." : "Speichern"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AnwenderLayout>
  );
};

export default Profil;