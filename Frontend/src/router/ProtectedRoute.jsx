import React from "react";
import { Navigate } from "react-router-dom";

// Die Rolle des Benutzers und die gewünschten Rechte werden überprüft
const ProtectedRoute = ({ children, role }) => {
  const storedRole = localStorage.getItem("role");
  const authToken = localStorage.getItem("authToken");

  // Überprüfe, ob der Benutzer angemeldet ist und die richtige Rolle hat
  if (!authToken) {
    return <Navigate to="/" replace />; // Benutzer wird zum Login weitergeleitet, wenn kein Token vorhanden ist
  }

  if (storedRole !== role) {
    return <Navigate to="/" replace />; // Wenn die Rolle des Benutzers nicht übereinstimmt, wird er zum Login weitergeleitet
  }

  return children; // Zeige die geschützte Seite, wenn der Benutzer die richtige Rolle hat
};

export default ProtectedRoute;