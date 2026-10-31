require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const productRoutes = require("./Routes/productroutes");
const authRoutes = require("./Routes/authroutes");
const orderRoutes = require("./Routes/orderroutes");
const cartRoutes = require("./Routes/cartroutes");
const wishlistRoutes = require("./Routes/wishlistroutes");
const adminRoutes = require("./Routes/adminroutes");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static assets from public directory
const publicDir = path.join(__dirname, "public");
app.use(express.static(publicDir));

// Cache MongoDB connection across serverless invocations
let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI environment variable is missing");
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 10000,
      })
      .then((mongooseInstance) => mongooseInstance);
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    throw error;
  }
}

// MongoDB connection middleware for API requests
const mongoMiddleware = async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);

    res.status(500).json({
      success: false,
      message: "Database connection failed",
      error: error.message,
    });
  }
};

// Apply database connection middleware to all API paths
app.use("/api", mongoMiddleware);
app.use("/products", mongoMiddleware);
app.use("/auth", mongoMiddleware);
app.use("/orders", mongoMiddleware);
app.use("/cart", mongoMiddleware);
app.use("/wishlist", mongoMiddleware);
app.use("/admin", mongoMiddleware);

// API routes (support both /api/* and root/* paths in serverless)
app.use("/api/products", productRoutes);
app.use("/products", productRoutes);

app.use("/api/auth", authRoutes);
app.use("/auth", authRoutes);

app.use("/api/orders", orderRoutes);
app.use("/orders", orderRoutes);

app.use("/api/cart", cartRoutes);
app.use("/cart-api", cartRoutes);

app.use("/api/wishlist", wishlistRoutes);
app.use("/wishlist-api", wishlistRoutes);

app.use("/api/admin", adminRoutes);
app.use("/admin-api", adminRoutes);

// Health check and API Catalog endpoint
app.get(["/api", "/api/health", "/health"], (req, res) => {
  res.json({
    success: true,
    message: "NovaCart E-Commerce Full Backend is running",
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    endpoints: {
      auth: ["POST /api/auth/signup", "POST /api/auth/login", "GET /api/auth/profile", "PUT /api/auth/profile", "POST /api/auth/change-password"],
      products: ["GET /api/products", "GET /api/products/categories", "GET /api/products/featured", "GET /api/products/:id", "POST /api/products", "PUT /api/products/:id", "DELETE /api/products/:id"],
      orders: ["POST /api/orders", "GET /api/orders/:userId", "GET /api/orders/order/:orderId", "PUT /api/orders/:orderId/cancel", "PUT /api/orders/:orderId/status"],
      cart: ["GET /api/cart/:userId", "POST /api/cart/add", "PUT /api/cart/update", "DELETE /api/cart/remove", "DELETE /api/cart/clear/:userId"],
      wishlist: ["GET /api/wishlist/:userId", "POST /api/wishlist/toggle", "DELETE /api/wishlist/remove"],
      admin: ["GET /api/admin/stats", "GET /api/admin/orders", "PUT /api/admin/orders/:orderId/status", "GET /api/admin/users", "DELETE /api/admin/users/:userId"],
    },
  });
});

// Frontend pages
app.get("/", (req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

app.get("/:page", (req, res, next) => {
  if (req.params.page.startsWith("api")) {
    return next();
  }
  let file = req.params.page;
  if (!file.endsWith(".html")) {
    file += ".html";
  }
  const filePath = path.join(publicDir, file);
  res.sendFile(filePath, (err) => {
    if (err) next();
  });
});

// Start local server only when running app.js directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;
