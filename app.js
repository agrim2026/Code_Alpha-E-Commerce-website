require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");

const productRoutes = require("./Routes/productroutes");
const authRoutes = require("./Routes/authroutes");
const orderRoutes = require("./Routes/orderroutes");


const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static("public"));
app.use("/api/products", productRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);

async function startServer() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log("MongoDB connected successfully!");

    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.log("MongoDB connection failed:", error.message);
  }
}

startServer();
