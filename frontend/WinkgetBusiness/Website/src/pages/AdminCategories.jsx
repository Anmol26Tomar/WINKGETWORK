import React, { useEffect, useMemo, useState } from "react";
import {
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
  addNode,
  updateNode,
  deleteNode,
} from "../services/categoryService";

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [newCategory, setNewCategory] = useState({
    name: "",
    icon: "",
    color: "",
  });

  async function load() {
    try {
      setLoading(true);
      const data = await listCategories();
      setCategories(data);
      setError("");
    } catch (e) {
      setError(e.message || "Failed to load categories");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function onCreateCategory(e) {
    e.preventDefault();
    if (!newCategory.name.trim()) return;
    try {
      const created = await createCategory(newCategory);
      setCategories((prev) => [created, ...prev]);
      setNewCategory({ name: "", icon: "", color: "" });
    } catch (e) {
      alert(e.message || "Failed to create category");
    }
  }

  async function onRenameCategory(catId) {
    const name = prompt("Rename category");
    if (!name) return;
    try {
      const updated = await updateCategory(catId, { name });
      setCategories((prev) => prev.map((c) => (c._id === catId ? updated : c)));
    } catch (e) {
      alert(e.message || "Failed to rename");
    }
  }

  async function onDeleteCategory(catId) {
    if (!confirm("Delete this category?")) return;
    try {
      await deleteCategory(catId);
      setCategories((prev) => prev.filter((c) => c._id !== catId));
    } catch (e) {
      alert(e.message || "Failed to delete");
    }
  }

  async function onAddSub(catId) {
    const name = prompt("Subcategory name");
    if (!name) return;
    try {
      const updated = await addSubcategory(catId, { name });
      setCategories((prev) => prev.map((c) => (c._id === catId ? updated : c)));
    } catch (e) {
      alert(e.message || "Failed to add subcategory");
    }
  }

  async function onAddTwoSubs(catId) {
    const input = prompt("Enter two subcategories (comma separated)");
    if (!input) return;
    const parts = input
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 2);
    if (parts.length === 0) return;
    try {
      let updatedCat = null;
      for (const name of parts) {
        updatedCat = await addSubcategory(catId, { name });
      }
      if (updatedCat) {
        setCategories((prev) =>
          prev.map((c) => (c._id === catId ? updatedCat : c))
        );
      }
    } catch (e) {
      alert(e.message || "Failed to add subcategories");
    }
  }

  async function onRenameSub(catId, subId) {
    const name = prompt("Rename subcategory");
    if (!name) return;
    try {
      const updated = await updateSubcategory(catId, subId, { name });
      setCategories((prev) => prev.map((c) => (c._id === catId ? updated : c)));
    } catch (e) {
      alert(e.message || "Failed to rename subcategory");
    }
  }

  async function onDeleteSub(catId, subId) {
    if (!confirm("Delete this subcategory?")) return;
    try {
      const updated = await deleteSubcategory(catId, subId);
      setCategories((prev) => prev.map((c) => (c._id === catId ? updated : c)));
    } catch (e) {
      alert(e.message || "Failed to delete subcategory");
    }
  }

  async function onAddSecondary(catId, subId) {
    const name = prompt("Secondary subcategory name");
    if (!name) return;
    try {
      const updated = await addSecondary(catId, subId, { name });
      setCategories((prev) => prev.map((c) => (c._id === catId ? updated : c)));
    } catch (e) {
      alert(e.message || "Failed to add secondary");
    }
  }

  async function onRenameSecondary(catId, subId, secId) {
    const name = prompt("Rename secondary subcategory");
    if (!name) return;
    try {
      const updated = await updateSecondary(catId, subId, secId, { name });
      setCategories((prev) => prev.map((c) => (c._id === catId ? updated : c)));
    } catch (e) {
      alert(e.message || "Failed to rename secondary");
    }
  }

  async function onDeleteSecondary(catId, subId, secId) {
    if (!confirm("Delete this secondary subcategory?")) return;
    try {
      const updated = await deleteSecondary(catId, subId, secId);
      setCategories((prev) => prev.map((c) => (c._id === catId ? updated : c)));
    } catch (e) {
      alert(e.message || "Failed to delete secondary");
    }
  }

  const graph = useMemo(() => {
    // Build a tree combining legacy subcategories and new recursive nodes
    return categories.map((c) => ({
      id: c._id,
      label: c.name,
      color: c.color || "#e5e7eb",
      icon: c.icon,
      subs: (c.subcategories || []).map((s) => ({
        id: s._id,
        label: s.name,
        seconds: (s.secondarySubcategories || []).map((x) => ({
          id: x._id,
          label: x.name,
        })),
      })),
      nodes: c.nodes || [],
    }));
  }, [categories]);

  const depthColors = [
    {
      ring: "ring-blue-200",
      border: "border-blue-300",
      bg: "bg-blue-50",
      text: "text-blue-700",
    },
    {
      ring: "ring-purple-200",
      border: "border-purple-300",
      bg: "bg-purple-50",
      text: "text-purple-700",
    },
    {
      ring: "ring-emerald-200",
      border: "border-emerald-300",
      bg: "bg-emerald-50",
      text: "text-emerald-700",
    },
    {
      ring: "ring-amber-200",
      border: "border-amber-300",
      bg: "bg-amber-50",
      text: "text-amber-700",
    },
    {
      ring: "ring-pink-200",
      border: "border-pink-300",
      bg: "bg-pink-50",
      text: "text-pink-700",
    },
  ];

  function colorForDepth(depth) {
    const c = depthColors[depth % depthColors.length];
    return c;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Categories</h1>
        <div className="flex gap-2">
          <button
            onClick={load}
            className="px-3 py-2 text-sm rounded-md border"
          >
            Refresh
          </button>
        </div>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-600 text-sm">{error}</p>}

      <form
        onSubmit={onCreateCategory}
        className="bg-white border rounded-lg p-4 grid md:grid-cols-4 gap-3"
      >
        <input
          value={newCategory.name}
          onChange={(e) =>
            setNewCategory((p) => ({ ...p, name: e.target.value }))
          }
          placeholder="Category name"
          className="border rounded px-3 py-2"
        />
        <input
          value={newCategory.icon}
          onChange={(e) =>
            setNewCategory((p) => ({ ...p, icon: e.target.value }))
          }
          placeholder="Icon (emoji or URL)"
          className="border rounded px-3 py-2"
        />
        <input
          value={newCategory.color}
          onChange={(e) =>
            setNewCategory((p) => ({ ...p, color: e.target.value }))
          }
          placeholder="Color (#hex)"
          className="border rounded px-3 py-2"
        />
        <button className="bg-primary-600 text-white rounded px-4 py-2">
          Add Category
        </button>
      </form>

      <div className="grid gap-4">
        {categories.map((c) => (
          <div key={c._id} className="bg-white border rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="h-8 w-8 rounded-full flex items-center justify-center"
                  style={{ background: c.color || "#e5e7eb" }}
                >
                  <span>{c.icon || "🗂️"}</span>
                </div>
                <div>
                  <div className="font-semibold">{c.name}</div>
                  <div className="text-xs text-gray-500">{c.slug}</div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onRenameCategory(c._id)}
                  className="px-3 py-1.5 text-sm rounded-md border"
                >
                  Rename
                </button>
                <button
                  onClick={() => onDeleteCategory(c._id)}
                  className="px-3 py-1.5 text-sm rounded-md border text-red-600"
                >
                  Delete
                </button>
                <button
                  onClick={() => onAddTwoSubs(c._id)}
                  className="px-3 py-1.5 text-sm rounded-md border"
                >
                  Add 2 Subcategories
                </button>
              </div>
            </div>

            {/* Flow visualization (grid + recursive tree) */}
            <div className="overflow-x-auto">
              <div className="min-w-[700px]">
                <div className="flex items-stretch gap-6">
                  <div className="flex flex-col items-center">
                    <div className="px-3 py-1.5 rounded bg-blue-100 text-blue-700 text-sm">
                      {c.name}
                    </div>
                    <div className="w-0.5 bg-gray-200 flex-1 my-2" />
                  </div>
                  <div className="flex-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {(c.subcategories || []).map((s, idx) => {
                        const c0 = colorForDepth(0);
                        return (
                          <div
                            key={s._id}
                            className={`border ${c0.border} rounded-xl p-4 ring-1 ${c0.ring} bg-white`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="font-medium flex items-center gap-2 flex-wrap">
                                <span
                                  className={`px-2.5 py-1 text-xs rounded-full ${c0.bg} ${c0.text}`}
                                >
                                  Level 1
                                </span>
                                <span className="flex-1">{s.name}</span>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={async () => {
                                    // Ensure a node exists for this subcategory; then add a child under it
                                    const current = categories.find(
                                      (cc) => cc._id === c._id
                                    );
                                    let subNode = (current?.nodes || []).find(
                                      (n) =>
                                        n.legacyRef === s._id ||
                                        n.name === s.name
                                    );
                                    let workingCat = current;
                                    if (!subNode) {
                                      workingCat = await addNode(
                                        c._id,
                                        [],
                                        s.name,
                                        s._id
                                      );
                                      subNode = (workingCat.nodes || []).find(
                                        (n) =>
                                          n.legacyRef === s._id ||
                                          n.name === s.name
                                      );
                                    }
                                    const childName = prompt(
                                      "Add child under " + s.name
                                    );
                                    if (!childName) return;
                                    const updated = await addNode(
                                      c._id,
                                      [subNode._id],
                                      childName
                                    );
                                    setCategories((prev) =>
                                      prev.map((cc) =>
                                        cc._id === c._id ? updated : cc
                                      )
                                    );
                                  }}
                                  className={`px-3 py-1.5 text-xs rounded-md border bg-white hover:bg-blue-50 ${c0.border}`}
                                  title="Create a nested node under this subcategory"
                                >
                                  Add
                                </button>
                                <button
                                  onClick={() => onRenameSub(c._id, s._id)}
                                  className="px-3 py-1.5 text-xs rounded-md border bg-white hover:bg-gray-50"
                                >
                                  Rename
                                </button>
                                <button
                                  onClick={() => onDeleteSub(c._id, s._id)}
                                  className="px-3 py-1.5 text-xs rounded-md border bg-white text-red-600 hover:bg-red-50"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                            <div className="space-y-2">
                              {(s.secondarySubcategories || []).length === 0 ? (
                                <div className="text-xs text-gray-400">
                                  No secondary subcategories
                                </div>
                              ) : (
                                (s.secondarySubcategories || []).map((x) => {
                                  const c1 = colorForDepth(1);
                                  return (
                                    <div
                                      key={x._id}
                                      className={`flex items-center justify-between text-sm ${c1.bg} rounded-lg px-3 py-2 border ${c1.border}`}
                                    >
                                      <span>{x.name}</span>
                                      <div className="flex gap-2">
                                        <button
                                          onClick={async () => {
                                            // Ensure path nodes [subcategory, secondary], then add child under secondary
                                            const current = categories.find(
                                              (cc) => cc._id === c._id
                                            );
                                            let subNode = (
                                              current?.nodes || []
                                            ).find(
                                              (n) =>
                                                n.legacyRef === s._id ||
                                                n.name === s.name
                                            );
                                            let workingCat = current;
                                            if (!subNode) {
                                              workingCat = await addNode(
                                                c._id,
                                                [],
                                                s.name,
                                                s._id
                                              );
                                              subNode = (
                                                workingCat.nodes || []
                                              ).find(
                                                (n) =>
                                                  n.legacyRef === s._id ||
                                                  n.name === s.name
                                              );
                                            }
                                            let xNode = (
                                              subNode.children || []
                                            ).find(
                                              (cn) =>
                                                cn.legacyRef === x._id ||
                                                cn.name === x.name
                                            );
                                            if (!xNode) {
                                              workingCat = await addNode(
                                                c._id,
                                                [subNode._id],
                                                x.name,
                                                x._id
                                              );
                                              const subRef = (
                                                workingCat.nodes || []
                                              ).find(
                                                (n) => n._id === subNode._id
                                              );
                                              xNode = subRef?.children?.find(
                                                (cn) =>
                                                  cn.legacyRef === x._id ||
                                                  cn.name === x.name
                                              );
                                            }
                                            const childName = prompt(
                                              "Add child under " + x.name
                                            );
                                            if (!childName) return;
                                            const updated = await addNode(
                                              c._id,
                                              [subNode._id, xNode._id],
                                              childName
                                            );
                                            setCategories((prev) =>
                                              prev.map((cc) =>
                                                cc._id === c._id ? updated : cc
                                              )
                                            );
                                          }}
                                          className={`px-2.5 py-1 text-xs rounded-md border bg-white hover:bg-blue-50 ${c1.border}`}
                                          title="Create a nested node under this item"
                                        >
                                          Add Nested Item
                                        </button>
                                        <button
                                          onClick={() =>
                                            onRenameSecondary(
                                              c._id,
                                              s._id,
                                              x._id
                                            )
                                          }
                                          className="px-2.5 py-1 text-xs rounded-md border bg-white hover:bg-gray-50"
                                        >
                                          Rename
                                        </button>
                                        <button
                                          onClick={() =>
                                            onDeleteSecondary(
                                              c._id,
                                              s._id,
                                              x._id
                                            )
                                          }
                                          className="px-2.5 py-1 text-xs rounded-md border bg-white text-red-600 hover:bg-red-50"
                                        >
                                          Delete
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {/* Recursive Tree (up to 5 levels) */}
                    <div className="mt-6">
                      <RecursiveTree
                        categoryId={c._id}
                        roots={c.nodes || []}
                        depthColors={depthColors}
                        onAdd={async (parentPath) => {
                          const name = prompt("Node name");
                          if (!name) return;
                          const updated = await addNode(
                            c._id,
                            parentPath,
                            name
                          );
                          setCategories((prev) =>
                            prev.map((cc) => (cc._id === c._id ? updated : cc))
                          );
                        }}
                        onRename={async (path) => {
                          const name = prompt("Rename node");
                          if (!name) return;
                          const updated = await updateNode(c._id, path, name);
                          setCategories((prev) =>
                            prev.map((cc) => (cc._id === c._id ? updated : cc))
                          );
                        }}
                        onDelete={async (path) => {
                          if (!confirm("Delete this node?")) return;
                          const updated = await deleteNode(c._id, path);
                          setCategories((prev) =>
                            prev.map((cc) => (cc._id === c._id ? updated : cc))
                          );
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecursiveTree({
  categoryId,
  roots,
  depthColors,
  onAdd,
  onRename,
  onDelete,
  pathPrefix = [],
}) {
  return (
    <div className="space-y-3">
      {roots.length === 0 && (
        <button
          onClick={() => onAdd(pathPrefix)}
          className="px-3 py-1.5 text-sm rounded-md border"
        >
          Add Root Node
        </button>
      )}
      {roots.map((node) => (
        <TreeNode
          key={node._id}
          node={node}
          path={[...pathPrefix, node._id]}
          depthColors={depthColors}
          onAdd={onAdd}
          onRename={onRename}
          onDelete={onDelete}
          depth={0}
        />
      ))}
    </div>
  );
}

function TreeNode({
  node,
  path,
  onAdd,
  onRename,
  onDelete,
  depthColors,
  depth = 0,
}) {
  const palette = [
    "border-blue-300 ring-blue-200 bg-white",
    "border-purple-300 ring-purple-200 bg-white",
    "border-emerald-300 ring-emerald-200 bg-white",
    "border-amber-300 ring-amber-200 bg-white",
    "border-pink-300 ring-pink-200 bg-white",
  ];
  const p = palette[depth % palette.length];
  return (
    <div
      className={`border rounded-lg p-3 ring-1 ${p} shadow-sm`}
      style={{ marginLeft: depth > 0 ? 4 : 0 }}
    >
      <div className="flex items-center justify-between">
        <div className="font-medium flex items-center gap-2">
          <span
            className={`px-2 py-0.5 text-[10px] rounded-full ${
              depthColors[depth % depthColors.length].bg
            } ${depthColors[depth % depthColors.length].text}`}
          >{`Level ${depth + 1}`}</span>
          <span>{node.name}</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onAdd(path)}
            className="px-2 py-1 text-xs rounded border"
          >
            Add Child
          </button>
          <button
            onClick={() => onRename(path)}
            className="px-2 py-1 text-xs rounded border"
          >
            Rename
          </button>
          <button
            onClick={() => onDelete(path)}
            className="px-2 py-1 text-xs rounded border text-red-600"
          >
            Delete
          </button>
        </div>
      </div>
      {/* connectors */}
      {Array.isArray(node.children) && node.children.length > 0 && (
        <div className="ml-4 mt-3 border-l pl-4 space-y-3">
          {node.children.map((child) => (
            <TreeNode
              key={child._id}
              node={child}
              path={[...path, child._id]}
              depthColors={depthColors}
              onAdd={onAdd}
              onRename={onRename}
              onDelete={onDelete}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
