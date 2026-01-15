import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import EntwicklerLayout from "../../layout/EntwicklerLayout";
import "../../styles/NeuesQuiz.css";

const NeuesQuiz = () => {
  const API_BASE = import.meta.env.VITE_API_BASE_URL; // Die API_BASE URL aus der Umgebungsdatei
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [quiz, setQuiz] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // ✅ Erfolgs-UI
  const [saveSuccess, setSaveSuccess] = useState(false);

  const openFilePicker = () => fileInputRef.current?.click();

  const setPdfFile = (selected) => {
    if (selected && selected.type === "application/pdf") {
      setFile(selected);
      setError("");
      return true;
    }
    setError("Wählen Sie bitte eine gültige PDF-Datei aus.");
    return false;
  };

  const handleFileSelect = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setPdfFile(selected);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const dropped = e.dataTransfer.files?.[0];
    if (!dropped) return;
    setPdfFile(dropped);
  };

  const clearFile = () => {
    setFile(null);
    setQuiz(null);
    setError("");
    setSaveSuccess(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const generateQuestions = async () => {
    if (!file || isGenerating) return;

    setIsGenerating(true);
    setError("");
    setQuiz(null);
    setSaveSuccess(false);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("https://bw13.app.n8n.cloud/webhook/quiz-generate", {
        // Webhook bleibt unverändert
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        throw new Error(msg || `HTTP ${res.status}`);
      }

      const raw = await res.json();
      const data = Array.isArray(raw) ? raw[0] : raw;

      const normalized = {
        title: data?.title ?? file?.name ?? "Neues Quiz",
        published: Boolean(data?.published ?? data?.isPublished ?? false),
        questions: (data?.questions ?? []).map((q) => ({
          question: q?.question ?? "",
          options: Array.isArray(q?.options) ? [...q.options, "", "", "", ""].slice(0, 4) : ["", "", "", ""],
          correctIndex: Number.isInteger(q?.correctIndex) ? q.correctIndex : 0,
          explanation: q?.explanation ?? "",
        })),
      };

      if (!normalized.questions.length) {
        throw new Error("Es wurden keine Fragen zurückgegeben (questions ist leer).");
      }

      setQuiz(normalized);
    } catch (err) {
      setError(`Fehler beim Generieren: ${err?.message || "Failed to fetch"}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const validateQuiz = () => {
    if (!quiz) return false;

    if (!quiz.title || quiz.title.trim() === "") {
      setError("Geben Sie bitte einen Quiz-Titel an.");
      return false;
    }

    if (!quiz.questions || quiz.questions.length === 0) {
      setError("Es wurden keine Fragen generiert.");
      return false;
    }

    for (let i = 0; i < quiz.questions.length; i++) {
      const q = quiz.questions[i];

      if (!q.question || q.question.trim() === "") {
        setError(`Frage ${i + 1}: Die Frage darf nicht leer sein.`);
        return false;
      }

      if (!Array.isArray(q.options) || q.options.length !== 4) {
        setError(`Frage ${i + 1}: Es müssen genau 4 Antwortoptionen vorhanden sein.`);
        return false;
      }

      for (let j = 0; j < 4; j++) {
        if (!q.options[j] || q.options[j].trim() === "") {
          setError(`Frage ${i + 1}: Antwort ${String.fromCharCode(65 + j)} darf nicht leer sein.`);
          return false;
        }
      }

      if (!(q.correctIndex >= 0 && q.correctIndex <= 3)) {
        setError(`Frage ${i + 1}: Bitte eine richtige Antwort auswählen.`);
        return false;
      }

      if (!q.explanation || q.explanation.trim() === "") {
        setError(`Frage ${i + 1}: Geben Sie bitte eine Erklärung an.`);
        return false;
      }
    }

    setError("");
    return true;
  };

  const updateQuizTitle = (value) => setQuiz((prev) => ({ ...prev, title: value }));
  const updatePublished = (value) => setQuiz((prev) => ({ ...prev, published: value }));

  const updateQuestionText = (qIndex, value) => {
    setQuiz((prev) => {
      const next = { ...prev };
      next.questions = [...next.questions];
      next.questions[qIndex] = { ...next.questions[qIndex], question: value };
      return next;
    });
  };

  const updateOptionText = (qIndex, optIndex, value) => {
    setQuiz((prev) => {
      const next = { ...prev };
      next.questions = [...next.questions];
      const q = { ...next.questions[qIndex] };
      const options = [...(q.options || ["", "", "", ""])];
      options[optIndex] = value;
      q.options = options;
      next.questions[qIndex] = q;
      return next;
    });
  };

  const updateExplanation = (qIndex, value) => {
    setQuiz((prev) => {
      const next = { ...prev };
      next.questions = [...next.questions];
      next.questions[qIndex] = { ...next.questions[qIndex], explanation: value };
      return next;
    });
  };

  // ✅ NEU: correctIndex wie bei "Quizzes verwalten" per Klick setzen
  const updateCorrectIndex = (qIndex, optIndex) => {
    setQuiz((prev) => {
      const next = { ...prev };
      next.questions = [...next.questions];
      next.questions[qIndex] = { ...next.questions[qIndex], correctIndex: optIndex };
      return next;
    });
  };

  const removeQuestion = (qIndex) => {
    setQuiz((prev) => {
      const next = { ...prev };
      next.questions = next.questions.filter((_, i) => i !== qIndex);
      return next;
    });
  };

  const readBodyOnce = async (response) => {
    const raw = await response.text();
    try {
      return { raw, json: raw ? JSON.parse(raw) : null };
    } catch {
      return { raw, json: null };
    }
  };

  const handleSave = async () => {
    if (isSaving) return;
    if (!validateQuiz()) return;

    const ownerUserId = localStorage.getItem("authUserId");
    if (!ownerUserId) {
      setError("Kein eingeloggter User gefunden (authUserId fehlt).");
      return;
    }

    const authToken = localStorage.getItem("authToken");
    if (!authToken) {
      setError("Nicht eingeloggt (authToken fehlt). Bitte neu einloggen.");
      return;
    }

    const payload = {
      ownerUserId,
      title: quiz.title,
      isPublished: Boolean(quiz.published),
      questions: quiz.questions.map((q) => ({
        question: q.question,
        optionA: q.options[0],
        optionB: q.options[1],
        optionC: q.options[2],
        optionD: q.options[3],
        correctIndex: q.correctIndex,
        explanation: q.explanation,
      })),
    };

    try {
      setIsSaving(true);
      setError("");

      const res = await fetch(`${API_BASE}/api/quizzes`, {
        method: "POST",
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

      setSaveSuccess(true);
    } catch (err) {
      setError(`Fehler beim Speichern: ${err?.message || "Failed to fetch"}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <EntwicklerLayout>
      {saveSuccess ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
            zIndex: 50,
            padding: "0 1rem",
          }}
        >
          <div
            className="quiz-success-card"
            style={{
              pointerEvents: "auto",
              maxWidth: 560,
              width: "min(560px, 92vw)",
            }}
          >
            <div
              className="quiz-success-row"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.7rem",
                width: "100%",
                flexWrap: "wrap",
              }}
            >
              <span className="material-symbols-outlined quiz-success-icon" style={{ flex: "0 0 auto" }}>
                check_circle
              </span>

              <span
                className="quiz-success-text"
                style={{
                  flex: "0 1 auto",
                  textAlign: "center",
                  lineHeight: 1.25,
                  maxWidth: "100%",
                  wordBreak: "normal",
                  overflowWrap: "anywhere",
                }}
              >
                Quiz erfolgreich gespeichert
              </span>
            </div>

            <button
              type="button"
              className="generate-btn"
              onClick={() => navigate("/entwickler/quizzes-verwalten")}
              style={{ marginTop: "1.4rem" }}
            >
              Quizzes verwalten
            </button>
          </div>
        </div>
      ) : (
        <div className="neuesquiz-main-wrapper">
          <h2 className="neuesquiz-title">Neues Quiz erstellen</h2>

          <div className="neuesquiz-card">
            <div
              className={`upload-dropzone ${isDragging ? "dragging" : ""}`}
              onClick={openFilePicker}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") openFilePicker();
              }}
            >
              <div className="upload-inner">
                <div className="upload-icon">
                  <span className="material-symbols-outlined">upload</span>
                </div>

                <div className="upload-title">Vorlesungsmaterialien hochladen</div>

                <div className="upload-subtitle">
                  Per Drag-and-drop hochladen oder{" "}
                  <span
                    className="upload-link"
                    onClick={(e) => {
                      e.stopPropagation();
                      openFilePicker();
                    }}
                  >
                    Datei auswählen
                  </span>
                </div>

                <div className="upload-hint">Unterstützte Dateitypen: PDF</div>

                <input
                  ref={fileInputRef}
                  className="upload-input"
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileSelect}
                />

                {file && (
                  <div className="file-pill" onClick={(e) => e.stopPropagation()}>
                    <div className="file-left">
                      <span className="material-symbols-outlined file-icon">description</span>
                      <span className="file-name" title={file.name}>
                        {file.name}
                      </span>
                    </div>

                    <button type="button" className="file-remove" onClick={clearFile}>
                      Entfernen
                    </button>
                  </div>
                )}
              </div>
            </div>

            {!quiz && !isGenerating && (
              <button type="button" className="generate-btn" disabled={!file} onClick={generateQuestions}>
                Fragen generieren
              </button>
            )}

            {isGenerating && (
              <div className="loading-row">
                <span className="loading-text">Fragen werden generiert</span>
                <div className="loading-spinner" />
              </div>
            )}

            {!quiz && error && <div className="status error">{error}</div>}

            {quiz && (
              <div className="quiz-result">
                <div className="quiz-meta">
                  <label className="field-label">Quiz-Titel</label>
                  <input className="field-input" value={quiz.title} onChange={(e) => updateQuizTitle(e.target.value)} />
                </div>

                <div className="quiz-questions">
                  {quiz.questions.map((q, qIndex) => (
                    <div key={qIndex} className="quiz-question-card">
                      <div className="q-head">
                        <div className="q-head-row">
                          <div className="q-index">Frage {qIndex + 1}</div>
                          <button type="button" className="q-remove" onClick={() => removeQuestion(qIndex)}>
                            Entfernen
                          </button>
                        </div>

                        <label className="field-label">Frage</label>
                        <textarea
                          className="field-textarea"
                          value={q.question}
                          rows={3}
                          onChange={(e) => updateQuestionText(qIndex, e.target.value)}
                        />
                      </div>

                      <div className="options-label">Antworten</div>

                      <div className="q-options">
                        {q.options.map((opt, optIndex) => {
                          const isCorrect = q.correctIndex === optIndex;
                          const letter = String.fromCharCode(65 + optIndex);

                          return (
                            <div
                              key={optIndex}
                              role="button"
                              tabIndex={0}
                              className={`q-option q-option-colored ${isCorrect ? "is-correct" : "is-wrong"}`}
                              onClick={() => updateCorrectIndex(qIndex, optIndex)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ")
                                  updateCorrectIndex(qIndex, optIndex);
                              }}
                            >
                              <div className="q-option-left">
                                <div className="q-option-letter">{letter})</div>

                                <input
                                  className="opt-input"
                                  value={opt}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) => updateOptionText(qIndex, optIndex, e.target.value)}
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
                          value={q.explanation}
                          rows={3}
                          onChange={(e) => updateExplanation(qIndex, e.target.value)}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="quiz-meta" style={{ marginTop: "1.1rem" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "1.4rem",
                    }}
                  >
                    <label
                      className="field-label"
                      style={{
                        marginBottom: 0,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={quiz.published === true}
                        onChange={() => updatePublished(true)}
                        style={{ marginRight: "0.6rem", cursor: "pointer" }}
                      />
                      Quiz veröffentlichen
                    </label>

                    <label
                      className="field-label"
                      style={{
                        marginBottom: 0,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={quiz.published === false}
                        onChange={() => updatePublished(false)}
                        style={{ marginRight: "0.6rem", cursor: "pointer" }}
                      />
                      Quiz nicht veröffentlichen
                    </label>
                  </div>
                </div>

                {error && <div className="status error">{error}</div>}

                <button
                  type="button"
                  className="generate-btn"
                  style={{ marginTop: "1.4rem" }}
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? "Speichern..." : "Speichern"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </EntwicklerLayout>
  );
};

export default NeuesQuiz;