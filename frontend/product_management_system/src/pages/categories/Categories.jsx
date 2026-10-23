import { useState, useEffect } from "react";
import {
  Layers,
  GitBranch,
  Plus,
  Edit3,
  Trash2,
  Search,
  Package,
  FolderTree,
} from "lucide-react";
import axiosInstance from "../../api/axiosInstance";
import { useAuth } from "../../context/AuthContext";
import Modal from "../../components/common/Modal";
import toast from "react-hot-toast";

const Categories = () => {
  const { isAdminOrSuper } = useAuth();

  const [activeTab, setActiveTab] = useState("categories"); // 'categories' | 'subcategories'
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Category Modal State
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [catName, setCatName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Subcategory Modal State
  const [subModalOpen, setSubModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState(null);
  const [subForm, setSubForm] = useState({ name: "", parentCategory: "" });

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [catRes, subRes] = await Promise.all([
        axiosInstance.get("/categories"),
        axiosInstance.get("/subCategories"),
      ]);
      if (catRes.data.success) setCategories(catRes.data.data);
      if (subRes.data.success) setSubCategories(subRes.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // ---------------- CATEGORY HANDLERS ----------------
  const openCreateCategory = () => {
    setEditingCat(null);
    setCatName("");
    setCatModalOpen(true);
  };

  const openEditCategory = (cat) => {
    setEditingCat(cat);
    setCatName(cat.name);
    setCatModalOpen(true);
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingCat) {
        const res = await axiosInstance.patch(
          `/category/update/${editingCat._id}`,
          {
            name: catName,
          },
        );
        if (res.data.success) toast.success("Category updated successfully");
      } else {
        const res = await axiosInstance.post("/category/create", {
          name: catName,
        });
        if (res.data.success) toast.success("Category created successfully");
      }
      setCatModalOpen(false);
      fetchAllData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Operation failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCategory = async (cat) => {
    if (
      !window.confirm(`Are you sure you want to delete category "${cat.name}"?`)
    )
      return;

    try {
      const res = await axiosInstance.delete(`/category/delete/${cat._id}`);
      if (res.data.success) {
        toast.success(res.data.message || "Category deleted");
        fetchAllData();
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          "Cannot delete category with dependent subcategories or products",
      );
    }
  };

  // ---------------- SUBCATEGORY HANDLERS ----------------
  const openCreateSubCategory = (preselectedParentId = "") => {
    if (categories.length === 0) {
      return toast.error("Please create at least one Category first!");
    }
    setEditingSub(null);
    setSubForm({
      name: "",
      parentCategory: preselectedParentId || categories[0]?._id || "",
    });
    setSubModalOpen(true);
  };

  const openEditSubCategory = (sub) => {
    setEditingSub(sub);
    setSubForm({
      name: sub.name,
      parentCategory: sub.parentCategory,
    });
    setSubModalOpen(true);
  };

  const handleSubCategorySubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingSub) {
        const res = await axiosInstance.patch(
          `/subCategory/update/${editingSub._id}`,
          subForm,
        );
        if (res.data.success) toast.success("Subcategory updated successfully");
      } else {
        const res = await axiosInstance.post("/subCategory/create", subForm);
        if (res.data.success) toast.success("Subcategory created successfully");
      }
      setSubModalOpen(false);
      fetchAllData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Operation failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSubCategory = async (sub) => {
    if (
      !window.confirm(
        `Are you sure you want to delete subcategory "${sub.name}"?`,
      )
    )
      return;

    try {
      const res = await axiosInstance.delete(`/subCategory/delete/${sub._id}`);
      if (res.data.success) {
        toast.success(res.data.message || "Subcategory deleted");
        fetchAllData();
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          "Cannot delete subcategory with associated products",
      );
    }
  };

  // Filtered Lists
  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  );

  const filteredSubCategories = subCategories.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.categoryName?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-5">
      {/* Header & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold text-slate-100 flex items-center gap-2">
            <FolderTree className="w-6 h-6 text-amber-400 shrink-0" />
            <span>Category & Subcategory Hub</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Single-collection hierarchical taxonomy with dependency protection
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={openCreateCategory}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs sm:text-sm shadow-lg shadow-amber-500/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Category</span>
          </button>

          <button
            onClick={() => openCreateSubCategory()}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 font-semibold text-xs sm:text-sm transition cursor-pointer"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Add Subcategory</span>
          </button>
        </div>
      </div>

      {/* Tabs + Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-3 rounded-2xl">
        {/* Toggle Tabs */}
        <div className="grid grid-cols-2 sm:flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab("categories")}
            className={`flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition cursor-pointer ${
              activeTab === "categories"
                ? "bg-amber-500 text-slate-950 font-semibold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Layers className="w-4 h-4 shrink-0" />
            <span>Categories ({categories.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("subcategories")}
            className={`flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition cursor-pointer ${
              activeTab === "subcategories"
                ? "bg-amber-500 text-slate-950 font-semibold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <GitBranch className="w-4 h-4 shrink-0" />
            <span>Subcategories ({subCategories.length})</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64 md:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              activeTab === "categories"
                ? "Search category name..."
                : "Search subcategory or parent..."
            }
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* TAB 1: CATEGORIES VIEW */}
      {activeTab === "categories" && (
        <div>
          {loading ? (
            <div className="py-16 text-center text-sm text-slate-400">
              Loading categories...
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-10 text-center space-y-3">
              <Layers className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm text-slate-400">No categories found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredCategories.map((cat) => (
                <div
                  key={cat._id}
                  className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-4 transition"
                >
                  <div>
                    {/* Top Row: Name + Actions */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="text-base sm:text-lg font-bold text-slate-100 truncate">
                          {cat.name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-medium">
                            <Package className="w-3 h-3" />
                            {cat.productCount || 0} Products
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-500/15 border border-sky-500/30 text-sky-400 text-xs font-medium">
                            <GitBranch className="w-3 h-3" />
                            {cat.subCategories?.length || 0} Subcategories
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => openEditCategory(cat)}
                          title="Edit Category"
                          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 transition cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        {isAdminOrSuper && (
                          <button
                            onClick={() => handleDeleteCategory(cat)}
                            title="Delete Category"
                            className="p-2 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Associated Subcategories Chips */}
                    <div className="mt-4 pt-3 border-t border-slate-800/80">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-slate-400">
                          Associated Subcategories:
                        </span>
                        <button
                          onClick={() => openCreateSubCategory(cat._id)}
                          className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-0.5 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" /> Add Sub
                        </button>
                      </div>

                      {cat.subCategories && cat.subCategories.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {cat.subCategories.map((sub) => (
                            <span
                              key={sub._id}
                              className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300"
                            >
                              {sub.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 italic">
                          No subcategories assigned yet
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SUBCATEGORIES VIEW */}
      {activeTab === "subcategories" && (
        <div>
          {loading ? (
            <div className="py-16 text-center text-sm text-slate-400">
              Loading subcategories...
            </div>
          ) : filteredSubCategories.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-10 text-center space-y-3">
              <GitBranch className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm text-slate-400">No subcategories found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSubCategories.map((sub) => (
                <div
                  key={sub._id}
                  className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-3 transition"
                >
                  <div className="min-w-0 space-y-1.5">
                    <h3 className="text-sm sm:text-base font-bold text-slate-100 truncate">
                      {sub.name}
                    </h3>
                    <p className="text-xs text-slate-400 truncate">
                      Category:{" "}
                      <span className="text-amber-400 font-medium">
                        {sub.categoryName}
                      </span>
                    </p>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-500/15 border border-sky-500/30 text-sky-400 text-[11px] font-medium">
                      <Package className="w-3 h-3" />
                      {sub.productCount || 0} Products
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => openEditSubCategory(sub)}
                      title="Edit Subcategory"
                      className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 transition cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    {isAdminOrSuper && (
                      <button
                        onClick={() => handleDeleteSubCategory(sub)}
                        title="Delete Subcategory"
                        className="p-2 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: CREATE / EDIT CATEGORY */}
      <Modal
        isOpen={catModalOpen}
        onClose={() => setCatModalOpen(false)}
        title={editingCat ? "Edit Category" : "Create New Category"}
      >
        <form onSubmit={handleCategorySubmit} className="space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5">
              Category Name
            </label>
            <input
              type="text"
              required
              minLength={2}
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              placeholder="e.g. Electronics, Apparel, Home Decor"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setCatModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs sm:text-sm text-slate-300 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs sm:text-sm transition disabled:opacity-50 cursor-pointer"
            >
              {submitting
                ? "Saving..."
                : editingCat
                  ? "Update Category"
                  : "Create Category"}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: CREATE / EDIT SUBCATEGORY */}
      <Modal
        isOpen={subModalOpen}
        onClose={() => setSubModalOpen(false)}
        title={editingSub ? "Edit Subcategory" : "Create New Subcategory"}
      >
        <form onSubmit={handleSubCategorySubmit} className="space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5">
              Select Parent Category
            </label>
            <select
              required
              value={subForm.parentCategory}
              onChange={(e) =>
                setSubForm({ ...subForm, parentCategory: e.target.value })
              }
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-amber-500"
            >
              <option value="" disabled>
                -- Choose a Parent Category --
              </option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5">
              Subcategory Name
            </label>
            <input
              type="text"
              required
              minLength={2}
              value={subForm.name}
              onChange={(e) => setSubForm({ ...subForm, name: e.target.value })}
              placeholder="e.g. Smartphones, Laptops, Men's Wear"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setSubModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs sm:text-sm text-slate-300 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs sm:text-sm transition disabled:opacity-50 cursor-pointer"
            >
              {submitting
                ? "Saving..."
                : editingSub
                  ? "Update Subcategory"
                  : "Create Subcategory"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Categories;
