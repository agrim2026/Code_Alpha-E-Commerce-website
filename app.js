require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const productRoutes = require("./Routes/productroutes");
const authRoutes = require("./Routes/authroutes");
const orderRoutes = require("./Routes/orderroutes");

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
app.use("/api", async (req, res, next) => {
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
});

// API routes
app.use("/api/products", productRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);

// Health check endpoint
app.get(["/api", "/api/health"], (req, res) => {
  res.json({
    success: true,
    message: "E-Commerce API is running",
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

// Frontend pages
app.get("/", (req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

app.get("/:page", (req, res, next) => {
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
