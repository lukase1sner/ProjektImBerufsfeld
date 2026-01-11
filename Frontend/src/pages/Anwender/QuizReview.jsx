import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AnwenderLayout from "../../layout/AnwenderLayout.jsx";
import "../../styles/Quiz.css";

const API_BASE = "http://localhost:8080/api";

const QuizReview = () => {
  const { attemptId, position } = useParams();
  const pos = Number(position || 0);

  const navigate = useNavigate();

  // ✅ Robust: Token normalisieren (wie in Quiz.jsx)
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

  const authToken = getAuthToken();

  const headers = useMemo(() => {
    return () => {
      const h = {};
      if (authToken) h["Authorization"] = `Bearer ${authToken}`;
      return h;
    };
  }, [authToken]);

  const readBodyOnce = async (res) => {
    const raw = await res.text().catch(() => "");
    try {
      return { raw, json: raw ? JSON.parse(raw) : null };
    } catch {
      return { raw, json: null };
    }
  };

  // Dropdown (wie Quiz.jsx)
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [q, setQ] = useState(null);
  const [ov, setOv] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // für gleiche UI wie Quiz.jsx
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [result, setResult] = useState(null);

  // close dropdown on outside click
  useEffect(() => {
    const onDown = (e) => {
      if (!dropdownOpen) return;
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [dropdownOpen]);

  // ESC closes dropdown
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") setDropdownOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const statusFor = (it) => {
    if (!it?.answered) return "open";
    if (it.correct === true) return "correct";
    if (it.correct === false) return "wrong";
    return "open";
  };

  const load = async () => {
    if (!authToken) {
      navigate("/");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const [resQ, resOv] = await Promise.all([
        fetch(`${API_BASE}/play/attempts/${attemptId}/review/${pos}`, {
          headers: headers(),
        }),
        fetch(`${API_BASE}/play/attempts/${attemptId}/overview`, {
          headers: headers(),
        }),
      ]);

      const { raw: rawQ, json: jsonQ } = await readBodyOnce(resQ);
      if (!resQ.ok) throw new Error(jsonQ?.message || rawQ || `HTTP ${resQ.status}`);

      const { raw: rawOv, json: jsonOv } = await readBodyOnce(resOv);
      if (!resOv.ok) throw new Error(jsonOv?.message || rawOv || `HTTP ${resOv.status}`);

      setQ(jsonQ);
      setOv(jsonOv);

      // ✅ Review liefert bereits die Auswertung -> Quiz.jsx UI nachbauen
      const sel = Number.isInteger(jsonQ?.selectedIndex) ? jsonQ.selectedIndex : null;
      setSelectedIndex(sel);

      // result-Objekt in gleicher Form wie Quiz.jsx (für gleiche CSS/Icons)
      setResult({
        correct: !!jsonQ?.correct,
        correctIndex: Number.isInteger(jsonQ?.correctIndex) ? jsonQ.correctIndex : null,
        explanation: jsonQ?.explanation || "",
      });
    } catch (e) {
      console.error(e);
      setError("Review konnte nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptId, pos, authToken]);

  const total = ov?.totalQuestions ?? 0;
  const progressText = total > 0 ? `Frage ${pos + 1} / ${total}` : `Frage ${pos + 1}`;

  const goToPos = (nextPos) => {
    setDropdownOpen(false);
    navigate(`/anwender/quiz/review/${attemptId}/${nextPos}`);
  };

  return (
    <AnwenderLayout>
      <div className="quizplay-wrapper">
        {/* ✅ Header wie Quiz.jsx */}
        <div className="quizplay-header">
          <div className="quizplay-titleblock">
            <h2 className="quizplay-title">Review</h2>

            <div className="quizplay-sub-row">
              <div className="quizplay-sub">{progressText}</div>

              {ov?.items?.length > 0 && (
                <div className="quizplay-qselect" ref={dropdownRef}>
                  <button
                    type="button"
                    className="quizplay-qselect-iconbtn"
                    onClick={() => setDropdownOpen((s) => !s)}
                    aria-label="Frage auswählen"
                    aria-haspopup="listbox"
                    aria-expanded={dropdownOpen}
                  >
                    <span className="material-symbols-outlined">arrow_drop_down_circle</span>
                  </button>

                  {dropdownOpen && (
                    <div className="quizplay-qselect-menu light" role="listbox">
                      <div className="quizplay-qselect-menu-head">
                        Frage ({pos + 1}/{total || (ov?.totalQuestions ?? 0)})
                      </div>

                      <div className="quizplay-qselect-list">
                        {ov.items.map((it) => {
                          const st = statusFor(it);
                          const isActive = it.position === pos;
                          const iconName = st === "correct" ? "check_circle" : st === "wrong" ? "cancel" : null;

                          return (
                            <button
                              key={it.position}
                              type="button"
                              className={["quizplay-qselect-item", `is-${st}`, isActive ? "is-active" : ""]
                                .filter(Boolean)
                                .join(" ")}
                              onClick={() => goToPos(it.position)}
                            >
                              <span>Frage {it.position + 1}</span>

                              {iconName && (
                                <span
                                  className={[
                                    "material-symbols-outlined",
                                    "quizplay-qselect-statusicon",
                                    st === "correct" ? "correct" : "wrong",
                                  ].join(" ")}
                                >
                                  {iconName}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ✅ Scorecard NICHT im Review (wie du willst: gleiche Quiz-UI? -> im Review eher weglassen)
              Wenn du sie doch willst: einfach wieder einkommentieren und Score aus Result laden. */}
        </div>

        {loading && <div className="quizplay-info">Lade...</div>}
        {!loading && error && <div className="quizplay-error">{error}</div>}

        {!loading && !error && q && (
          <div className="quizplay-card">
            {/* ✅ Frage wie Quiz.jsx */}
            <div className="quizplay-question">{q.question}</div>

            {/* ✅ Options: gleiche Klassen + Icons + Farben */}
            <div className="quizplay-options">
              {(q.options || []).map((opt, idx) => {
                const isSelected = selectedIndex === idx;

                const isCorrectAnswer = result?.correctIndex === idx;
                const showCorrect = !!result && isCorrectAnswer;
                const showWrong = !!result && isSelected && !result.correct;
                const iconName = showCorrect ? "check_circle" : showWrong ? "cancel" : null;

                const cls = [
                  "quizplay-option",
                  isSelected ? "is-selected" : "",
                  showCorrect ? "is-correct" : "",
                  showWrong ? "is-wrong" : "",
                ]
                  .filter(Boolean)
                  .join(" ");

                return (
                  <button key={idx} className={cls} disabled>
                    <span className="quizplay-option-text">{opt}</span>

                    {iconName && (
                      <span
                        className={[
                          "material-symbols-outlined",
                          "quizplay-option-icon",
                          showCorrect ? "correct" : "wrong",
                        ].join(" ")}
                      >
                        {iconName}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* ✅ Feedback wie Quiz.jsx */}
            {result && (
              <div className={["quizplay-feedback", result.correct ? "is-correct" : "is-wrong"].join(" ")}>
                <div className="quizplay-feedback-title">
                  <span className="quizplay-feedback-titletext">{result.correct ? "Richtig" : "Falsch"}</span>
                  <span
                    className={[
                      "material-symbols-outlined",
                      "quizplay-feedback-icon",
                      result.correct ? "correct" : "wrong",
                    ].join(" ")}
                  >
                    {result.correct ? "check_circle" : "cancel"}
                  </span>
                </div>

                {result.explanation && <div className="quizplay-feedback-text">{result.explanation}</div>}
              </div>
            )}

            {/* ✅ Navigation unten: links Icons, rechts Zurück */}
            <div style={{ display: "flex", alignItems: "center", marginTop: 22 }}>
              <div style={{ display: "flex", gap: 22 }}>
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontSize: 42,
                    cursor: pos <= 0 ? "default" : "pointer",
                    opacity: pos <= 0 ? 0.35 : 1,
                  }}
                  onClick={() => pos > 0 && goToPos(pos - 1)}
                >
                  arrow_circle_left
                </span>

                <span
                  className="material-symbols-outlined"
                  style={{
                    fontSize: 42,
                    cursor: total <= 0 || pos >= total - 1 ? "default" : "pointer",
                    opacity: total <= 0 || pos >= total - 1 ? 0.35 : 1,
                  }}
                  onClick={() => total > 0 && pos < total - 1 && goToPos(pos + 1)}
                >
                  arrow_circle_right
                </span>
              </div>

              <div style={{ marginLeft: "auto" }}>
                <button
                  className="quizplay-next btn-shine"
                  onClick={() => navigate(`/anwender/quiz/result/${attemptId}`)}
                >
                  Zurück
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AnwenderLayout>
  );
};

export default QuizReview;