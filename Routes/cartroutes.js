const express = require("express");
const router = express.Router();
const Cart = require("../models/cart");

// GET USER CART
router.get("/:userId", async (req, res) => {
  try {
    let cart = await Cart.findOne({ userId: req.params.userId });
    if (!cart) {
      cart = { userId: req.params.userId, items: [] };
    }
    res.status(200).json({
      success: true,
      cart,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch cart",
      error: error.message,
    });
  }
});

// ADD ITEM TO CART
router.post("/add", async (req, res) => {
  try {
    const { userId, productId, name, price, image, quantity } = req.body;

    if (!userId || !productId || !name || price === undefined) {
      return res.status(400).json({
        success: false,
        message: "userId, productId, name, and price are required",
      });
    }

    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = new Cart({
        userId,
        items: [],
      });
    }

    const itemQty = Number(quantity) || 1;
    const existingIndex = cart.items.findIndex(
      (item) => item.productId?.toString() === productId.toString() || item.name === name
    );

    if (existingIndex > -1) {
      cart.items[existingIndex].quantity += itemQty;
    } else {
      cart.items.push({
        productId,
        name,
        price: Number(price),
        image: image || "🛍️",
        quantity: itemQty,
      });
    }

    await cart.save();

    res.status(200).json({
      success: true,
      message: "Item added to cart",
      cart,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to add to cart",
      error: error.message,
    });
  }
});

// UPDATE ITEM QUANTITY
router.put("/update", async (req, res) => {
  try {
    const { userId, productId, quantity } = req.body;

    if (!userId || !productId || quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: "userId, productId, and quantity are required",
      });
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ success: false, message: "Cart not found" });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.productId?.toString() === productId.toString()
    );

    if (itemIndex > -1) {
      const newQty = Number(quantity);
      if (newQty <= 0) {
        cart.items.splice(itemIndex, 1);
      } else {
        cart.items[itemIndex].quantity = newQty;
      }
      await cart.save();
    }

    res.status(200).json({
      success: true,
      message: "Cart updated",
      cart,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update cart",
      error: error.message,
    });
  }
});

// REMOVE ITEM FROM CART
router.delete("/remove", async (req, res) => {
  try {
    const { userId, productId } = req.body;

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ success: false, message: "Cart not found" });
    }

    cart.items = cart.items.filter(
      (item) => item.productId?.toString() !== productId.toString()
    );

    await cart.save();

    res.status(200).json({
      success: true,
      message: "Item removed from cart",
      cart,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to remove item",
      error: error.message,
    });
  }
});

// CLEAR CART
router.delete("/clear/:userId", async (req, res) => {
  try {
    await Cart.findOneAndUpdate(
      { userId: req.params.userId },
      { items: [] }
    );
    res.status(200).json({
      success: true,
      message: "Cart cleared successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to clear cart",
      error: error.message,
    });
  }
});

module.exports = router;
