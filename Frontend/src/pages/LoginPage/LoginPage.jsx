import React, { useState } from "react";
import "../../styles/LoginPage.css";
import { useNavigate } from "react-router-dom";
import Logo from "../../assets/Logo.png";

function LoginPage() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Feldfehler wie bei BenutzerAnlegen
  const [fieldErrors, setFieldErrors] = useState({});

  // globale Fehlermeldung (z.B. ungültige Anmeldedaten)
  const [loginError, setLoginError] = useState("");

  const validateForm = () => {
    const errors = {};

    // ===================================================
    //                 E-MAIL VALIDIERUNG (wie BenutzerAnlegen)
    // ===================================================
    if (!email || email.trim() === "") {
      errors.email = "E-Mail darf nicht leer sein.";
    } else if (!email.includes("@")) {
      errors.email = "E-Mail muss ein @ enthalten.";
    } else {
      const emailParts = email.split("@");
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
    //                PASSWORT-VALIDIERUNG (wie BenutzerAnlegen: eine kombinierte Meldung)
    // ===================================================
    const pw = password || "";
    const pwLengthOk = pw.length >= 8;
    const pwUpperOk = /[A-Z]/.test(pw);
    const pwDigitOk = /[0-9]/.test(pw);
    const pwSpecialOk = /[!@#$%&*]/.test(pw);

    if (!(pwLengthOk && pwUpperOk && pwDigitOk && pwSpecialOk)) {
      errors.password =
        "Das Passwort muss mindestens 8 Zeichen lang sein und jeweils mindestens einen Großbuchstaben, eine Zahl sowie ein Sonderzeichen enthalten.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setLoginError("");

    // Validierung erst beim Klick auf "Anmelden"
    const ok = validateForm();
    if (!ok) return;

    try {
      const API_BASE = import.meta.env.VITE_API_BASE_URL;

      if (!API_BASE) {
        setLoginError(
          "Konfigurationsfehler: VITE_API_BASE_URL ist nicht gesetzt."
        );
        return;
      }

      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setLoginError(data.error || "Ungültige Anmeldedaten.");
        return;
      }

      localStorage.setItem("authToken", data.token);
      localStorage.setItem("role", data.role);
      localStorage.setItem("authUserId", data.authUserId);

      if (data.role === "Administrator") {
        navigate("/administrator/dashboard");
      } else if (data.role === "Quiz-Entwickler") {
        navigate("/entwickler/dashboard");
      } else if (data.role === "Anwender") {
        navigate("/anwender/dashboard");
      } else {
        setLoginError("Benutzerrolle ungültig.");
      }
    } catch {
      setLoginError("Serverfehler. Bitte später erneut versuchen.");
    }
  }

  return (
    <div className="login-page">
      {/* HEADER */}
      <header className="header">
        <div className="app-title">
          <img src={Logo} alt="QuizApp Logo" className="app-logo" />
          <span>QuizApp</span>
        </div>
      </header>

      {/* CONTENT */}
      <div className="login-container">
        <div className="login-box">
          <p className="subtitle">
            Übe deine Vorlesungsinhalte mit interaktiven
            <br />
            Quizfragen.
          </p>

          <form onSubmit={handleSubmit} noValidate>
            {/* ✅ globale Login-Fehler im gleichen Stil wie BenutzerAnlegen */}
            {loginError && <div className="login-errorbox">{loginError}</div>}

            {/* EMAIL */}
            <div className="input-group">
              <input
                type="email"
                placeholder="E-Mail"
                value={email}
                onChange={(e) => {
                  const val = e.target.value;
                  setEmail(val);

                  // Prinzip wie BenutzerAnlegen: Fehler löschen sobald man tippt
                  if (fieldErrors.email) {
                    setFieldErrors((prev) => ({ ...prev, email: "" }));
                  }
                }}
              />
              {fieldErrors.email && (
                <p className="login-field-error">{fieldErrors.email}</p>
              )}
            </div>

            {/* PASSWORT */}
            <div className="input-group">
              <div className="password-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Passwort"
                  value={password}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPassword(val);

                    // Prinzip wie BenutzerAnlegen: Fehler löschen sobald man tippt
                    if (fieldErrors.password) {
                      setFieldErrors((prev) => ({ ...prev, password: "" }));
                    }
                  }}
                />

                <span
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setShowPassword((prev) => !prev);
                    }
                  }}
                >
                  <span className="material-symbols-outlined">
                    {showPassword ? "visibility" : "visibility_off"}
                  </span>
                </span>
              </div>

              {fieldErrors.password && (
                <p className="login-field-error">{fieldErrors.password}</p>
              )}
            </div>

            <button type="submit" className="login-button">
              Anmelden
            </button>
          </form>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="footer">
        <p>© 2026 QuizApp</p>
      </footer>
    </div>
  );
}

export default LoginPage;