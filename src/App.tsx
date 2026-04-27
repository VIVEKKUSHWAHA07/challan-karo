import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import CompanySetup from './pages/profile/CompanySetup';
import Dashboard from './pages/dashboard/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import PartyBook from './pages/parties/PartyBook';
import CreateChallan from './pages/challan/CreateChallan';
import ViewChallan from './pages/challan/ViewChallan';
import Settings from './pages/settings/Settings';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/setup"
          element={
            <ProtectedRoute>
              <CompanySetup />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/parties"
          element={
            <ProtectedRoute>
              <PartyBook />
            </ProtectedRoute>
          }
        />
        {/* ⚠️ IMPORTANT: /challan/view/:id MUST come BEFORE /challan/:type
            Otherwise React Router treats "view" as the :type param */}
        <Route
          path="/challan/view/:id"
          element={
            <ProtectedRoute>
              <ViewChallan />
            </ProtectedRoute>
          }
        />
        <Route
          path="/challan/:type"
          element={
            <ProtectedRoute>
              <CreateChallan />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
