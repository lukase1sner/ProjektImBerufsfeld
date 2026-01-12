import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/DashboardAnwender.css";
import AnwenderLayout from "../../layout/AnwenderLayout.jsx";

const DashboardAnwender = () => {
  const API_BASE = import.meta.env.VITE_API_BASE_URL;

  const [user, setUser] = useState({ firstName: "", lastName: "" });
  const navigate = useNavigate();

  useEffect(() => {
    async function loadUser() {
      const authUserId = localStorage.getItem("authUserId");
      const authToken = localStorage.getItem("authToken");
      if (!authUserId || !authToken) return;

      try {
        if (!API_BASE) {
          console.warn("VITE_API_BASE_URL ist nicht gesetzt.");
          return;
        }

        const res = await fetch(`${API_BASE}/api/users/auth/${authUserId}`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });

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
    <AnwenderLayout>
      <div className="dashboard-main-wrapper">
        <h2 className="dashboard-admin-title">
          Hallo, {user.firstName} {user.lastName}!
        </h2>

        <div className="dashboard-anwender-cards">
          {/* --- Card 1 --- */}
          <div className="dashboard-anwender-card">
            <div className="dashboard-card-header">
              <span className="material-symbols-outlined card-icon icon-blue">
                play_arrow
              </span>
              <h3>Quizzes fortsetzen</h3>
            </div>
            <button
              className="dashboard-anwender-button btn-blue-unified"
              onClick={() => navigate("/anwender/quizzes-fortsetzen")}
            >
              Fortsetzen
            </button>
          </div>

          {/* --- Card 2 --- */}
          <div className="dashboard-anwender-card">
            <div className="dashboard-card-header">
              <span className="material-symbols-outlined card-icon icon-purple">
                quiz
              </span>
              <h3>Neue Quizzes entdecken</h3>
            </div>
            <button
              className="dashboard-anwender-button btn-blue-unified"
              onClick={() => navigate("/anwender/quizzes")}
            >
              Entdecken
            </button>
          </div>

          {/* --- Card 3 --- */}
          <div className="dashboard-anwender-card">
            <div className="dashboard-card-header">
              <span className="material-symbols-outlined card-icon icon-orange">
                trophy
              </span>
              <h3>Bestenliste anzeigen</h3>
            </div>
            <button
              className="dashboard-anwender-button btn-blue-unified"
              onClick={() => navigate("/anwender/ranking")}
            >
              Anzeigen
            </button>
          </div>
        </div>
      </div>
    </AnwenderLayout>
  );
};

export default DashboardAnwender;