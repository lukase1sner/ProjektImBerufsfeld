import React, { useEffect, useState } from "react";
import EntwicklerLayout from "../../layout/EntwicklerLayout";
import "../../styles/QuizzesVerwalten.css";

const API_BASE = "http://localhost:8080/api";

const QuizzesVerwalten = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState("");

  const [selectedId, setSelectedId] = useState(null);

  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [quizDetail, setQuizDetail] = useState(null);

  const [isSaving, setIsSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [saveType, setSaveType] = useState(""); // "success" | "error" | ""

  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // ✅ Mobile flow
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1100);
  const [mobileView, setMobileView] = useState("list"); // "list" | "detail"

  // ✅ helper: Response-Body nur 1x lesen (verhindert "body stream already read")
  const readBodyOnce = async (response) => {
    const raw = await response.text().catch(() => "");
    try {
      return { raw, json: raw ? JSON.parse(raw) : null };
    } catch {
      return { raw, json: null };
    }
  };

  const getAuthTokenOrThrow = () => {
    const token = localStorage.getItem("authToken"); // <- falls bei dir anders, hier ändern
    if (!token) throw new Error("Missing Bearer token (authToken fehlt). Bitte neu einloggen.");
    return token;
  };

  const loadQuizzes = async () => {
    setListLoading(true);
    setListError("");
    setSaveMsg("");
    setSaveType("");

    try {
      const authToken = getAuthTokenOrThrow();

      const res = await fetch(`${API_BASE}/quizzes`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      const { raw, json } = await readBodyOnce(res);

      if (!res.ok) {
        const msg = json?.error || json?.message || raw || `HTTP ${res.status}`;
        throw new Error(msg);
      }

      const data = json;
      const normalizedList = (Array.isArray(data) ? data : []).map((q) => ({
        id: q.id,
        title: q.title ?? "",
        isPublished: Boolean(q.isPublished ?? q.published ?? q.is_published ?? false),
      }));

      setQuizzes(normalizedList);

      // Desktop: erstes Quiz auto auswählen
      setSelectedId((prev) => {
        if (!normalizedList.length) return null;
        if (prev && normalizedList.some((x) => x.id === prev)) return prev;
        return normalizedList[0].id;
      });

      if (!normalizedList.length) setQuizDetail(null);
    } catch (e) {
      setListError(`Fehler beim Laden der Quizzes: ${e?.message || "Failed to fetch"}`);
    } finally {
      setListLoading(false);
    }
  };

  const loadQuizDetail = async (quizId) => {
    if (!quizId) return;

    setDetailLoading(true);
    setDetailError("");
    setSaveMsg("");
    setSaveType("");

    try {
      const authToken = getAuthTokenOrThrow();

      const res = await fetch(`${API_BASE}/quizzes/${quizId}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      const { raw, json } = await readBodyOnce(res);

      if (!res.ok) {
        const msg = json?.error || json?.message || raw || `HTTP ${res.status}`;
        throw new Error(msg);
      }

      const data = json;

      const normalized = {
        id: data.id,
        title: data.title ?? "",
        isPublished: Boolean(data.isPublished ?? data.published ?? data.is_published ?? false),
        questions: Array.isArray(data.questions)
          ? data.questions
              .slice()
              .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
              .map((q) => ({
                id: q.id,
                position: q.position ?? 0,
                question: q.question ?? "",
                optionA: q.optionA ?? q.option_a ?? "",
                optionB: q.optionB ?? q.option_b ?? "",
                optionC: q.optionC ?? q.option_c ?? "",
                optionD: q.optionD ?? q.option_d ?? "",
                correctIndex: Number.isInteger(q.correctIndex)
                  ? q.correctIndex
                  : Number.isInteger(q.correct_index)
                  ? q.correct_index
                  : 0,
                explanation: q.explanation ?? "",
              }))
          : [],
      };

      setQuizDetail(normalized);
    } catch (e) {
      setDetailError(`Fehler beim Laden des Quiz: ${e?.message || "Failed to fetch"}`);
      setQuizDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    loadQuizzes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedId) loadQuizDetail(selectedId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  useEffect(() => {
    const onResize = () => {
      const mobileNow = window.innerWidth <= 1100;
      setIsMobile(mobileNow);

      if (!mobileNow) {
        setMobileView("list"); // Desktop zeigt eh beide
      } else {
        if (!selectedId) setMobileView("list");
      }
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [selectedId]);

  // ---------------------------
  // Edit helpers
  // ---------------------------
  const updateTitle = (value) => setQuizDetail((prev) => (prev ? { ...prev, title: value } : prev));
  const setPublished = (value) => setQuizDetail((prev) => (prev ? { ...prev, isPublished: value } : prev));

  const updateQuestionField = (qIndex, field, value) => {
    setQuizDetail((prev) => {
      if (!prev) return prev;
      const next = { ...prev };
      next.questions = [...next.questions];
      next.questions[qIndex] = { ...next.questions[qIndex], [field]: value };
      return next;
    });
  };

  const removeQuestion = (qIndex) => {
    setQuizDetail((prev) => {
      if (!prev) return prev;
      const next = { ...prev };
      next.questions = prev.questions
        .filter((_, i) => i !== qIndex)
        .map((q, idx) => ({ ...q, position: idx }));
      return next;
    });
  };

  // ---------------------------
  // Save
  // ---------------------------
  const saveChanges = async () => {
    if (!quizDetail || isSaving) return;

    if (!quizDetail.title.trim()) {
      setSaveType("error");
      setSaveMsg("Bitte einen Titel angeben.");
      return;
    }

    for (let i = 0; i < quizDetail.questions.length; i++) {
      const q = quizDetail.questions[i];
      if (!q.question.trim())
        return (setSaveType("error"), setSaveMsg(`Frage ${i + 1}: Frage darf nicht leer sein.`));
      if (!q.optionA.trim() || !q.optionB.trim() || !q.optionC.trim() || !q.optionD.trim())
        return (setSaveType("error"), setSaveMsg(`Frage ${i + 1}: Alle 4 Antworten müssen gefüllt sein.`));
      if (!(q.correctIndex >= 0 && q.correctIndex <= 3))
        return (setSaveType("error"), setSaveMsg(`Frage ${i + 1}: correctIndex muss 0-3 sein.`));
      if (!q.explanation.trim())
        return (setSaveType("error"), setSaveMsg(`Frage ${i + 1}: Erklärung darf nicht leer sein.`));
    }

    const payload = {
      title: quizDetail.title,
      isPublished: Boolean(quizDetail.isPublished),
      questions: quizDetail.questions.map((q, idx) => ({
        id: q.id,
        position: idx,
        question: q.question,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
        correctIndex: q.correctIndex,
        explanation: q.explanation,
      })),
    };

    try {
      const authToken = getAuthTokenOrThrow();

      setIsSaving(true);
      setSaveMsg("");
      setSaveType("");

      const res = await fetch(`${API_BASE}/quizzes/${quizDetail.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload),
      });

      const { raw, json } = await readBodyOnce(res);

      if (!res.ok) {
        const msg = json?.error || json?.message || raw || `HTTP ${res.status}`;
        throw new Error(msg);
      }

      setSaveType("success");
      setSaveMsg("Änderungen gespeichert");

      await loadQuizzes();
      await loadQuizDetail(quizDetail.id);
    } catch (e) {
      setSaveType("error");
      setSaveMsg(`Fehler beim Speichern: ${e?.message || "Failed to fetch"}`);
    } finally {
      setIsSaving(false);
    }
  };

  // ---------------------------
  // Delete
  // ---------------------------
  const openDeleteModal = () => {
    if (!quizDetail || isDeleting) return;
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => setShowDeleteModal(false);

  const confirmDeleteQuiz = async () => {
    if (!quizDetail || isDeleting) return;

    try {
      const authToken = getAuthTokenOrThrow();

      setIsDeleting(true);
      setSaveMsg("");
      setSaveType("");

      const res = await fetch(`${API_BASE}/quizzes/${quizDetail.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      const { raw, json } = await readBodyOnce(res);

      if (!res.ok) {
        const msg = json?.error || json?.message || raw || `HTTP ${res.status}`;
        throw new Error(msg);
      }

      setSaveType("success");
      setSaveMsg("Quiz gelöscht");
      setQuizDetail(null);

      closeDeleteModal();
      await loadQuizzes();

      if (isMobile) setMobileView("list");
    } catch (e) {
      setSaveType("error");
      setSaveMsg(`Fehler beim Löschen: ${e?.message || "Failed to fetch"}`);
      closeDeleteModal();
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSelectQuiz = (id) => {
    setSelectedId(id);
    if (isMobile) setMobileView("detail");
  };

  const showList = !isMobile || mobileView === "list";
  const showDetail = !isMobile || mobileView === "detail";

  return (
    <EntwicklerLayout>
      <div className={`qv-wrapper ${isMobile ? "qv-mobile" : ""} qv-view-${mobileView}`}>
        <h2 className="qv-title">Quizzes verwalten</h2>

        <div className="qv-grid">
          {showList && (
            <div className="qv-list-card">
              <div className="qv-list-head">
                <div className="qv-list-head-left">
                  <span className="material-symbols-outlined">cards_stack</span>
                  <span className="qv-list-head-title">Alle verfügbaren Quizzes</span>
                </div>

                <button
                  className="qv-refresh"
                  type="button"
                  onClick={loadQuizzes}
                  disabled={listLoading}
                  title="Neu laden"
                >
                  <span className="material-symbols-outlined">refresh</span>
                </button>
              </div>

              {listLoading && <div className="qv-muted">Lade Quizzes…</div>}
              {listError && <div className="qv-error">{listError}</div>}

              {!listLoading && !listError && quizzes.length === 0 && (
                <div className="qv-muted">Noch keine Quizzes vorhanden.</div>
              )}

              <div className="qv-list">
                {quizzes.map((q) => (
                  <button
                    key={q.id}
                    type="button"
                    className={`qv-item ${selectedId === q.id ? "active" : ""}`}
                    onClick={() => handleSelectQuiz(q.id)}
                  >
                    <div className="qv-item-main">
                      <div className="qv-item-title">{q.title}</div>
                      <div className="qv-item-sub">
                        {q.isPublished ? (
                          <span className="qv-badge published">Veröffentlicht</span>
                        ) : (
                          <span className="qv-badge draft">Privat</span>
                        )}
                      </div>
                    </div>

                    <span className="material-symbols-outlined qv-item-arrow">chevron_right</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {showDetail && (
            <div className="qv-detail-card">
              {!selectedId && <div className="qv-muted">Wähle links ein Quiz aus.</div>}

              {selectedId && detailLoading && <div className="qv-muted">Lade Quiz…</div>}
              {selectedId && detailError && <div className="qv-error">{detailError}</div>}

              {selectedId && !detailLoading && quizDetail && (
                <div className="qv-detail-inner">
                  {isMobile && (
                    <button type="button" className="qv-back-btn" onClick={() => setMobileView("list")}>
                      <span className="material-symbols-outlined">arrow_back</span>
                      Zurück
                    </button>
                  )}

                  <div className="qv-section-title" style={{ marginTop: isMobile ? "0.9rem" : 0 }}>
                    <span className="material-symbols-outlined">edit</span>
                    Quiz-Titel anpassen
                  </div>

                  <input className="qv-input" value={quizDetail.title} onChange={(e) => updateTitle(e.target.value)} />

                  {saveMsg && <div className={saveType === "success" ? "qv-success" : "qv-error"}>{saveMsg}</div>}

                  <div className="qv-section-title">
                    <span className="material-symbols-outlined">edit</span>
                    Fragen bearbeiten
                  </div>

                  <div className="qv-questions">
                    {quizDetail.questions.map((q, idx) => {
                      const options = [
                        { key: "optionA", letter: "A", value: q.optionA },
                        { key: "optionB", letter: "B", value: q.optionB },
                        { key: "optionC", letter: "C", value: q.optionC },
                        { key: "optionD", letter: "D", value: q.optionD },
                      ];

                      return (
                        <div className="quiz-question-card" key={q.id ?? idx}>
                          <div className="q-head">
                            <div className="q-head-row">
                              <div className="q-index">Frage {idx + 1}</div>
                              <button type="button" className="q-remove" onClick={() => removeQuestion(idx)}>
                                Entfernen
                              </button>
                            </div>

                            <label className="field-label">Frage</label>
                            <textarea
                              className="field-textarea"
                              rows={3}
                              value={q.question}
                              onChange={(e) => updateQuestionField(idx, "question", e.target.value)}
                            />
                          </div>

                          <div className="options-label">Antworten</div>

                          <div className="q-options">
                            {options.map((opt, optIndex) => {
                              const isCorrect = q.correctIndex === optIndex;

                              return (
                                <div
                                  key={opt.key}
                                  role="button"
                                  tabIndex={0}
                                  className={`q-option q-option-colored ${isCorrect ? "is-correct" : "is-wrong"}`}
                                  onClick={() => updateQuestionField(idx, "correctIndex", optIndex)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ")
                                      updateQuestionField(idx, "correctIndex", optIndex);
                                  }}
                                >
                                  <div className="q-option-left">
                                    <div className="q-option-letter">{opt.letter})</div>

                                    <input
                                      className="opt-input"
                                      value={opt.value}
                                      onClick={(e) => e.stopPropagation()}
                                      onChange={(e) => updateQuestionField(idx, opt.key, e.target.value)}
                                    />
                                  </div>

                                  <span
                                    className={`material-symbols-outlined q-option-icon ${isCorrect ? "correct" : "wrong"}`}
                                  >
                                    {isCorrect ? "check_circle" : "cancel"}
                                  </span>
                                </div>
                              );
                            })}
                          </div>

                          <div style={{ marginTop: "0.9rem" }}>
                            <label className="field-label">Erklärung</label>
                            <textarea
                              className="field-textarea"
                              rows={3}
                              value={q.explanation}
                              onChange={(e) => updateQuestionField(idx, "explanation", e.target.value)}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="qv-publish-row">
                    <label className="qv-publish-option">
                      <input
                        type="checkbox"
                        checked={quizDetail.isPublished === true}
                        onChange={() => setPublished(true)}
                      />
                      Quiz veröffentlichen
                    </label>

                    <label className="qv-publish-option">
                      <input
                        type="checkbox"
                        checked={quizDetail.isPublished === false}
                        onChange={() => setPublished(false)}
                      />
                      Quiz privat halten
                    </label>
                  </div>

                  <div className="qv-bottom-actions">
                    <button
                      type="button"
                      className="qv-btn qv-btn-primary"
                      onClick={saveChanges}
                      disabled={isSaving || !quizDetail}
                    >
                      <span className="material-symbols-outlined">save</span>
                      {isSaving ? "Speichern…" : "Änderungen speichern"}
                    </button>

                    <button
                      type="button"
                      className="qv-btn qv-btn-danger"
                      onClick={openDeleteModal}
                      disabled={isDeleting || !quizDetail}
                    >
                      <span className="material-symbols-outlined">delete</span>
                      {isDeleting ? "Löschen…" : "Quiz löschen"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showDeleteModal && (
        <div className="qv-modal-overlay" onClick={closeDeleteModal}>
          <div className="qv-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="qv-modal-title qv-center">Quiz löschen?</h3>
            <p className="qv-modal-text qv-center">
              Möchten Sie dieses Quiz wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
            </p>

            <div className="qv-modal-actions">
              <button className="qv-modalbtn cancel btn-shine" onClick={closeDeleteModal} type="button">
                Abbrechen
              </button>
              <button
                className="qv-modalbtn danger btn-shine"
                onClick={confirmDeleteQuiz}
                type="button"
                disabled={isDeleting}
              >
                {isDeleting ? "Löschen…" : "Löschen"}
              </button>
            </div>
          </div>
        </div>
      )}
    </EntwicklerLayout>
  );
};

export default QuizzesVerwalten;