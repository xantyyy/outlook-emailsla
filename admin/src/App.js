import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Settings from './pages/Settings/Settings';
import Login from './pages/Login/Login';
import ForgotPassword from './pages/ForgotPassword/ForgotPassword';
import ActivityLogs from './pages/ActivityLogs/ActivityLogs';
import PrivateRoute from './components/PrivateRoute';

// Messaging Page
import MessagingPage from './pages/Email/MessagingPage';

// User Creation
import UserCreation from './pages/UserCreation/UserCreation';

import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        {/* Redirect root to /admin/login */}
        <Route path="/" element={<Navigate to="/admin/login" replace />} />
        
        {/* Redirect /admin to /admin/login */}
        <Route path="/admin" element={<Navigate to="/admin/login" replace />} />

        {/* Login Route (No Layout) */}
        <Route path="/admin/login" element={<Login />} />
        <Route path="/admin/forgot-password" element={<ForgotPassword />} />

        {/* ════════════════════════════════
            Settings Route
            ════════════════════════════════ */}
        <Route
          path="/admin/settings"
          element={
            <PrivateRoute>
              <Layout><Settings /></Layout>
            </PrivateRoute>
          }
        />

        {/* ════════════════════════════════
            Messaging Route
            ════════════════════════════════ */}
        <Route
          path="/admin/messaging"
          element={
            <PrivateRoute>
              <Layout><MessagingPage /></Layout>
            </PrivateRoute>
          }
        />

        {/* ════════════════════════════════
            User Creation Route
            ════════════════════════════════ */}
        <Route
          path="/admin/user-creation"
          element={
            <PrivateRoute>
              <Layout><UserCreation /></Layout>
            </PrivateRoute>
          }
        />

        {/* ════════════════════════════════
            Activity Logs Route
            ════════════════════════════════ */}
        <Route
          path="/admin/activity-logs"
          element={
            <PrivateRoute>
              <Layout><ActivityLogs /></Layout>
            </PrivateRoute>
          }
        />

        {/* Catch all - redirect to login */}
        <Route path="*" element={<Navigate to="/admin/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;