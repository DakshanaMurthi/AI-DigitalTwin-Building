import { BrowserRouter, Routes, Route } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Rooms from "./pages/Rooms";
import Prediction from "./pages/Prediction";
import Analytics from "./pages/Analytics";
import Alerts from "./pages/Alerts";
import Settings from "./pages/Settings";

import { BuildingProvider } from "./contexts/BuildingContext";

function App() {
  return (
    <BrowserRouter>
      <BuildingProvider>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/rooms" element={<Rooms />} />
          <Route path="/prediction" element={<Prediction />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </BuildingProvider>
    </BrowserRouter>
  );
}

export default App;