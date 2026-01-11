import React, { useEffect, useMemo, useState } from "react";
import "../../styles/BestenlisteAnzeigen.css";
import AnwenderLayout from "../../layout/AnwenderLayout.jsx";

const API_BASE = "http://localhost:8080/api";

const BestenlisteAnzeigen = () => {
  // ✅ Robust: Token normalisieren (Quotes/JSON/Bearer/Whitespace)
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

  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchJsonSafe = async (res) => {
    const raw = await res.text().catch(() => "");
    try {
      return { raw, json: raw ? JSON.parse(raw) : null };
    } catch {
      return { raw, json: null };
    }
  };

  useEffect(() => {
    const load = async () => {
      if (!authToken) {
        setError("Nicht eingeloggt.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const res = await fetch(`${API_BASE}/leaderboard?limit=50`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });

        const { raw, json } = await fetchJsonSafe(res);
        if (!res.ok) throw new Error(json?.message || raw || `HTTP ${res.status}`);

        setRanking(Array.isArray(json) ? json : []);
      } catch (e) {
        console.error(e);
        setError(`Bestenliste konnte nicht geladen werden: ${e?.message || "Fehler"}`);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [authToken]);

  return (
    <AnwenderLayout>
      <div className="ranking-main-wrapper">
        <h2 className="dashboard-admin-title">Bestenliste</h2>

        <div className="ranking-table-card">
          <div className="ranking-table-head">
            <h3>Alle Plätze</h3>
            <span className="ranking-hint">Sortiert nach Punkten</span>
          </div>

          {loading && <div style={{ opacity: 0.85 }}>Lade...</div>}
          {!loading && error && <div style={{ color: "#ffb3b3" }}>{error}</div>}

          {!loading && !error && (
            <div className="ranking-table">
              <div className="ranking-row ranking-header">
                <div>#</div>
                <div>Name</div>
                <div className="align-right">Punkte</div>
              </div>

              {ranking.length === 0 && (
                <div style={{ opacity: 0.85, paddingTop: 6 }}>Noch keine Daten vorhanden.</div>
              )}

              {ranking.map((u, idx) => {
                const isHighlighted = !!u.currentUser;

                return (
                  <div
                    key={u.userId || `${u.rank}-${idx}`}
                    className={`ranking-row ${isHighlighted ? "ranking-row-highlight" : ""}`}
                  >
                    <div>{Number.isFinite(u.rank) ? u.rank : idx + 1}</div>

                    {/* ✅ Name: kein Umbruch, mehr Platz durch CSS Grid Fix */}
                    <div className="ranking-name" title={u.name || "Unbekannt"}>
                      {u.name || "Unbekannt"}
                    </div>

                    <div className="align-right">{Number.isFinite(u.points) ? u.points : 0}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AnwenderLayout>
  );
};

export default BestenlisteAnzeigen;