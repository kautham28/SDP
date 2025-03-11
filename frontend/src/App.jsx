import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import WelcomePage from "./components/WelcomePage/Welcomepage";
import Login from "./components/Login/Login";

// Admin Imports
import AdminDashboard from "./pages/Admin/Admindashboard";
import AProductList from "./pages/Admin/AProductlist";
import APendingorder from "./pages/Admin/APendingorder";
import AConfirmedorder from "./pages/Admin/AConfirmedorder";
import AExpiryalert from "./pages/Admin/AExpiryalert";
import AStockalert from "./pages/Admin/AStockalert";
import ARoutedetails from "./pages/Admin/ARoutedetails";
import ASettings from "./pages/Admin/ASettings";

// Manager Imports
import MManagerdashboard from "./pages/Manager/MDashboard";
import MOrders from "./pages/Manager/MOrders";
import MRepAchievements from "./pages/Manager/MRepAchievements";
import MAssignRoles from "./pages/Manager/MAssignRoles";
import MInventory from "./pages/Manager/MInventory";
import MSalesReports from "./pages/Manager/MSalesReports";
import MSettings from "./pages/Manager/MSettings";

function App() {
  return (
    <Router>
      <Routes>
        {/* General Routes */}
        <Route path="/" element={<WelcomePage />} />
        <Route path="/login" element={<Login />} />

        {/* Admin Routes */}
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/admin/product-list" element={<AProductList />} />
        <Route path="/admin/pending-orders" element={<APendingorder />} />
        <Route path="/admin/confirmed-orders" element={<AConfirmedorder />} />
        <Route path="/admin/expiry-alert" element={<AExpiryalert />} />
        <Route path="/admin/stock-alert" element={<AStockalert />} />
        <Route path="/admin/route-details" element={<ARoutedetails />} />
        <Route path="/admin/settings" element={<ASettings />} />

        {/* Manager Routes */}
        <Route path="/manager/dashboard" element={<MManagerdashboard />} />
        <Route path="/manager/orders" element={<MOrders />} />
        <Route path="/manager/rep-achievements" element={<MRepAchievements />} />
        <Route path="/manager/assign-roles" element={<MAssignRoles />} />
        <Route path="/manager/inventory" element={<MInventory />} />
        <Route path="/manager/sales-reports" element={<MSalesReports />} />
        <Route path="/manager/settings" element={<MSettings />} />
      </Routes>
    </Router>
  );
}

export default App;
