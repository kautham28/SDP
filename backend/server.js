const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

// Import all routes
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const productRoutes = require("./routes/productRoutes");
const pendingOrderRoutes = require("./routes/pendingOrderRoutes");
const routeRoutes = require("./routes/routeRoutes");
const orderDetailsRoute = require("./routes/admin/details");
const confirmedOrdersRoute = require("./routes/confirmedOrders");
const routeDetails = require("./routes/routeDetails");
const pharmacyRoutes = require("./routes/pharmacysRoute");
const userRoutes = require("./routes/users");
const supplierRoutes = require("./routes/supplierRoutes");
const achievementRoutes = require("./routes/achievements");
const uploadRoutes = require("./routes/uploadRoutes");
const cartRoutes = require("./routes/cartRoutes");
const topProductsRoutes = require("./routes/topProductsRoutes");
const emailRoutes = require("./routes/emailRoutes");
const inventoryReportRoutes = require("./routes/inventoryReport");
const orderReportRoutes = require("./routes/orderReport");
const pharmacySalesReportRoutes = require("./routes/pharmacySalesReport");
const expiryGoodsReport = require("./routes/expiryGoodsReport");
const repPerformanceReport = require("./routes/repPerformanceReport");
const productSalesReport = require("./routes/productSalesReport");
const dashboardRoutes = require("./routes/dashboard"); // New dashboard route
const forgotPasswordRoutes = require('./routes/forgotPassword');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: "100mb" }));
app.use(bodyParser.urlencoded({ limit: "100mb", extended: true, parameterLimit: 50000 }));

// Serve uploads folder statically for profile images
app.use('/uploads', express.static('uploads'));

// Request logging for debugging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin/products", productRoutes);
app.use("/api/admin", pendingOrderRoutes);
app.use("/api/orders", orderDetailsRoute);
app.use("/api/pharmacies", pharmacyRoutes);
app.use("/users", userRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/achievements", achievementRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/cart", cartRoutes);
app.use("/api/analytics", topProductsRoutes);
app.use("/api/email", emailRoutes);
app.use("/api/reports", inventoryReportRoutes);
app.use("/api/reports", orderReportRoutes);
app.use("/api/reports", pharmacySalesReportRoutes);
app.use("/api/reports", expiryGoodsReport);
app.use("/api/reports", repPerformanceReport);
app.use("/api/reports", productSalesReport);
app.use("/api", dashboardRoutes); // Mount dashboard route before generic /api routes
app.use("/api", confirmedOrdersRoute);
app.use("/api", routeDetails);
app.use("/api", routeRoutes); // Generic /api routes last to avoid conflicts
app.use('/api', forgotPasswordRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error(`Server error: ${err.message}`);
  res.status(500).json({
    success: false,
    message: "Server error",
    error: err.message,
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});