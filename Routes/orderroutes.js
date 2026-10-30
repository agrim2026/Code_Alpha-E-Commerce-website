const express = require("express");
const router = express.Router();
const Order = require("../models/order");

// CREATE ORDER
router.post("/", async (req, res) => {
  try {
    const { userId, items, totalAmount, address } = req.body;

    if (!userId || !items || items.length === 0 || !totalAmount || !address) {
      return res.status(400).json({
        message: "All order details are required",
      });
    }

    const order = await Order.create({
      userId,
      items,
      totalAmount,
      address,
    });

    res.status(201).json({
      message: "Order placed successfully",
      order,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to place order",
      error: error.message,
    });
  }
});

// GET USER ORDERS
router.get("/:userId", async (req, res) => {
  try {
    const orders = await Order.find({
      userId: req.params.userId,
    }).sort({ createdAt: -1 });

    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch orders",
      error: error.message,
    });
  }
});
// CANCEL ORDER
router.put("/:orderId/cancel", async (req, res) => {
    try {
      console.log("CANCEL ROUTE HIT");
        const order = await Order.findById(req.params.orderId);

        if (!order) {
            return res.status(404).json({
                message: "Order not found"
            });
        }

        order.status = "Cancelled";
        await order.save();

        res.status(200).json({
            message: "Order cancelled successfully",
            order
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to cancel order",
            error: error.message
        });
    }
});
module.exports = router;
