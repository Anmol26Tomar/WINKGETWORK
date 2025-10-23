const Category = require("../models/Category");

function toSlug(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-]/g, "")
    .replace(/\-+/g, "-");
}

exports.listCategories = async (req, res) => {
  try {
    const categories = await Category.find({}).sort({ createdAt: -1 });
    res.json({ categories });
  } catch (err) {
    res.status(500).json({ message: "Failed to list categories" });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name, icon, color } = req.body;
    if (!name) return res.status(400).json({ message: "Name is required" });
    const slug = toSlug(name);
    const exists = await Category.findOne({ slug });
    if (exists)
      return res.status(409).json({ message: "Category already exists" });
    const category = await Category.create({
      name,
      slug,
      icon,
      color,
      createdBy: req.user?._id,
    });
    res.status(201).json(category);
  } catch (err) {
    res.status(500).json({ message: "Failed to create category" });
  }
};

// Utility for recursive traversal by path of ids: [nodeId, childId, ...]
function findNodePath(nodes, pathIds) {
  let parent = null;
  let currentList = nodes;
  let current = null;
  for (const id of pathIds) {
    current = currentList.id
      ? currentList.id(id)
      : currentList.find((n) => String(n._id) === String(id)) || null;
    if (!current) return { parent: null, current: null, list: null };
    parent = current;
    currentList = current.children || [];
  }
  return { parent, current, list: currentList };
}

exports.addNode = async (req, res) => {
  try {
    const { id } = req.params; // category id
    const { parentPath = [], name, legacyRef } = req.body; // parentPath is array of node ids
    if (!name) return res.status(400).json({ message: "Name is required" });
    const category = await Category.findById(id);
    if (!category)
      return res.status(404).json({ message: "Category not found" });
    const slug = toSlug(name);
    let targetList = category.nodes;
    if (parentPath.length > 0) {
      let node = null;
      let list = category.nodes;
      for (const nodeId of parentPath) {
        node = list.id
          ? list.id(nodeId)
          : list.find((n) => String(n._id) === String(nodeId));
        if (!node)
          return res.status(404).json({ message: "Parent node not found" });
        if (!Array.isArray(node.children)) node.children = [];
        list = node.children;
      }
      targetList = list;
    }
    // Depth guard up to 5
    if (parentPath.length >= 5) {
      return res.status(400).json({ message: "Maximum depth (5) reached" });
    }
    if (
      targetList.some(
        (n) => n.slug === slug || (legacyRef && n.legacyRef === legacyRef)
      )
    ) {
      return res.status(409).json({ message: "Node exists" });
    }
    targetList.push({ name, slug, legacyRef, children: [] });
    await category.save();
    res.status(201).json(category);
  } catch (err) {
    res.status(500).json({ message: "Failed to add node" });
  }
};

exports.updateNode = async (req, res) => {
  try {
    const { id } = req.params; // category id
    const { path = [], name } = req.body; // full path to node
    const category = await Category.findById(id);
    if (!category)
      return res.status(404).json({ message: "Category not found" });
    let list = category.nodes;
    let node = null;
    for (const nodeId of path) {
      node = list.id
        ? list.id(nodeId)
        : list.find((n) => String(n._id) === String(nodeId));
      if (!node) return res.status(404).json({ message: "Node not found" });
      list = node.children || [];
    }
    if (!node) return res.status(404).json({ message: "Node not found" });
    if (name) {
      node.name = name;
      node.slug = toSlug(name);
    }
    await category.save();
    res.json(category);
  } catch (err) {
    res.status(500).json({ message: "Failed to update node" });
  }
};

exports.deleteNode = async (req, res) => {
  try {
    const { id } = req.params; // category id
    const { path = [] } = req.body; // full path to node, last is node to delete
    const category = await Category.findById(id);
    if (!category)
      return res.status(404).json({ message: "Category not found" });
    let list = category.nodes;
    for (let i = 0; i < path.length - 1; i++) {
      const nodeId = path[i];
      const node = list.id
        ? list.id(nodeId)
        : list.find((n) => String(n._id) === String(nodeId));
      if (!node) return res.status(404).json({ message: "Node not found" });
      list = node.children || [];
    }
    const targetId = path[path.length - 1];
    const beforeLen = list.length;
    const filtered = list.id
      ? list.filter((n) => String(n._id) !== String(targetId))
      : list.filter((n) => String(n._id) !== String(targetId));
    // If list is Mongoose array, reassigning may not persist; mutate instead
    if (Array.isArray(list)) {
      list.splice(0, list.length, ...filtered);
    }
    if (beforeLen === filtered.length)
      return res.status(404).json({ message: "Node not found" });
    await category.save();
    res.json(category);
  } catch (err) {
    res.status(500).json({ message: "Failed to delete node" });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, icon, color } = req.body;
    const update = {};
    if (name) (update.name = name), (update.slug = toSlug(name));
    if (icon !== undefined) update.icon = icon;
    if (color !== undefined) update.color = color;
    const category = await Category.findByIdAndUpdate(id, update, {
      new: true,
    });
    if (!category) return res.status(404).json({ message: "Not found" });
    res.json(category);
  } catch (err) {
    res.status(500).json({ message: "Failed to update category" });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findByIdAndDelete(id);
    if (!category) return res.status(404).json({ message: "Not found" });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete category" });
  }
};

