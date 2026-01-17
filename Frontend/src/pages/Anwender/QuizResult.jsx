import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AnwenderLayout from "../../layout/AnwenderLayout.jsx";
import "../../styles/Quiz.css";

const QuizResult = () => {
  const API_BASE = import.meta.env.VITE_API_BASE_URL;

  const { attemptId } = useParams();
  const navigate = useNavigate();
  const authToken = localStorage.getItem("authToken");

  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!API_BASE) {
        setError("Konfigurationsfehler: VITE_API_BASE_URL ist nicht gesetzt.");
        setLoading(false);
        return;
      }

      if (!authToken) {
        setError("Nicht eingeloggt.");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/api/play/attempts/${attemptId}/result`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });

        const raw = await res.text().catch(() => "");
        let json = null;
        try {
          json = raw ? JSON.parse(raw) : null;
        } catch {
          json = null;
        }

        if (!res.ok) {
          const msg = json?.message || json?.error || raw || `HTTP ${res.status}`;
          throw new Error(msg);
        }

        setData(json);
      } catch (e) {
        setError(e?.message || "Ergebnis konnte nicht geladen werden.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [attemptId, authToken, API_BASE]);

  const stats = useMemo(() => {
    if (!data) return null;
    return {
      title: data.quizTitle ?? "Ergebnis",
      score: data.score ?? data.correctAnswers ?? 0,
      total: data.totalQuestions ?? 0,
      correct: data.correctAnswers ?? 0,
      wrong: data.wrongAnswers ?? 0,
    };
  }, [data]);

  const StatBox = ({ value, label }) => (
    <div
      className="quizplay-scorecard"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
        padding: "1.2rem",
      }}
    >
      {/* Zahl */}
      <div
        style={{
          fontSize: "2.2rem",
          fontWeight: 900,
          lineHeight: 1,
          textAlign: "center",
        }}
      >
        {value}
      </div>

      {/* Text */}
      <div
        style={{
          fontWeight: 800,
          opacity: 0.9,
          textAlign: "center",
        }}
      >
        {label}
      </div>
    </div>
  );

  return (
    <AnwenderLayout>
      <div className="quizplay-wrapper">
        <div className="quizplay-header">
          <div className="quizplay-titleblock">
            <h2 className="quizplay-title">{stats?.title}</h2>
            <div className="quizplay-sub">Quiz abgeschlossen</div>
          </div>
        </div>

        {loading && <div className="quizplay-info">Lade...</div>}
        {!loading && error && <div className="quizplay-error">{error}</div>}

        {!loading && stats && (
          <div className="quizplay-card" style={{ maxWidth: 600 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <StatBox value={stats.score} label="Punkte" />
              <StatBox value={stats.total} label="Gesamt" />
              <StatBox value={stats.correct} label="Richtig" />
              <StatBox value={stats.wrong} label="Falsch" />
            </div>

            {/* Buttons rechtsbündig */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 10,
                marginTop: 22,
              }}
            >
              <button
                className="quizplay-next btn-shine"
                onClick={() => navigate(`/anwender/quiz/review/${attemptId}/0`)}
              >
                Review
              </button>

              <button
                className="quizplay-next btn-shine"
                onClick={() => navigate("/anwender/dashboard")}
              >
                Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </AnwenderLayout>
  );
};

export default QuizResult;