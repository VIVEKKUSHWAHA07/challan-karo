import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import CompanySetup from './pages/profile/CompanySetup';
import Dashboard from './pages/dashboard/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import PartyBook from './pages/parties/PartyBook';
import CreateChallan from './pages/challan/CreateChallan';
import ViewChallan from './pages/challan/ViewChallan';
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
        <Route
          path="/challan/:type"
          element={
            <ProtectedRoute>
              <CreateChallan />
            </ProtectedRoute>
          }
        />
        <Route
          path="/challan/view/:id"
          element={
            <ProtectedRoute>
              <ViewChallan />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
