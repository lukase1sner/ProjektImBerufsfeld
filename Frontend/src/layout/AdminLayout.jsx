// AdminLayout.jsx
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import "../styles/AdminLayout.css";
import Logo from "../assets/Logo.png";

const AdminLayout = ({ children }) => {
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const location = useLocation();

  // Globaler Tooltip mit Richtung (links / rechts)
  const [tooltip, setTooltip] = useState({
    visible: false,
    text: "",
    x: 0,
    y: 0,
    side: "right", // "left" oder "right"
  });

  useEffect(() => {
    // bei Routenwechsel mobile Sidebar schließen
    setMobileOpen(false);
  }, [location]);

  const toggleDesktop = () => setDesktopCollapsed((s) => !s);
  const toggleMobile = () => setMobileOpen((s) => !s);
  const closeMobile = () => setMobileOpen(false);

  // Hilfsfunktion: Mobile Ansicht erkennen
  const isMobileViewport = () => window.innerWidth <= 1024;

  const showTooltipRight = (e, text) => {
    if (isMobileViewport()) return;

    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({
      visible: true,
      text,
      x: rect.right,
      y: rect.top + rect.height / 2,
      side: "right",
    });
  };

  const showTooltipLeft = (e, text) => {
    if (isMobileViewport()) return;

    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({
      visible: true,
      text,
      x: rect.left,
      y: rect.top + rect.height / 2,
      side: "left",
    });
  };

  const hideTooltip = () =>
    setTooltip({
      visible: false,
      text: "",
      x: 0,
      y: 0,
      side: "right",
    });

  const rootClass = `admin-layout ${
    desktopCollapsed ? "sidebar-closed" : "sidebar-open"
  } ${mobileOpen ? "no-scroll" : ""}`;

  const menuItems = [
    {
      to: "/administrator/dashboard",
      icon: "team_dashboard",
      label: "Dashboard",
      tooltip: "Dashboard",
    },
    {
      to: "/administrator/benutzeranlegen",
      icon: "add_2",
      label: "Benutzer anlegen",
      tooltip: "Benutzer anlegen",
    },
    {
      to: "/administrator/benutzerverwaltung",
      icon: "database",
      label: "Benutzerverwaltung",
      tooltip: "Benutzerverwaltung",
    },
  ];

  const handleLogout = () => setShowLogoutModal(true);

  return (
    <div className={rootClass}>
      {/* GLOBALER TOOLTIP */}
      {tooltip.visible && (
        <div
          className={`global-tooltip ${
            tooltip.side === "left" ? "left" : "right"
          }`}
          style={{ top: `${tooltip.y}px`, left: `${tooltip.x}px` }}
        >
          {tooltip.text}
        </div>
      )}

      <header className="header">
        <div className="header-left">
          {/* Desktop Sidebar Toggle */}
          <span
            className="material-symbols-outlined desktop-toggle-icon"
            onClick={toggleDesktop}
            onMouseEnter={(e) =>
              showTooltipRight(
                e,
                desktopCollapsed
                  ? "Seitenleiste erweitern"
                  : "Seitenleiste reduzieren"
              )
            }
            onMouseLeave={hideTooltip}
          >
            {desktopCollapsed ? "left_panel_open" : "left_panel_close"}
          </span>

          {/* Mobile Menü Icon */}
          <span
            className="material-symbols-outlined mobile-toggle-icon"
            onClick={toggleMobile}
            onMouseEnter={(e) => showTooltipRight(e, "Menü öffnen")}
            onMouseLeave={hideTooltip}
          >
            menu
          </span>
        </div>

        <div className="app-title">
          <img src={Logo} alt="QuizApp Logo" className="app-logo" />
          <span>QuizApp</span>
        </div>

        {/* Logout Icon – Tooltip links davor */}
        <span
          className="material-symbols-outlined logout-icon"
          onClick={handleLogout}
          onMouseEnter={(e) => showTooltipLeft(e, "Abmelden")}
          onMouseLeave={hideTooltip}
        >
          logout
        </span>
      </header>

      <div className="content-area">
        <aside className={`sidebar ${mobileOpen ? "open" : ""}`}>
          {/* Close-Icon für mobile Sidebar */}
          <span
            className="material-symbols-outlined sidebar-close-icon"
            onClick={closeMobile}
          >
            close
          </span>

          <nav className="sidebar-nav">
            {menuItems.map(({ to, icon, label, tooltip: tooltipText }) => (
              <Link
                key={to}
                to={to}
                className={`sidebar-link ${
                  location.pathname === to ? "active" : ""
                }`}
                onMouseEnter={(e) => {
                  if (!desktopCollapsed) return;
                  if (isMobileViewport()) return;
                  if (mobileOpen) return;
                  showTooltipRight(e, tooltipText);
                }}
                onMouseLeave={hideTooltip}
              >
                <span className="material-symbols-outlined sidebar-icon">
                  {icon}
                </span>
                <span className="sidebar-label">{label}</span>
              </Link>
            ))}
          </nav>
        </aside>

        {/* Overlay für mobile Sidebar */}
        {mobileOpen && <div className="sidebar-overlay" onClick={closeMobile} />}

        <main className="main-content">
          <div className="page-content">{children}</div>
        </main>
      </div>

      <footer className="footer">
        <p>© 2026 QuizApp</p>
      </footer>

      {/* Logout Modal – Buttons nebeneinander (wie AnwenderLayout) */}
      {showLogoutModal && (
        <div className="modal-overlay show">
          <div className="modal-content">
            <h3 className="modal-header">Möchten Sie sich abmelden?</h3>
            <p className="modal-message">
              Sie werden nach der Abmeldung zur Login-Seite weitergeleitet.
            </p>

            <div className="modal-footer">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="modal-button modal-button-cancel"
              >
                Abbrechen
              </button>

              <button
                onClick={() => {
                  localStorage.removeItem("authToken");
                  localStorage.removeItem("role");
                  localStorage.removeItem("authUserId");
                  window.location.href = "/";
                }}
                className="modal-button modal-button-confirm"
              >
                Abmelden
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLayout;