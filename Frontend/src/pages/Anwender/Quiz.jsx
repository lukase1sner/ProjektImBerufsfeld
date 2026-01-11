import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AnwenderLayout from "../../layout/AnwenderLayout.jsx";
import "../../styles/Quiz.css";

const API_BASE = "http://localhost:8080/api";

const Quiz = () => {
  const { quizId, attemptId: attemptIdParam } = useParams();
  const navigate = useNavigate();

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

    // Falls JSON gespeichert wurde: {"token":"..."} oder String in JSON
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

    // Quotes entfernen + whitespace/newlines entfernen
    t = t.replace(/^"+|"+$/g, "").trim();
    t = t.replace(/\s+/g, " ").trim();

    // Falls bereits "Bearer ..." gespeichert wurde -> entfernen
    if (/^bearer\s+/i.test(t)) t = t.replace(/^bearer\s+/i, "").trim();

    // letzte Sicherheit: keine Spaces mehr im JWT
    t = t.replace(/\s/g, "");

    return t || null;
  };

  const authToken = getAuthToken();
  const routeAttemptId = attemptIdParam || null;

  const [attemptId, setAttemptId] = useState(routeAttemptId);
  const [meta, setMeta] = useState({
    quizTitle: "",
    totalQuestions: 0,
    answeredQuestions: 0,
  });
  const [score, setScore] = useState(0);

  const [overview, setOverview] = useState(null);
  const [activePos, setActivePos] = useState(0);

  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedIndex, setSelectedIndex] = useState(null);
  const [result, setResult] = useState(null);

  // ✅ Cache (in-memory) + Persistenz (sessionStorage)
  const [answerCache, setAnswerCache] = useState({});

  // Dropdown
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const headers = useMemo(() => {
    return (json = false) => {
      const h = {};
      if (json) h["Content-Type"] = "application/json";
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

  // -----------------------------
  // Persist helpers (sessionStorage)
  // -----------------------------
  const cacheKey = (aId) => (aId ? `quiz_answer_cache_${aId}` : null);

  const loadCacheFromSession = (aId) => {
    try {
      const key = cacheKey(aId);
      if (!key) return {};
      const raw = sessionStorage.getItem(key);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  };

  const saveCacheToSession = (aId, nextCache) => {
    try {
      const key = cacheKey(aId);
      if (!key) return;
      sessionStorage.setItem(key, JSON.stringify(nextCache));
    } catch {
      // ignore
    }
  };

  const rememberAnswer = (pos, selIdx, resObj) => {
    setAnswerCache((prev) => {
      const next = { ...prev, [pos]: { selectedIndex: selIdx, result: resObj } };
      if (attemptId) saveCacheToSession(attemptId, next);
      return next;
    });
  };

  const throwHttpError = (res, raw, json) => {
    const msg = json?.message || raw || `HTTP ${res.status}`;
    // ✅ NICHT automatisch ausloggen/navigaten – nur Fehler anzeigen
    throw new Error(msg);
  };

  const startAttempt = async (qid) => {
    const res = await fetch(`${API_BASE}/play/attempts`, {
      method: "POST",
      headers: headers(true),
      body: JSON.stringify({ quizId: qid }),
    });
    const { raw, json } = await readBodyOnce(res);
    if (!res.ok) throwHttpError(res, raw, json);
    return json;
  };

  const loadMeta = async (aId) => {
    const res = await fetch(`${API_BASE}/play/attempts/${aId}/meta`, {
      headers: headers(false),
    });
    const { raw, json } = await readBodyOnce(res);
    if (!res.ok) throwHttpError(res, raw, json);
    return json;
  };

  const loadOverview = async (aId) => {
    const res = await fetch(`${API_BASE}/play/attempts/${aId}/overview`, {
      headers: headers(false),
    });
    const { raw, json } = await readBodyOnce(res);
    if (!res.ok) throwHttpError(res, raw, json);
    return json;
  };

  const loadQuestionByPos = async (aId, pos) => {
    const res = await fetch(`${API_BASE}/play/attempts/${aId}/question/${pos}`, {
      headers: headers(false),
    });
    const { raw, json } = await readBodyOnce(res);
    if (!res.ok) throwHttpError(res, raw, json);
    return json;
  };

  const statusFor = (it) => {
    if (!it?.answered) return "open";
    if (it.correct === true) return "correct";
    if (it.correct === false) return "wrong";
    return "open";
  };

  const getOverviewItem = (pos, ov) => (ov?.items || []).find((x) => x.position === pos);

  const isPosAnswered = (pos) => {
    if (answerCache[pos]) return true;
    const it = getOverviewItem(pos, overview);
    return Boolean(it?.answered);
  };

  // ✅ Auswertung aus Question-Response ableiten (falls Backend liefert)
  const deriveFromQuestion = (q) => {
    if (!q) return { sel: null, res: null };

    const answered = q.answered ?? q.isAnswered ?? q.alreadyAnswered ?? false;

    const sel =
      Number.isInteger(q.selectedIndex) ? q.selectedIndex
      : Number.isInteger(q.userSelectedIndex) ? q.userSelectedIndex
      : Number.isInteger(q.chosenIndex) ? q.chosenIndex
      : Number.isInteger(q.answerIndex) ? q.answerIndex
      : null;

    const correctIndex =
      Number.isInteger(q.correctIndex) ? q.correctIndex
      : Number.isInteger(q.correct_index) ? q.correct_index
      : Number.isInteger(q.solutionIndex) ? q.solutionIndex
      : null;

    const explanation = q.explanation ?? q.feedback ?? q.reason ?? "";

    const nested = q.result || q.answerResult || q.evaluation || null;
    const nestedCorrect = nested?.correct;
    const nestedCorrectIndex = Number.isInteger(nested?.correctIndex) ? nested.correctIndex : null;
    const nestedExplanation = nested?.explanation ?? null;
    const nestedScore = Number.isFinite(nested?.score) ? nested.score : null;

    if (!answered && sel === null && !nested) return { sel: null, res: null };

    const finalSel = sel ?? (Number.isInteger(nested?.selectedIndex) ? nested.selectedIndex : null);
    const finalCorrectIndex = correctIndex ?? nestedCorrectIndex;
    const finalExplanation = explanation || nestedExplanation || "";

    if (finalSel === null || finalCorrectIndex === null) return { sel: finalSel, res: null };

    const correct = typeof nestedCorrect === "boolean" ? nestedCorrect : finalSel === finalCorrectIndex;

    return {
      sel: finalSel,
      res: {
        correct,
        correctIndex: finalCorrectIndex,
        explanation: finalExplanation,
        ...(nestedScore !== null ? { score: nestedScore } : {}),
      },
    };
  };

  useEffect(() => setAttemptId(routeAttemptId), [routeAttemptId]);

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

  useEffect(() => {
    const init = async () => {
      // ✅ nur wenn wirklich kein Token vorhanden ist -> Login
      if (!authToken) {
        navigate("/");
        return;
      }

      try {
        setLoading(true);
        setError("");

        let aId = routeAttemptId;

        if (!aId && quizId) {
          const attempt = await startAttempt(quizId);
          aId = attempt.attemptId || attempt.id || attempt.attemptID;
          setAttemptId(aId);
        }

        if (!aId) throw new Error("Kein attemptId/quizId in Route.");

        const persisted = loadCacheFromSession(aId);
        setAnswerCache(persisted);

        const [m, ov] = await Promise.all([loadMeta(aId), loadOverview(aId)]);

        setMeta({
          quizTitle: m.quizTitle || "Quiz",
          totalQuestions: Number.isFinite(m.totalQuestions) ? m.totalQuestions : 0,
          answeredQuestions: Number.isFinite(m.answeredQuestions) ? m.answeredQuestions : 0,
        });
        setScore(Number.isFinite(m.score) ? m.score : 0);
        setOverview(ov);

        const total = Number.isFinite(ov?.totalQuestions) ? ov.totalQuestions : 0;
        const finished = total > 0 && ov?.answeredQuestions >= total;

        let startPos;
        if (finished) startPos = Math.max(0, total - 1);
        else startPos = (ov.items || []).find((x) => !x.answered)?.position ?? 0;

        setActivePos(startPos);

        const q = await loadQuestionByPos(aId, startPos);
        setQuestion(q);

        const cached = persisted?.[startPos];
        if (cached) {
          setSelectedIndex(cached.selectedIndex);
          setResult(cached.result);
        } else {
          const { sel, res } = deriveFromQuestion(q);
          setSelectedIndex(sel);
          setResult(res);
          if (sel !== null && res) {
            const next = { ...persisted, [startPos]: { selectedIndex: sel, result: res } };
            setAnswerCache(next);
            saveCacheToSession(aId, next);
          }
        }
      } catch (e) {
        console.error(e);
        setError(`Quiz konnte nicht geladen werden: ${e?.message || "Fehler"}`);
      } finally {
        setLoading(false);
      }
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizId, routeAttemptId, authToken, navigate]);

  const goToPos = async (pos) => {
    if (!attemptId) return;

    try {
      setLoading(true);
      setError("");

      setActivePos(pos);
      setDropdownOpen(false);

      const q = await loadQuestionByPos(attemptId, pos);
      setQuestion(q);

      const cached = answerCache[pos];
      if (cached) {
        setSelectedIndex(cached.selectedIndex);
        setResult(cached.result);
        return;
      }

      const { sel, res } = deriveFromQuestion(q);
      setSelectedIndex(sel);
      setResult(res);

      if (sel !== null && res) rememberAnswer(pos, sel, res);
    } catch (e) {
      console.error(e);
      setError(`Frage konnte nicht geladen werden: ${e?.message || "Fehler"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = async (idx) => {
    if (!attemptId || !question) return;
    if (isPosAnswered(activePos)) return;
    if (result) return;

    try {
      setError("");
      setSelectedIndex(idx);

      const res = await fetch(`${API_BASE}/play/attempts/${attemptId}/answer`, {
        method: "POST",
        headers: headers(true),
        body: JSON.stringify({
          questionId: question.questionId || question.id,
          selectedIndex: idx,
        }),
      });

      const { raw, json } = await readBodyOnce(res);
      if (!res.ok) throwHttpError(res, raw, json);

      setResult(json);
      setScore(Number.isFinite(json?.score) ? json.score : score);

      rememberAnswer(activePos, idx, json);

      const [m, ov] = await Promise.all([loadMeta(attemptId), loadOverview(attemptId)]);
      setMeta({
        quizTitle: m.quizTitle || "Quiz",
        totalQuestions: Number.isFinite(m.totalQuestions) ? m.totalQuestions : 0,
        answeredQuestions: Number.isFinite(m.answeredQuestions) ? m.answeredQuestions : 0,
      });
      setOverview(ov);
    } catch (e) {
      console.error(e);
      setError(`Antwort konnte nicht gesendet werden: ${e?.message || "Fehler"}`);
    }
  };

  const progressText =
    meta.totalQuestions > 0 ? `Frage ${activePos + 1} / ${meta.totalQuestions}` : `Frage ${activePos + 1}`;

  const isFinished = meta.totalQuestions > 0 && meta.answeredQuestions >= meta.totalQuestions;

  const handleNextClick = async () => {
    if (!attemptId) return;

    if (isFinished) {
      navigate(`/anwender/quiz/result/${attemptId}`);
      return;
    }

    try {
      setResult(null);
      setSelectedIndex(null);

      const ov = overview || (await loadOverview(attemptId));
      const nextOpen = (ov.items || []).find((x) => !x.answered)?.position;

      const nextPos = nextOpen ?? Math.min(activePos + 1, Math.max(0, (ov.totalQuestions || 1) - 1));
      await goToPos(nextPos);
    } catch (e) {
      console.error(e);
      setError(`Nächste Frage konnte nicht geladen werden: ${e?.message || "Fehler"}`);
    }
  };

  const answeredHere = isPosAnswered(activePos);
  const lockOptions = answeredHere || !!result;
  const showMissingFeedbackHint = answeredHere && !result;

  return (
    <AnwenderLayout>
      <div className="quizplay-wrapper">
        <div className="quizplay-header">
          <div className="quizplay-titleblock">
            <h2 className="quizplay-title">{meta.quizTitle || "Quiz"}</h2>

            <div className="quizplay-sub-row">
              <div className="quizplay-sub">{progressText}</div>

              {overview?.items?.length > 0 && (
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
                        Frage ({activePos + 1}/{meta.totalQuestions || (overview?.totalQuestions ?? 0)})
                      </div>

                      <div className="quizplay-qselect-list">
                        {overview.items.map((it) => {
                          const st = statusFor(it);
                          const isActive = it.position === activePos;
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

          <div className="quizplay-scorecard">
            <div className="quizplay-scorelabel">Punkte</div>
            <div className="quizplay-scorevalue">{score}</div>
          </div>
        </div>

        {loading && <div className="quizplay-info">Lade...</div>}
        {!loading && error && <div className="quizplay-error">{error}</div>}

        {!loading && !error && question && (
          <div className="quizplay-card">
            <div className="quizplay-question">{question.question}</div>
            <div className="quizplay-instruction">Wähle die richtige Antwort aus</div>

            <div className="quizplay-options">
              {(question.options || []).map((opt, idx) => {
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
                  <button key={idx} className={cls} onClick={() => handleAnswer(idx)} disabled={lockOptions}>
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

            {showMissingFeedbackHint && (
              <div className="quizplay-answeredhint">
                <div className="quizplay-answeredhint-title">
                  <span>Bereits beantwortet</span>
                  <span className="material-symbols-outlined">info</span>
                </div>
                <div className="quizplay-answeredhint-text">
                  Die Auswertung konnte nicht geladen werden (Backend liefert aktuell keine gespeicherte Auswahl/Erklärung
                  für diese Frage).
                </div>
              </div>
            )}

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

                <button className="quizplay-next btn-shine" onClick={handleNextClick}>
                  {isFinished ? "Ergebnisse anzeigen" : "Nächste Frage"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </AnwenderLayout>
  );
};

export default Quiz;