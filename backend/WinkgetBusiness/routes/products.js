const express = require("express");
const { verifyToken, requireRole } = require("../middleware/auth");
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getVendorProducts,
  addProductRating,
  getProductCategories,
  getProductReviews,
  getProductsByVendorRef,
  getFeaturedProducts,
  searchProducts,
  uploadProductImagesMiddleware,
} = require("../controllers/productController");

const router = express.Router();
const Product = require("../models/Product");

// Public routes
router.get("/search", searchProducts);
// router.get("/:productId", getProductById);

// Public routes
router.get("/", getProducts); // Get all products with filtering
router.get("/search", searchProducts); // Search products with autocomplete
router.get("/categories", getProductCategories); // Get product categories
router.get("/:id", getProductById); // Get single product by ID
router.post("/:id/rating", verifyToken, addProductRating); // Add product rating (authenticated users)

// Vendor authenticated routes
router.use(verifyToken);

// Vendor product management - MUST come before /vendor/:vendorRef route
router.get("/vendor/my-products", requireRole("vendor"), getVendorProducts);

// Get products by vendorRef (public) - MUST come after specific routes
router.get("/vendor/:vendorRef", getProductsByVendorRef);
router.post(
  "/",
  requireRole("vendor"),
  uploadProductImagesMiddleware,
  createProduct
);
router.put("/:id", requireRole("vendor", "admin"), updateProduct);
router.delete("/:id", requireRole("vendor", "admin"), deleteProduct);

module.exports = router;
