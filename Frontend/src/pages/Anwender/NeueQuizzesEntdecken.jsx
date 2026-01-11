import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/NeueQuizzesEntdecken.css";
import AnwenderLayout from "../../layout/AnwenderLayout.jsx";

const API_BASE = "http://localhost:8080/api";

const NeueQuizzesEntdecken = () => {
  const navigate = useNavigate();

  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // helper: body nur 1x lesen
  const readBodyOnce = async (response) => {
    const raw = await response.text().catch(() => "");
    try {
      return { raw, json: raw ? JSON.parse(raw) : null };
    } catch {
      return { raw, json: null };
    }
  };

  useEffect(() => {
    const loadQuizzes = async () => {
      const authToken = localStorage.getItem("authToken");
      if (!authToken) {
        setLoading(false);
        setError("Nicht eingeloggt (authToken fehlt). Bitte neu einloggen.");
        return;
      }

      try {
        setLoading(true);
        setError("");

        const res = await fetch(`${API_BASE}/play/quizzes/new`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });

        const { raw, json } = await readBodyOnce(res);

        if (!res.ok) {
          const msg = json?.error || json?.message || raw || `HTTP ${res.status}`;
          throw new Error(msg);
        }

        const data = json;
        const normalized = (Array.isArray(data) ? data : []).map((q) => ({
          id: q.id,
          title: q.title ?? "",
          isPublished: Boolean(q.isPublished ?? q.published ?? false),
        }));

        setQuizzes(normalized);
      } catch (e) {
        console.error(e);
        setError(`Quizzes konnten nicht geladen werden: ${e?.message || "Failed to fetch"}`);
      } finally {
        setLoading(false);
      }
    };

    loadQuizzes();
  }, []);

  const handleOpen = (quiz) => {
    // du navigierst hier zu /anwender/quiz/:id
    navigate(`/anwender/quiz/${quiz.id}`);
  };

  return (
    <AnwenderLayout>
      <div className="quizzes-main-wrapper">
        <h2 className="dashboard-admin-title">Neue Quizzes entdecken</h2>

        {loading && <div style={{ opacity: 0.85 }}>Lade Quizzes...</div>}
        {!loading && error && <div style={{ color: "#ffb3b3" }}>{error}</div>}

        {!loading && !error && quizzes.length === 0 && (
          <div style={{ opacity: 0.85 }}>Keine neuen Quizzes verfügbar.</div>
        )}

        {!loading && !error && quizzes.length > 0 && (
          <div className="quizzes-list">
            {quizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="quiz-row"
                role="button"
                tabIndex={0}
                onClick={() => handleOpen(quiz)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") handleOpen(quiz);
                }}
                aria-label={`Quiz öffnen: ${quiz.title}`}
              >
                <div className="quiz-row-title">{quiz.title}</div>

                <button
                  className="quiz-row-arrow btn-shine"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpen(quiz);
                  }}
                  aria-label={`Quiz öffnen: ${quiz.title}`}
                  type="button"
                >
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </AnwenderLayout>
  );
};

export default NeueQuizzesEntdecken;