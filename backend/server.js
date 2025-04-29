const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const productRoutes = require("./routes/productRoutes");
const pendingOrderRoutes = require("./routes/pendingOrderRoutes");
const routeRoutes = require("./routes/routeRoutes");
const orderDetailsRoute = require('./routes/admin/details');
const confirmedOrdersRoute = require('./routes/confirmedOrders');
const routeDetails = require('./routes/routeDetails');
const pharmacyRoutes = require('./routes/pharmacysRoute');
const userRoutes = require("./routes/users");
const supplierRoutes = require("./routes/supplierRoutes");
const achievementRoutes = require("./routes/achievements");
const uploadRoutes = require('./routes/uploadRoutes');
const cartRoutes = require("./routes/cartRoutes");
const topProductsRoutes = require("./routes/topProductsRoutes"); // Added top products route
const emailRoutes = require('./routes/emailRoutes');

// Add this with your other route middleware


const app = express();
app.use(cors());
app.use(bodyParser.json());

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin/products", productRoutes);
app.use("/api/admin", pendingOrderRoutes);
app.use("/api", routeRoutes);
app.use('/api/orders', orderDetailsRoute);
app.use('/api', confirmedOrdersRoute);
app.use('/api', routeDetails);
app.use('/api/pharmacies', pharmacyRoutes);
app.use("/users", userRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/achievements", achievementRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/cart", cartRoutes);
app.use("/api/analytics", topProductsRoutes); // Mount top products route
app.use('/api/email', emailRoutes);

app.listen(5000, () => {
  console.log("Server running on port 5000");
});