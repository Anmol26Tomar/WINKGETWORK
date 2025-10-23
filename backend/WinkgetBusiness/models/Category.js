const mongoose = require("mongoose");

const SecondarySubcategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: false, trim: true },
  },
  { _id: true }
);

const SubcategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true },
    secondarySubcategories: { type: [SecondarySubcategorySchema], default: [] },
  },
  { _id: true }
);

const CategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    icon: { type: String },
    color: { type: String },
    subcategories: { type: [SubcategorySchema], default: [] },
    // New recursive nodes tree (supports up to 5 levels logically)
    // Define a self-referential subdocument schema for robust nested IDs
    nodes: { type: Array, default: [] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor" },
  },
  { timestamps: true }
);

// Define recursive NodeSchema and attach to CategorySchema.paths.nodes
const NodeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true },
    legacyRef: { type: String },
    children: { type: [] },
  },
  { _id: true }
);

// Make children an array of NodeSchema (recursive)
NodeSchema.add({ children: [NodeSchema] });

// Replace nodes path to use NodeSchema[] rather than plain Array
CategorySchema.path("nodes", [NodeSchema]);

module.exports = mongoose.model("Category", CategorySchema);
