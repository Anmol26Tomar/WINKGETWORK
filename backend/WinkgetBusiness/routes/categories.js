const router = require("express").Router();
const { verifyToken, requireRole } = require("../middleware/auth");
const {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  addSubcategory,
  updateSubcategory,
  deleteSubcategory,
  addSecondary,
  updateSecondary,
  deleteSecondary,
} = require("../controllers/categoryController");

// list and create categories
router.get("/", verifyToken, listCategories);
router.post("/", verifyToken, requireRole("admin"), createCategory);

// update/delete category
router.put("/:id", verifyToken, requireRole("admin"), updateCategory);
router.delete("/:id", verifyToken, requireRole("admin"), deleteCategory);

// subcategories
router.post(
  "/:id/subcategories",
  verifyToken,
  requireRole("admin"),
  addSubcategory
);
router.put(
  "/:id/subcategories/:subId",
  verifyToken,
  requireRole("admin"),
  updateSubcategory
);
router.delete(
  "/:id/subcategories/:subId",
  verifyToken,
  requireRole("admin"),
  deleteSubcategory
);

// secondary subcategories
router.post(
  "/:id/subcategories/:subId/secondary",
  verifyToken,
  requireRole("admin"),
  addSecondary
);
router.put(
  "/:id/subcategories/:subId/secondary/:secId",
  verifyToken,
  requireRole("admin"),
  updateSecondary
);
router.delete(
  "/:id/subcategories/:subId/secondary/:secId",
  verifyToken,
  requireRole("admin"),
  deleteSecondary
);

// recursive nodes endpoints
const ctrl = require("../controllers/categoryController");
router.post("/:id/nodes/add", verifyToken, requireRole("admin"), ctrl.addNode);
router.put(
  "/:id/nodes/update",
  verifyToken,
  requireRole("admin"),
  ctrl.updateNode
);
router.delete(
  "/:id/nodes/delete",
  verifyToken,
  requireRole("admin"),
  ctrl.deleteNode
);

module.exports = router;
