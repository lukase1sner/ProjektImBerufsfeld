import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/DashboardEntwickler.css";
import EntwicklerLayout from "../../layout/EntwicklerLayout.jsx";

const DashboardEntwickler = () => {
  const API_BASE = import.meta.env.VITE_API_BASE_URL;

  const [user, setUser] = useState({ firstName: "", lastName: "" });
  const navigate = useNavigate();

  useEffect(() => {
    async function loadUser() {
      const authUserId = localStorage.getItem("authUserId");
      const authToken = localStorage.getItem("authToken");
      if (!authUserId || !authToken) return;

      if (!API_BASE) {
        console.warn("VITE_API_BASE_URL ist nicht gesetzt.");
        return;
      }

      try {
        const res = await fetch(
          `${API_BASE}/api/users/auth/${authUserId}`,
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
  }, [API_BASE]);

  return (
    <EntwicklerLayout>
      <div className="dashboard-main-wrapper">
        <h2 className="dashboard-admin-title">
          Hallo, {user.firstName} {user.lastName}!
        </h2>

        <div className="dashboard-entwickler-cards">
          {/* --- Card 1 --- */}
          <div className="dashboard-entwickler-card">
            <div className="dashboard-card-header">
              <span className="material-symbols-outlined card-icon">
                add_2
              </span>
              <h3>Neues Quiz erstellen</h3>
            </div>
            <button
              className="dashboard-entwickler-button"
              onClick={() => navigate("/entwickler/neues-quiz")}
            >
              Erstellen
            </button>
          </div>

          {/* --- Card 2 --- */}
          <div className="dashboard-entwickler-card">
            <div className="dashboard-card-header">
              <span className="material-symbols-outlined card-icon">
                cards_stack
              </span>
              <h3>Quizzes verwalten</h3>
            </div>
            <button
              className="dashboard-entwickler-button"
              onClick={() => navigate("/entwickler/quizzes-verwalten")}
            >
              Verwalten
            </button>
          </div>
        </div>
      </div>
    </EntwicklerLayout>
  );
};

export default DashboardEntwickler;