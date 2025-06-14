import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Sidebar } from './components/layout/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { CallPage } from './pages/CallPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading AI Sales Assistant...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">AI Sales Assistant</h1>
            <p className="text-gray-600">Sign in to access your AI-powered call assistance</p>
          </div>
          <div className="space-y-4">
            <input
              type="email"
              placeholder="Email address"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <input
              type="password"
              placeholder="Password"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <button className="w-full bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium">
              Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/call" element={<CallPage />} />
            <Route path="/documents" element={<DocumentsPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppLayout>
      </Router>
    </AuthProvider>
  );
}

export default App;