// Subcategories
exports.addSubcategory = async (req, res) => {
  try {
    const { id } = req.params; // category id
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Name is required" });
    const slug = toSlug(name);
    const category = await Category.findById(id);
    if (!category)
      return res.status(404).json({ message: "Category not found" });
    if (category.subcategories.some((s) => s.slug === slug)) {
      return res.status(409).json({ message: "Subcategory exists" });
    }
    category.subcategories.push({ name, slug, secondarySubcategories: [] });
    await category.save();
    res.status(201).json(category);
  } catch (err) {
    res.status(500).json({ message: "Failed to add subcategory" });
  }
};

exports.updateSubcategory = async (req, res) => {
  try {
    const { id, subId } = req.params;
    const { name } = req.body;
    const category = await Category.findById(id);
    if (!category)
      return res.status(404).json({ message: "Category not found" });
    const sub = category.subcategories.id(subId);
    if (!sub) return res.status(404).json({ message: "Subcategory not found" });
    if (name) {
      sub.name = name;
      sub.slug = toSlug(name);
    }
    await category.save();
    res.json(category);
  } catch (err) {
    res.status(500).json({ message: "Failed to update subcategory" });
  }
};

exports.deleteSubcategory = async (req, res) => {
  try {
    const { id, subId } = req.params;
    const category = await Category.findById(id);
    if (!category)
      return res.status(404).json({ message: "Category not found" });
    const sub = category.subcategories.id(subId);
    if (!sub) return res.status(404).json({ message: "Subcategory not found" });
    sub.deleteOne();
    await category.save();
    res.json(category);
  } catch (err) {
    res.status(500).json({ message: "Failed to delete subcategory" });
  }
};

// Secondary subcategories
exports.addSecondary = async (req, res) => {
  try {
    const { id, subId } = req.params;
    const { name } = req.body;
    const category = await Category.findById(id);
    if (!category)
      return res.status(404).json({ message: "Category not found" });
    const sub = category.subcategories.id(subId);
    if (!sub) return res.status(404).json({ message: "Subcategory not found" });
    const slug = toSlug(name);
    if (sub.secondarySubcategories.some((s) => s.slug === slug)) {
      return res.status(409).json({ message: "Secondary subcategory exists" });
    }
    sub.secondarySubcategories.push({ name, slug });
    await category.save();
    res.status(201).json(category);
  } catch (err) {
    res.status(500).json({ message: "Failed to add secondary subcategory" });
  }
};

exports.updateSecondary = async (req, res) => {
  try {
    const { id, subId, secId } = req.params;
    const { name } = req.body;
    const category = await Category.findById(id);
    if (!category)
      return res.status(404).json({ message: "Category not found" });
    const sub = category.subcategories.id(subId);
    if (!sub) return res.status(404).json({ message: "Subcategory not found" });
    const sec = sub.secondarySubcategories.id(secId);
    if (!sec)
      return res
        .status(404)
        .json({ message: "Secondary subcategory not found" });
    if (name) {
      sec.name = name;
      sec.slug = toSlug(name);
    }
    await category.save();
    res.json(category);
  } catch (err) {
    res.status(500).json({ message: "Failed to update secondary subcategory" });
  }
};

exports.deleteSecondary = async (req, res) => {
  try {
    const { id, subId, secId } = req.params;
    const category = await Category.findById(id);
    if (!category)
      return res.status(404).json({ message: "Category not found" });
    const sub = category.subcategories.id(subId);
    if (!sub) return res.status(404).json({ message: "Subcategory not found" });
    const sec = sub.secondarySubcategories.id(secId);
    if (!sec)
      return res
        .status(404)
        .json({ message: "Secondary subcategory not found" });
    sec.deleteOne();
    await category.save();
    res.json(category);
  } catch (err) {
    res.status(500).json({ message: "Failed to delete secondary subcategory" });
  }
};
