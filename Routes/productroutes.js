const express = require("express");
const Product = require("../models/product");
const router = express.Router();

// GET ALL PRODUCTS (with Search, Filter, Sort, Category support)
router.get("/", async (req, res) => {
  try {
    const { category, search, minPrice, maxPrice, sort } = req.query;

    const filter = {};

    if (category && category !== "All") {
      filter.category = new RegExp(`^${category}$`, "i");
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
      ];
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    let query = Product.find(filter);

    // Sorting
    if (sort === "price-asc") {
      query = query.sort({ price: 1 });
    } else if (sort === "price-desc") {
      query = query.sort({ price: -1 });
    } else if (sort === "rating") {
      query = query.sort({ rating: -1 });
    } else {
      query = query.sort({ createdAt: -1 });
    }

    const products = await query;
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
      error: error.message,
    });
  }
});

// GET CATEGORIES LIST
router.get("/categories", async (req, res) => {
  try {
    const categories = await Product.distinct("category");
    res.status(200).json({
      success: true,
      categories,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
      error: error.message,
    });
  }
});

// GET FEATURED PRODUCTS
router.get("/featured", async (req, res) => {
  try {
    const products = await Product.find({ featured: true }).limit(8);
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch featured products",
      error: error.message,
    });
  }
});

// GET SINGLE PRODUCT BY ID
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch product",
      error: error.message,
    });
  }
});

// CREATE NEW PRODUCT
router.post("/", async (req, res) => {
  try {
    const { name, price, description, image, category, stock, featured } = req.body;

    if (!name || price === undefined || !description) {
      return res.status(400).json({
        success: false,
        message: "Name, price, and description are required",
      });
    }

    const product = await Product.create({
      name: name.trim(),
      price: Number(price),
      description: description.trim(),
      image: image || "🛍️",
      category: category ? category.trim() : "General",
      stock: stock !== undefined ? Number(stock) : 10,
      featured: Boolean(featured),
    });

    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create product",
      error: error.message,
    });
  }
});

// UPDATE PRODUCT
router.put("/:id", async (req, res) => {
  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json(updatedProduct);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update product",
      error: error.message,
    });
  }
});

// DELETE PRODUCT
router.delete("/:id", async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);

    if (!deletedProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
      product: deletedProduct,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete product",
      error: error.message,
    });
  }
});

module.exports = router;
