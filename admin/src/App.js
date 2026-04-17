import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard/Dashboard';
import BugReports from './pages/BugReports/BugReports';
import BugDetails from './pages/BugDetails/BugDetails';
import Settings from './pages/Settings/Settings';
import Login from './pages/Login/Login';
import ForgotPassword from './pages/ForgotPassword/ForgotPassword';
import PrivateRoute from './components/PrivateRoute';

// SLA Monitoring Pages
import ExecutiveSummary    from './pages/slaMonitoring/Executive Summary/executiveSummary';
import ComplianceLogs      from './pages/slaMonitoring/complianceLogs/complianceLogs';
import DepartmentLogs      from './pages/slaMonitoring/departmentLogs/departmentLogs';
import EscalationAnalytics from './pages/slaMonitoring/escalationAnalytics/escalationAnalytics';
import ResponseTime        from './pages/slaMonitoring/responseTime/responseTime';

// Messaging Page
import MessagingPage from './pages/Email/MessagingPage';

// User Creation
import UserCreation from './pages/UserCreation/UserCreation';

// Archive
import Archive from './pages/Archive/Archive';

// Activity Logs
import ActivityLogs from './pages/ActivityLogs/ActivityLogs';

// Outlook Reports
import OutlookReports from './pages/OutlookReports/OutlookReports';

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
        <Route path="/admin/login"           element={<Login />} />
        <Route path="/admin/forgot-password" element={<ForgotPassword />} />

        {/* Protected Routes (With Layout) */}
        <Route 
          path="/admin/dashboard" 
          element={
            <PrivateRoute>
              <Layout><Dashboard /></Layout>
            </PrivateRoute>
          } 
        />
        
        {/* Bug Reports */}
        <Route 
          path="/admin/bug-reports" 
          element={
            <PrivateRoute>
              <Layout><BugReports /></Layout>
            </PrivateRoute>
          } 
        />

        {/* Backwards-compat: old bug-list URL redirects to bug-reports */}
        <Route 
          path="/admin/bug-list" 
          element={<Navigate to="/admin/bug-reports" replace />} 
        />
        
        <Route 
          path="/admin/bug-details/:id" 
          element={
            <PrivateRoute>
              <Layout><BugDetails /></Layout>
            </PrivateRoute>
          } 
        />
        
        <Route 
          path="/admin/create-bug" 
          element={
            <PrivateRoute>
              <Layout><div style={{padding: '2rem'}}>Create Bug - Coming Soon</div></Layout>
            </PrivateRoute>
          } 
        />
        
        <Route 
          path="/admin/settings" 
          element={
            <PrivateRoute>
              <Layout><Settings /></Layout>
            </PrivateRoute>
          } 
        />

        {/* ════════════════════════════════
            SLA Monitoring Routes
            ════════════════════════════════ */}
        <Route
          path="/admin/sla/executive-summary"
          element={
            <PrivateRoute>
              <Layout><ExecutiveSummary /></Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/sla/compliance-logs"
          element={
            <PrivateRoute>
              <Layout><ComplianceLogs /></Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/sla/department-logs"
          element={
            <PrivateRoute>
              <Layout><DepartmentLogs /></Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/sla/escalation-analytics"
          element={
            <PrivateRoute>
              <Layout><EscalationAnalytics /></Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/sla/response-time-trends"
          element={
            <PrivateRoute>
              <Layout><ResponseTime /></Layout>
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
            Archive Route
            ════════════════════════════════ */}
        <Route
          path="/admin/archive"
          element={
            <PrivateRoute>
              <Layout><Archive /></Layout>
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

        {/* ════════════════════════════════
            Outlook Reports Route
            ════════════════════════════════ */}
        <Route
          path="/admin/outlook-reports"
          element={
            <PrivateRoute>
              <Layout><OutlookReports /></Layout>
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