import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/QuizzesFortsetzen.css";
import AnwenderLayout from "../../layout/AnwenderLayout.jsx";

const QuizzesFortsetzen = () => {
  const API_BASE = import.meta.env.VITE_API_BASE_URL;

  const navigate = useNavigate();
  const authToken = localStorage.getItem("authToken");

  const [items, setItems] = useState([]);
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
      setLoading(true);
      setError("");

      const res = await fetch(`${API_BASE}/api/play/quizzes/resumable`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const { raw, json } = await fetchJsonSafe(res);
      if (!res.ok) throw new Error(json?.message || raw || `HTTP ${res.status}`);

      setItems(Array.isArray(json) ? json : []);
    } catch (e) {
      console.error(e);
      setError(`Quizzes konnten nicht geladen werden: ${e?.message || "Fehler"}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [API_BASE]);

  const handleContinue = (attemptId, finished) => {
    if (finished) {
      navigate(`/anwender/quiz/result/${attemptId}`);
    } else {
      navigate(`/anwender/quiz/attempt/${attemptId}`);
    }
  };

  const handleRestart = async (quizId) => {
    if (!API_BASE || !authToken) return;

    try {
      setError("");

      const res = await fetch(`${API_BASE}/api/play/quizzes/${quizId}/restart`, {
        method: "POST",
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const { raw, json } = await fetchJsonSafe(res);
      if (!res.ok) throw new Error(json?.message || raw || `HTTP ${res.status}`);

      const attemptId = json?.attemptId;
      if (!attemptId) throw new Error("restart: attemptId fehlt in Response");

      // ✅ lokalen Cache für diesen Attempt löschen
      try {
        sessionStorage.removeItem(`quiz_answer_cache_${attemptId}`);
      } catch {
        // ignore
      }

      // Liste neu laden
      await load();

      navigate(`/anwender/quiz/attempt/${attemptId}`);
    } catch (e) {
      console.error(e);
      setError(`Neustarten fehlgeschlagen: ${e?.message || "Fehler"}`);
    }
  };

  return (
    <AnwenderLayout>
      <div className="quiz-fortsetzen-wrapper">
        <h2 className="dashboard-admin-title">Quizzes fortsetzen</h2>

        {loading && <div style={{ opacity: 0.85 }}>Lade Quizzes...</div>}
        {!loading && error && <div style={{ color: "#ffb3b3" }}>{error}</div>}

        {!loading && !error && items.length === 0 && (
          <div style={{ opacity: 0.85 }}>Keine Quizzes vorhanden.</div>
        )}

        {!loading && !error && items.length > 0 && (
          <div className="resume-list">
            {items.map((q) => {
              const title = q.quizTitle ?? q.title ?? "Quiz";

              const totalQuestions = Number.isFinite(q.totalQuestions)
                ? q.totalQuestions
                : 0;
              const answeredQuestions = Number.isFinite(q.answeredQuestions)
                ? q.answeredQuestions
                : 0;

              const finished =
                typeof q.finished === "boolean"
                  ? q.finished
                  : totalQuestions > 0 &&
                    answeredQuestions >= totalQuestions;

              const percent =
                totalQuestions > 0
                  ? Math.min(
                      100,
                      Math.max(
                        0,
                        Math.round(
                          (answeredQuestions / totalQuestions) * 100
                        )
                      )
                    )
                  : 0;

              return (
                <div key={q.attemptId} className="quiz-resume-card">
                  <h3 className="quiz-resume-title">{title}</h3>

                  <div className="quiz-resume-progress">
                    <div className="progress-label">
                      Fortschritt: {answeredQuestions} / {totalQuestions} Fragen
                    </div>

                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    <div className="progress-percent">{percent}%</div>
                  </div>

                  <div className="quiz-resume-actions-col">
                    <button
                      className="quiz-resume-button primary btn-shine"
                      onClick={() =>
                        handleContinue(q.attemptId, finished)
                      }
                    >
                      {finished ? "Ergebnisse ansehen" : "Fortsetzen"}
                    </button>

                    <button
                      className="quiz-resume-button secondary btn-shine"
                      onClick={() => handleRestart(q.quizId)}
                    >
                      Neustarten
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AnwenderLayout>
  );
};

export default QuizzesFortsetzen;