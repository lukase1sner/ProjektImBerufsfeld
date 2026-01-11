import React from "react";
import ReactDOM from "react-dom/client";
import AppRouter from "./router/AppRouter.jsx";
import "./styles/LoginPage.css"; // falls du globale Styles willst

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppRouter />
  </React.StrictMode>
);