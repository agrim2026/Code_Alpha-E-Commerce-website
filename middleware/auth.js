const jwt = require("jsonwebtoken");
const User = require("../models/user");

const JWT_SECRET = process.env.JWT_SECRET || "e-commerce-super-secret-key-2026";

// Generate JWT token for user
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id || user.id,
      email: user.email,
      role: user.role || "user",
    },
    JWT_SECRET,
    {
      expiresIn: "30d",
    }
  );
};

// Protect routes - verify user token
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    // Check if userId is passed in body/query as fallback
    const fallbackId = req.body?.userId || req.query?.userId || req.params?.userId;
    if (fallbackId) {
      try {
        const user = await User.findById(fallbackId).select("-password");
        if (user) {
          req.user = user;
          return next();
        }
      } catch (e) {
        // Continue to unauthorized
      }
    }
    return res.status(401).json({
      success: false,
      message: "Not authorized, token missing",
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
      error: error.message,
    });
  }
};

// Admin only middleware
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: "Access denied: Admin privileges required",
    });
  }
};

module.exports = {
  JWT_SECRET,
  generateToken,
  protect,
  adminOnly,
};
