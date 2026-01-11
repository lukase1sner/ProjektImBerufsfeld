import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import LoginPage from "../pages/LoginPage/LoginPage.jsx";

import DashboardAdmin from "../pages/Administrator/DashboardAdmin.jsx";
import BenutzerAnlegen from "../pages/Administrator/BenutzerAnlegen.jsx";
import Benutzerverwaltung from "../pages/Administrator/Benutzerverwaltung.jsx";

import DashboardEntwickler from "../pages/Entwickler/DashboardEntwickler.jsx";
import NeuesQuiz from "../pages/Entwickler/NeuesQuiz.jsx";
import QuizzesVerwalten from "../pages/Entwickler/QuizzesVerwalten.jsx";

import DashboardAnwender from "../pages/Anwender/DashboardAnwender.jsx";
import NeueQuizzesEntdecken from "../pages/Anwender/NeueQuizzesEntdecken.jsx";
import BestenlisteAnzeigen from "../pages/Anwender/BestenlisteAnzeigen.jsx";
import QuizzesFortsetzen from "../pages/Anwender/QuizzesFortsetzen.jsx";
import Profil from "../pages/Anwender/Profil.jsx";
import Quiz from "../pages/Anwender/Quiz.jsx";

// ✅ NEU
import QuizResult from "../pages/Anwender/QuizResult.jsx";
import QuizReview from "../pages/Anwender/QuizReview.jsx";

import ProtectedRoute from "../router/ProtectedRoute.jsx";

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />

        {/* ADMIN */}
        <Route
          path="/administrator/dashboard"
          element={
            <ProtectedRoute role="Administrator">
              <DashboardAdmin />
            </ProtectedRoute>
          }
        />
        <Route
          path="/administrator/benutzeranlegen"
          element={
            <ProtectedRoute role="Administrator">
              <BenutzerAnlegen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/administrator/benutzerverwaltung"
          element={
            <ProtectedRoute role="Administrator">
              <Benutzerverwaltung />
            </ProtectedRoute>
          }
        />

        {/* ENTWICKLER */}
        <Route
          path="/entwickler/dashboard"
          element={
            <ProtectedRoute role="Quiz-Entwickler">
              <DashboardEntwickler />
            </ProtectedRoute>
          }
        />
        <Route
          path="/entwickler/neues-quiz"
          element={
            <ProtectedRoute role="Quiz-Entwickler">
              <NeuesQuiz />
            </ProtectedRoute>
          }
        />
        <Route
          path="/entwickler/quizzes-verwalten"
          element={
            <ProtectedRoute role="Quiz-Entwickler">
              <QuizzesVerwalten />
            </ProtectedRoute>
          }
        />

        {/* ANWENDER */}
        <Route
          path="/anwender/dashboard"
          element={
            <ProtectedRoute role="Anwender">
              <DashboardAnwender />
            </ProtectedRoute>
          }
        />

        <Route
          path="/anwender/quizzes-fortsetzen"
          element={
            <ProtectedRoute role="Anwender">
              <QuizzesFortsetzen />
            </ProtectedRoute>
          }
        />

        <Route
          path="/anwender/quizzes"
          element={
            <ProtectedRoute role="Anwender">
              <NeueQuizzesEntdecken />
            </ProtectedRoute>
          }
        />

        {/* Quiz starten / fortsetzen */}
        <Route
          path="/anwender/quiz/:quizId"
          element={
            <ProtectedRoute role="Anwender">
              <Quiz />
            </ProtectedRoute>
          }
        />
        <Route
          path="/anwender/quiz/attempt/:attemptId"
          element={
            <ProtectedRoute role="Anwender">
              <Quiz />
            </ProtectedRoute>
          }
        />

        {/* ✅ Ergebnis + Review */}
        <Route
          path="/anwender/quiz/result/:attemptId"
          element={
            <ProtectedRoute role="Anwender">
              <QuizResult />
            </ProtectedRoute>
          }
        />
        <Route
          path="/anwender/quiz/review/:attemptId/:position"
          element={
            <ProtectedRoute role="Anwender">
              <QuizReview />
            </ProtectedRoute>
          }
        />

        <Route
          path="/anwender/ranking"
          element={
            <ProtectedRoute role="Anwender">
              <BestenlisteAnzeigen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/anwender/profil"
          element={
            <ProtectedRoute role="Anwender">
              <Profil />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;