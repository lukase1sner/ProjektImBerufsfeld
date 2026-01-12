import React, { useState } from "react";
import "../../styles/BenutzerAnlegen.css";
import AdminLayout from "../../layout/AdminLayout.jsx";

const BenutzerAnlegen = () => {
  const [formData, setFormData] = useState({
    rolle: "",
    vorname: "",
    nachname: "",
    email: "",
    passwort: "",
  });

  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Fehler für dieses Feld löschen, wenn Benutzer anfängt zu tippen
    if (fieldErrors[name]) {
      setFieldErrors({ ...fieldErrors, [name]: "" });
    }
  };

  const validateForm = () => {
    const errors = {};

    // Rolle validieren
    if (!formData.rolle.trim()) {
      errors.rolle = "Rolle ist erforderlich.";
    }

    // Vorname validieren
    if (!formData.vorname.trim()) {
      errors.vorname = "Vorname ist erforderlich.";
    }

    // Nachname validieren
    if (!formData.nachname.trim()) {
      errors.nachname = "Nachname ist erforderlich.";
    }

    // ===================================================
    //                 E-MAIL VALIDIERUNG
    // ===================================================
    if (!formData.email || formData.email.trim() === "") {
      errors.email = "E-Mail darf nicht leer sein.";
    } else if (!formData.email.includes("@")) {
      errors.email = "E-Mail muss ein @ enthalten.";
    } else {
      const emailParts = formData.email.split("@");
      if (emailParts.length !== 2) {
        errors.email = "Ungültiges E-Mail-Format.";
      } else if (emailParts[0].trim() === "") {
        errors.email = "Vor dem @ muss ein Name stehen.";
      } else if (emailParts[1].trim() === "") {
        errors.email = "Nach dem @ fehlt der Domain-Name.";
      } else if (!emailParts[1].includes(".")) {
        errors.email = "Domain muss eine Endung wie .de oder .com haben.";
      } else {
        const domainSections = emailParts[1].split(".");
        const tld = domainSections[domainSections.length - 1];
        if (tld.length < 2) {
          errors.email = "Ungültige Domain-Endung.";
        }
      }
    }

    // ===================================================
    //                PASSWORT-VALIDIERUNG
    // ===================================================
    const pw = formData.passwort || "";
    const pwLengthOk = pw.length >= 8;
    const pwUpperOk = /[A-Z]/.test(pw);
    const pwDigitOk = /[0-9]/.test(pw);
    const pwSpecialOk = /[!@#$%&*]/.test(pw);

    if (!(pwLengthOk && pwUpperOk && pwDigitOk && pwSpecialOk)) {
      errors.passwort =
        "Das Passwort muss mindestens 8 Zeichen lang sein und jeweils mindestens einen Großbuchstaben, eine Zahl sowie ein Sonderzeichen enthalten.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ✅ helper: Body NUR EINMAL lesen
  const readBodyOnce = async (response) => {
    const raw = await response.text();
    try {
      return { raw, json: raw ? JSON.parse(raw) : null };
    } catch {
      return { raw, json: null };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    // Validierung durchführen
    if (!validateForm()) {
      setErrorMsg("Bitte füllen Sie alle Felder korrekt aus!");
      return;
    }

    setLoading(true);

    try {
      const API_BASE = import.meta.env.VITE_API_BASE_URL;
      if (!API_BASE) {
        throw new Error(
          "Konfigurationsfehler: VITE_API_BASE_URL ist nicht gesetzt."
        );
      }

      const authToken = localStorage.getItem("authToken");
      if (!authToken) {
        throw new Error("Nicht eingeloggt (Token fehlt). Bitte neu einloggen.");
      }

      const body = {
        // ✅ DB/Backend erwartet: "Administrator" | "Quiz-Entwickler" | "Anwender"
        role: formData.rolle,
        firstName: formData.vorname,
        lastName: formData.nachname,
        email: formData.email,
        password: formData.passwort,
      };

      const response = await fetch(`${API_BASE}/api/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // ✅ wichtig seit Security aktiv ist
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(body),
      });

      const { raw, json } = await readBodyOnce(response);

      if (!response.ok) {
        const msg =
          json?.error ||
          json?.message ||
          raw ||
          "Unbekannter Fehler beim Erstellen.";
        throw new Error(msg);
      }

      setSuccessMsg("Benutzer wurde erfolgreich angelegt!");

      // Formular zurücksetzen
      setFormData({
        rolle: "",
        vorname: "",
        nachname: "",
        email: "",
        passwort: "",
      });
      setFieldErrors({});
    } catch (error) {
      setErrorMsg(error.message);
    }

    setLoading(false);
  };

  return (
    <AdminLayout>
      <div className="benutzer-anlegen-main-wrapper">
        <h2 className="benutzer-anlegen-title">Benutzer anlegen</h2>

        {/* --- Meldungen --- */}
        {successMsg && <p className="success-message">{successMsg}</p>}

        {/* ✅ FIX: eigene Error-Box im richtigen Glass-Design */}
        {errorMsg && <div className="benutzer-anlegen-errorbox">{errorMsg}</div>}

        <form
          className="benutzer-anlegen-form"
          onSubmit={handleSubmit}
          noValidate
        >
          {/* --- Rolle --- */}
          <div className="form-group">
            <select
              name="rolle"
              value={formData.rolle}
              onChange={handleChange}
              className={`benutzer-anlegen-input ${
                fieldErrors.rolle ? "error" : ""
              }`}
              disabled={loading}
            >
              <option value="">Rolle auswählen *</option>

              {/* ✅ Werte passend zur DB-Constraint */}
              <option value="Administrator">Administrator</option>
              <option value="Quiz-Entwickler">Quiz-Entwickler</option>
              <option value="Anwender">Anwender</option>
            </select>
            {fieldErrors.rolle && (
              <p className="field-error">{fieldErrors.rolle}</p>
            )}
          </div>

          {/* --- Vorname --- */}
          <div className="form-group">
            <input
              type="text"
              name="vorname"
              placeholder="Vorname *"
              value={formData.vorname}
              onChange={handleChange}
              className={`benutzer-anlegen-input ${
                fieldErrors.vorname ? "error" : ""
              }`}
              disabled={loading}
            />
            {fieldErrors.vorname && (
              <p className="field-error">{fieldErrors.vorname}</p>
            )}
          </div>

          {/* --- Nachname --- */}
          <div className="form-group">
            <input
              type="text"
              name="nachname"
              placeholder="Nachname *"
              value={formData.nachname}
              onChange={handleChange}
              className={`benutzer-anlegen-input ${
                fieldErrors.nachname ? "error" : ""
              }`}
              disabled={loading}
            />
            {fieldErrors.nachname && (
              <p className="field-error">{fieldErrors.nachname}</p>
            )}
          </div>

          {/* --- E-Mail --- */}
          <div className="form-group">
            <input
              type="email"
              name="email"
              placeholder="E-Mail *"
              value={formData.email}
              onChange={handleChange}
              className={`benutzer-anlegen-input ${
                fieldErrors.email ? "error" : ""
              }`}
              disabled={loading}
            />
            {fieldErrors.email && (
              <p className="field-error">{fieldErrors.email}</p>
            )}
          </div>

          {/* --- Passwort --- */}
          <div className="form-group">
            <div className="password-field">
              <input
                type={showPassword ? "text" : "password"}
                name="passwort"
                placeholder="Passwort *"
                value={formData.passwort}
                onChange={handleChange}
                className={`benutzer-anlegen-input ${
                  fieldErrors.passwort ? "error" : ""
                }`}
                disabled={loading}
                aria-label="Passwort"
              />
              <span
                className="material-symbols-outlined password-toggle"
                role="button"
                aria-pressed={showPassword}
                aria-label={
                  showPassword ? "Passwort ausblenden" : "Passwort anzeigen"
                }
                onClick={() => setShowPassword((s) => !s)}
              >
                {showPassword ? "visibility" : "visibility_off"}
              </span>
            </div>
            {fieldErrors.passwort && (
              <p className="field-error">{fieldErrors.passwort}</p>
            )}
          </div>

          {/* --- Button --- */}
          <button
            type="submit"
            className="benutzer-anlegen-button"
            disabled={loading}
          >
            {loading ? "Bitte warten..." : "Anlegen"}
          </button>
        </form>
      </div>
    </AdminLayout>
  );
};

export default BenutzerAnlegen;