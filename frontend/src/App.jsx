import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import WelcomePage from "./components/WelcomePage/Welcomepage";
import Login from "./components/Login/Login";
import AdminDashboard from "./pages/Admin/Admindashboard";
import AProductList from "./pages/Admin/AProductlist"; // Import AProductList
import APendingorder from "./pages/Admin/APendingorder";
import AConfirmedorder from "./pages/Admin/AConfirmedorder";
import AExpiryalert from "./pages/Admin/AExpiryalert";
import AStockalert from "./pages/Admin/AStockalert";
import ARoutedetails from "./pages/Admin/ARoutedetails";
import Managerdashboard from "./pages/Manager/Managerdashboard";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/admin/product-list" element={<AProductList />} /> {/* Add this route */}
        <Route path="/admin/pending-orders" element={<APendingorder />} /> {/* Add this route */}
        <Route path="/admin/confirmed-orders" element={<AConfirmedorder />} /> {/* Add this route */}
        <Route path="/admin/expiry-alert" element={<AExpiryalert />} /> {/* Add this route */}
        <Route path="/admin/stock-alert" element={<AStockalert />} /> {/* Add this route */}
        <Route path="/admin/route-details" element={<ARoutedetails />} /> {/* Add this route */}
       <Route path="/manager-dashboard" element={<Managerdashboard />} />

      </Routes>
    </Router>
  );
}

export default App;
