import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/DashboardAdmin.css";
import AdminLayout from "../../layout/AdminLayout.jsx";

const DashboardAdmin = () => {
  const [user, setUser] = useState({ firstName: "", lastName: "" });
  const navigate = useNavigate();

  useEffect(() => {
    async function loadUser() {
      const authUserId = localStorage.getItem("authUserId");
      const authToken = localStorage.getItem("authToken");
      if (!authUserId || !authToken) return;

      try {
        const res = await fetch(
          `http://localhost:8080/api/users/auth/${authUserId}`,
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          }
        );

        if (res.ok) {
          const data = await res.json();
          setUser({
            firstName: data.firstName,
            lastName: data.lastName,
          });
        } else {
          console.warn("User konnte nicht geladen werden. HTTP:", res.status);
        }
      } catch (err) {
        console.error("Fehler beim Laden des Benutzers:", err);
      }
    }

    loadUser();
  }, []);

  return (
    <AdminLayout>
      <div className="dashboard-main-wrapper">
        <h2 className="dashboard-admin-title">
          Hallo, {user.firstName} {user.lastName}!
        </h2>

        {/* gleiche Grid-Klasse wie Entwickler */}
        <div className="dashboard-entwickler-cards">
          {/* Karte 1 */}
          <div className="dashboard-entwickler-card">
            <div className="dashboard-card-header">
              <span className="material-symbols-outlined card-icon">add_2</span>
              <h3>Benutzer anlegen</h3>
            </div>

            {/* gleicher Button wie Entwickler */}
            <button
              className="dashboard-entwickler-button"
              onClick={() => navigate("/administrator/benutzeranlegen")}
            >
              Anlegen
            </button>
          </div>

          {/* Karte 2 */}
          <div className="dashboard-entwickler-card">
            <div className="dashboard-card-header">
              <span className="material-symbols-outlined card-icon">
                database
              </span>
              <h3>Benutzerverwaltung</h3>
            </div>

            <button
              className="dashboard-entwickler-button"
              onClick={() => navigate("/administrator/benutzerverwaltung")}
            >
              Verwalten
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default DashboardAdmin;