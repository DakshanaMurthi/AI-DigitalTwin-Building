
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { AuthProvider } from "./auth/AuthContext";
import AdminLogin from "./pages/AdminLogin";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";

import { BuildingProvider } from "./contexts/BuildingContext";

import Dashboard from "./pages/Dashboard";
import Rooms from "./pages/Rooms";
import Prediction from "./pages/Prediction";
import Analytics from "./pages/Analytics";
import Alerts from "./pages/Alerts";
import Settings from "./pages/Settings";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <BuildingProvider>
          <Routes>
            {/* Public login page */}
            <Route path="/login" element={<AdminLogin />} />

            {/* Protected application pages */}
            <Route element={<ProtectedAdminRoute />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/rooms" element={<Rooms />} />
              <Route path="/prediction" element={<Prediction />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/alerts" element={<Alerts />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Routes>
        </BuildingProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
