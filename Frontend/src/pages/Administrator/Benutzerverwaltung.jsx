import React, { useMemo, useState, useEffect, useCallback } from "react";
import "../../styles/Benutzerverwaltung.css";
import AdminLayout from "../../layout/AdminLayout.jsx";

function Benutzerverwaltung() {
  // ✅ allUsers = immer komplette Basis (ungefiltert)
  const [allUsers, setAllUsers] = useState([]);
  // ✅ users = aktuell angezeigte Liste (ggf. vom Backend gefiltert)
  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  // ✅ Draft-Filter (Eingaben im UI)
  const [draftRole, setDraftRole] = useState("ALL");
  const [draftFirstName, setDraftFirstName] = useState("");
  const [draftLastName, setDraftLastName] = useState("");

  // ✅ Applied-Filter (wirklich angewendet – nur nach Button-Klick)
  const [appliedFilters, setAppliedFilters] = useState({
    role: "ALL",
    firstName: "",
    lastName: "",
  });

  // Modals
  const [editId, setEditId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const [formData, setFormData] = useState({
    id: null,
    role: "",
    firstName: "",
    lastName: "",
    email: "",
    passwordHash: "",
  });

  const [resetPassword, setResetPassword] = useState("");
  const [showResetPassword, setShowResetPassword] = useState(false);

  // ✅ Reset-Status im Modal (statt alert)
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetMessage, setResetMessage] = useState("");

  const authToken = localStorage.getItem("authToken") || "";

  // Hilfsfunktion: Response sicher lesen (JSON oder Text)
  const readResponseBody = async (res) => {
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) return await res.json();
    return await res.text();
  };

  const mapUser = (x) => ({
    id: x.id,
    role: x.role ?? "",
    firstName: x.firstName ?? x.first_name ?? "",
    lastName: x.lastName ?? x.last_name ?? "",
    email: x.email ?? "",
    passwordHash: x.passwordHash ?? x.password_hash ?? "",
  });

  /**
   * ✅ fetchUsers
   * - mit Filtern: setzt nur `users` (Anzeige)
   * - ohne Filter: setzt `users` UND `allUsers` (Basis + Anzeige)
   */
  const fetchUsers = useCallback(
    async ({ role, firstName, lastName } = {}) => {
      setLoading(true);
      setLoadError("");

      try {
        const params = new URLSearchParams();
        if (role && role !== "ALL") params.append("role", role);
        if (firstName && firstName.trim())
          params.append("firstName", firstName.trim());
        if (lastName && lastName.trim())
          params.append("lastName", lastName.trim());

        const qs = params.toString();
        const url = `http://localhost:8080/api/admin/users${qs ? `?${qs}` : ""}`;

        const res = await fetch(url, {
          headers: authToken
            ? { Authorization: `Bearer ${authToken}` }
            : undefined,
        });

        if (!res.ok) {
          const body = await readResponseBody(res);
          const msg =
            typeof body === "string"
              ? body
              : body?.error || body?.message || JSON.stringify(body);
          throw new Error(`Fehler ${res.status}: ${msg || "Fehler beim Laden."}`);
        }

        const body = await readResponseBody(res);
        if (!Array.isArray(body)) {
          throw new Error(`Unerwartetes Format vom Server: ${JSON.stringify(body)}`);
        }

        const mapped = body.map(mapUser);
        setUsers(mapped);

        // ✅ nur wenn ungefiltert geladen wurde, Basis aktualisieren
        const isUnfiltered =
          (!role || role === "ALL") &&
          (!firstName || !firstName.trim()) &&
          (!lastName || !lastName.trim());

        if (isUnfiltered) {
          setAllUsers(mapped);
        }
      } catch (e) {
        console.error("Admin users fetch failed:", e);
        setLoadError(e?.message || "Serverfehler. Bitte später erneut versuchen.");
        setUsers([]);
        // allUsers lassen wir hier bewusst stehen, damit Counts nicht wild werden
      } finally {
        setLoading(false);
      }
    },
    [authToken]
  );

  useEffect(() => {
    // ✅ initial: alles laden -> users + allUsers werden gesetzt
    fetchUsers();
  }, [fetchUsers]);

  // ✅ Tabelle: nur APPLIED-FILTERS (auf aktueller Anzeige-Liste `users`)
  const filteredUsers = useMemo(() => {
    const fn = appliedFilters.firstName.trim().toLowerCase();
    const ln = appliedFilters.lastName.trim().toLowerCase();
    const role = appliedFilters.role;

    return users.filter((u) => {
      const roleOk = role === "ALL" ? true : u.role === role;
      const firstOk = !fn ? true : (u.firstName || "").toLowerCase().includes(fn);
      const lastOk = !ln ? true : (u.lastName || "").toLowerCase().includes(ln);
      return roleOk && firstOk && lastOk;
    });
  }, [users, appliedFilters]);

  // ✅ Button-Zahl: immer live aus der *BASIS* `allUsers`
  const draftResultsCount = useMemo(() => {
    const fn = draftFirstName.trim().toLowerCase();
    const ln = draftLastName.trim().toLowerCase();
    const role = draftRole;

    return allUsers.filter((u) => {
      const roleOk = role === "ALL" ? true : u.role === role;
      const firstOk = !fn ? true : (u.firstName || "").toLowerCase().includes(fn);
      const lastOk = !ln ? true : (u.lastName || "").toLowerCase().includes(ln);
      return roleOk && firstOk && lastOk;
    }).length;
  }, [allUsers, draftRole, draftFirstName, draftLastName]);

  const appliedResultsCount = filteredUsers.length;

  const openEdit = (id) => {
    const u = users.find((x) => x.id === id) || allUsers.find((x) => x.id === id);
    if (!u) return;

    setFormData({ ...u });

    // ✅ Reset-UI zurücksetzen
    setResetPassword("");
    setShowResetPassword(false);
    setResetSuccess(false);
    setResetMessage("");

    setEditId(id);
  };

  const closeEdit = () => {
    setEditId(null);
    setFormData({
      id: null,
      role: "",
      firstName: "",
      lastName: "",
      email: "",
      passwordHash: "",
    });

    // ✅ Reset-UI zurücksetzen
    setResetPassword("");
    setShowResetPassword(false);
    setResetSuccess(false);
    setResetMessage("");
  };

  const openDelete = (id) => setDeleteId(id);
  const closeDelete = () => setDeleteId(null);

  const onChange = (e) => {
    const { name, value } = e.target;
    setFormData((s) => ({ ...s, [name]: value }));
  };

  const saveEdit = async () => {
    try {
      const res = await fetch(`http://localhost:8080/api/admin/users/${editId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({
          role: formData.role,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
        }),
      });

      if (!res.ok) {
        const body = await readResponseBody(res);
        const msg =
          typeof body === "string"
            ? body
            : body?.error || body?.message || JSON.stringify(body);
        throw new Error(`Fehler ${res.status}: ${msg || "Update fehlgeschlagen."}`);
      }

      // ✅ beide Listen lokal aktualisieren
      setUsers((prev) => prev.map((u) => (u.id === editId ? { ...u, ...formData } : u)));
      setAllUsers((prev) => prev.map((u) => (u.id === editId ? { ...u, ...formData } : u)));

      closeEdit();
    } catch (e) {
      console.error("Admin user update failed:", e);
      alert(e?.message || "Serverfehler. Bitte später erneut versuchen.");
    }
  };

  const confirmDelete = async () => {
    try {
      const res = await fetch(`http://localhost:8080/api/admin/users/${deleteId}`, {
        method: "DELETE",
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
      });

      if (!res.ok) {
        const body = await readResponseBody(res);
        const msg =
          typeof body === "string"
            ? body
            : body?.error || body?.message || JSON.stringify(body);
        throw new Error(`Fehler ${res.status}: ${msg || "Löschen fehlgeschlagen."}`);
      }

      // ✅ beide Listen lokal aktualisieren
      setUsers((prev) => prev.filter((u) => u.id !== deleteId));
      setAllUsers((prev) => prev.filter((u) => u.id !== deleteId));

      closeDelete();
    } catch (e) {
      console.error("Admin user delete failed:", e);
      alert(e?.message || "Serverfehler. Bitte später erneut versuchen.");
    }
  };

  const doResetPassword = async () => {
    if (!resetPassword.trim()) {
      alert("Bitte ein neues Passwort eingeben.");
      return;
    }

    try {
      const res = await fetch(
        `http://localhost:8080/api/admin/users/${editId}/reset-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          },
          body: JSON.stringify({ newPassword: resetPassword }),
        }
      );

      if (!res.ok) {
        const body = await readResponseBody(res);
        const msg =
          typeof body === "string"
            ? body
            : body?.error || body?.message || JSON.stringify(body);
        throw new Error(`Fehler ${res.status}: ${msg || "Reset fehlgeschlagen."}`);
      }

      // ✅ UI: Feld + Button verschwinden, Erfolgsmeldung erscheint
      setResetPassword("");
      setShowResetPassword(false);
      setResetSuccess(true);
      setResetMessage("Passwort erfolgreich zurückgesetzt.");
    } catch (e) {
      console.error("Admin reset password failed:", e);
      alert(e?.message || "Serverfehler. Bitte später erneut versuchen.");
    }
  };

  // ✅ Button: erst dann werden Filter angewendet + DB neu geladen
  const showResults = () => {
    const next = {
      role: draftRole,
      firstName: draftFirstName,
      lastName: draftLastName,
    };

    setAppliedFilters(next);

    fetchUsers({
      role: next.role,
      firstName: next.firstName,
      lastName: next.lastName,
    });
  };

  return (
    <AdminLayout>
      <div className="useradmin-main-wrapper">
        <h2 className="dashboard-admin-title">Benutzerverwaltung</h2>

        <div className="useradmin-card">
          {/* Filter */}
          <div className="useradmin-filters">
            <select
              className="useradmin-filter useradmin-select"
              value={draftRole}
              onChange={(e) => setDraftRole(e.target.value)}
              disabled={loading}
            >
              <option value="ALL">Rolle: Alle</option>
              <option value="Administrator">Administrator</option>
              <option value="Quiz-Entwickler">Quiz-Entwickler</option>
              <option value="Anwender">Anwender</option>
            </select>

            <input
              className="useradmin-filter"
              placeholder="Vorname filtern"
              value={draftFirstName}
              onChange={(e) => setDraftFirstName(e.target.value)}
              disabled={loading}
            />

            <input
              className="useradmin-filter"
              placeholder="Nachname filtern"
              value={draftLastName}
              onChange={(e) => setDraftLastName(e.target.value)}
              disabled={loading}
            />

            <button
              className="useradmin-results btn-shine"
              onClick={showResults}
              type="button"
              disabled={loading}
            >
              {loading ? "Laden..." : `${draftResultsCount} Ergebnisse anzeigen`}
            </button>
          </div>

          <div className="useradmin-head">
            <span className="useradmin-hint">Horizontal scrollen →</span>
          </div>

          {loadError && (
            <div style={{ marginBottom: "12px", opacity: 0.95 }}>{loadError}</div>
          )}

          {/* Table Scroll */}
          <div className="useradmin-scroll">
            <div className="useradmin-table">
              <div className="useradmin-row useradmin-row-header">
                <div>Rolle</div>
                <div>Vorname</div>
                <div>Nachname</div>
                <div>E-Mail</div>
                <div>Passwort (Hash)</div>

                {/* ✅ FIX: Text startet exakt wo die Icon-Box startet */}
                <div className="useradmin-actions-head">
                  <span className="useradmin-actions-label">Aktionen</span>
                </div>
              </div>

              {filteredUsers.map((u) => (
                <div key={u.id} className="useradmin-row">
                  <div className="useradmin-role">{u.role}</div>
                  <div className="useradmin-text">{u.firstName}</div>
                  <div className="useradmin-text">{u.lastName}</div>
                  <div className="useradmin-email">{u.email}</div>
                  <div className="useradmin-hash">{u.passwordHash}</div>

                  <div className="useradmin-actions">
                    <button
                      className="useradmin-iconbtn btn-shine"
                      onClick={() => openEdit(u.id)}
                      aria-label="Bearbeiten"
                      type="button"
                    >
                      <span className="material-symbols-outlined">edit</span>
                    </button>

                    <button
                      className="useradmin-iconbtn danger btn-shine"
                      onClick={() => openDelete(u.id)}
                      aria-label="Löschen"
                      type="button"
                    >
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                </div>
              ))}

              {!loading && appliedResultsCount === 0 && (
                <div style={{ padding: "10px 4px", opacity: 0.85 }}>
                  Keine Benutzer gefunden.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* EDIT MODAL */}
        {editId && (
          <div className="useradmin-modal-overlay" onClick={closeEdit}>
            <div className="useradmin-modal" onClick={(e) => e.stopPropagation()}>
              <h3 className="useradmin-modal-title">Benutzer bearbeiten</h3>

              <div className="useradmin-form">
                <label className="useradmin-label">
                  Vorname
                  <input
                    className="useradmin-input"
                    name="firstName"
                    value={formData.firstName}
                    onChange={onChange}
                  />
                </label>

                <label className="useradmin-label">
                  Nachname
                  <input
                    className="useradmin-input"
                    name="lastName"
                    value={formData.lastName}
                    onChange={onChange}
                  />
                </label>

                <label className="useradmin-label">
                  E-Mail
                  <input
                    className="useradmin-input"
                    name="email"
                    value={formData.email}
                    onChange={onChange}
                  />
                </label>

                <label className="useradmin-label">
                  Passwort (Hash)
                  <input className="useradmin-input" value={formData.passwordHash} readOnly />
                </label>

                <label className="useradmin-label">
                  Rolle
                  <select
                    className="useradmin-input useradmin-select"
                    name="role"
                    value={formData.role}
                    onChange={onChange}
                  >
                    <option value="Anwender">Anwender</option>
                    <option value="Quiz-Entwickler">Quiz-Entwickler</option>
                    <option value="Administrator">Administrator</option>
                  </select>
                </label>

                <div className="useradmin-divider" />

                <div className="useradmin-reset">
                  <div className="useradmin-reset-title">Passwort zurücksetzen</div>

                  {resetSuccess ? (
                    <div
                      role="status"
                      style={{
                        marginTop: "2px",
                        padding: "10px 12px",
                        borderRadius: "10px",
                        background: "rgba(46, 204, 113, 0.18)",
                        border: "1px solid rgba(46, 204, 113, 0.55)",
                        color: "rgba(255,255,255,0.95)",
                        fontWeight: 800,
                      }}
                    >
                      {resetMessage || "Passwort erfolgreich zurückgesetzt."}
                    </div>
                  ) : (
                    <>
                      <div className="useradmin-password-field">
                        <input
                          className="useradmin-input"
                          type={showResetPassword ? "text" : "password"}
                          placeholder="Neues Passwort setzen"
                          value={resetPassword}
                          onChange={(e) => setResetPassword(e.target.value)}
                          aria-label="Neues Passwort"
                        />

                        <span
                          className="material-symbols-outlined useradmin-password-toggle"
                          role="button"
                          aria-pressed={showResetPassword}
                          aria-label={showResetPassword ? "Passwort ausblenden" : "Passwort anzeigen"}
                          onClick={() => setShowResetPassword((s) => !s)}
                        >
                          {showResetPassword ? "visibility" : "visibility_off"}
                        </span>
                      </div>

                      <button
                        className="useradmin-resetbtn btn-shine"
                        onClick={doResetPassword}
                        type="button"
                      >
                        Passwort zurücksetzen
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="useradmin-modal-actions">
                <button
                  className="useradmin-modalbtn cancel btn-shine"
                  onClick={closeEdit}
                  type="button"
                >
                  Abbrechen
                </button>
                <button
                  className="useradmin-modalbtn save btn-shine"
                  onClick={saveEdit}
                  type="button"
                >
                  Speichern
                </button>
              </div>
            </div>
          </div>
        )}

        {/* DELETE MODAL */}
        {deleteId && (
          <div className="useradmin-modal-overlay" onClick={closeDelete}>
            <div className="useradmin-modal" onClick={(e) => e.stopPropagation()}>
              <h3 className="useradmin-modal-title useradmin-center">Benutzer löschen?</h3>
              <p className="useradmin-modal-text useradmin-center">
                Möchten Sie diesen Benutzer wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
              </p>

              <div className="useradmin-modal-actions">
                <button
                  className="useradmin-modalbtn cancel btn-shine"
                  onClick={closeDelete}
                  type="button"
                >
                  Abbrechen
                </button>
                <button
                  className="useradmin-modalbtn danger btn-shine"
                  onClick={confirmDelete}
                  type="button"
                >
                  Löschen
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default Benutzerverwaltung;