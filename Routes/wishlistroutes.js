const express = require("express");
const router = express.Router();
const Wishlist = require("../models/wishlist");

// GET USER WISHLIST
router.get("/:userId", async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({ userId: req.params.userId });
    if (!wishlist) {
      wishlist = { userId: req.params.userId, products: [] };
    }
    res.status(200).json({
      success: true,
      wishlist,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch wishlist",
      error: error.message,
    });
  }
});

// TOGGLE PRODUCT IN WISHLIST
router.post("/toggle", async (req, res) => {
  try {
    const { userId, productId, name, price, image, category } = req.body;

    if (!userId || !productId) {
      return res.status(400).json({
        success: false,
        message: "userId and productId are required",
      });
    }

    let wishlist = await Wishlist.findOne({ userId });
    if (!wishlist) {
      wishlist = new Wishlist({ userId, products: [] });
    }

    const index = wishlist.products.findIndex(
      (p) => p.productId?.toString() === productId.toString()
    );

    let isAdded = false;
    if (index > -1) {
      wishlist.products.splice(index, 1);
    } else {
      wishlist.products.push({
        productId,
        name: name || "Product",
        price: Number(price) || 0,
        image: image || "🛍️",
        category: category || "General",
      });
      isAdded = true;
    }

    await wishlist.save();

    res.status(200).json({
      success: true,
      message: isAdded ? "Added to wishlist" : "Removed from wishlist",
      isAdded,
      wishlist,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update wishlist",
      error: error.message,
    });
  }
});

// REMOVE FROM WISHLIST
router.delete("/remove", async (req, res) => {
  try {
    const { userId, productId } = req.body;

    const wishlist = await Wishlist.findOne({ userId });
    if (!wishlist) {
      return res.status(404).json({ success: false, message: "Wishlist not found" });
    }

    wishlist.products = wishlist.products.filter(
      (p) => p.productId?.toString() !== productId.toString()
    );

    await wishlist.save();

    res.status(200).json({
      success: true,
      message: "Removed from wishlist",
      wishlist,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to remove from wishlist",
      error: error.message,
    });
  }
});

module.exports = router;
