import { useState, useEffect, useCallback } from "react";
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit3,
  Trash2,
  ArrowUpDown,
  RotateCcw,
  Tag,
  Layers,
  GitBranch,
  IndianRupee,
} from "lucide-react";
import axiosInstance from "../../api/axiosInstance";
import { useAuth } from "../../context/AuthContext";
import Modal from "../../components/common/Modal";
import Pagination from "../../components/common/Pagination";
import toast from "react-hot-toast";

const Products = () => {
  const { isAdminOrSuper } = useAuth();

  // Products & Taxonomy state
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 8,
    total: 0,
    totalPages: 1,
  });
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter & Sort Query State
  const [filters, setFilters] = useState({
    page: 1,
    limit: 8,
    search: "",
    category: "",
    subcategory: "",
    minPrice: "",
    maxPrice: "",
    sort: "createdAt",
    order: "desc",
  });

  // Add/Edit Product Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    subCategory: "",
  });

  useEffect(() => {
    const fetchTaxonomy = async () => {
      try {
        const [catRes, subRes] = await Promise.all([
          axiosInstance.get("/categories"),
          axiosInstance.get("/subCategories"),
        ]);
        if (catRes.data.success) setCategories(catRes.data.data);
        if (subRes.data.success) setSubCategories(subRes.data.data);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      }
    };
    fetchTaxonomy();
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: filters.page,
        limit: filters.limit,
        sort: filters.sort,
        order: filters.order,
      };
      if (filters.search.trim()) params.search = filters.search.trim();
      if (filters.category) params.category = filters.category;
      if (filters.subcategory) params.subcategory = filters.subcategory;
      if (filters.minPrice !== "") params.minPrice = filters.minPrice;
      if (filters.maxPrice !== "") params.maxPrice = filters.maxPrice;

      const res = await axiosInstance.get("/products", { params });
      if (res.data.success) {
        setProducts(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const filterSubCategoryOptions = filters.category
    ? subCategories.filter(
        (sub) => String(sub.parentCategory) === String(filters.category),
      )
    : subCategories;

  const formSubCategoryOptions = formData.category
    ? subCategories.filter(
        (sub) => String(sub.parentCategory) === String(formData.category),
      )
    : [];

  const handleResetFilters = () => {
    setFilters({
      page: 1,
      limit: 8,
      search: "",
      category: "",
      subcategory: "",
      minPrice: "",
      maxPrice: "",
      sort: "createdAt",
      order: "desc",
    });
  };

  const openCreateModal = () => {
    if (categories.length === 0 || subCategories.length === 0) {
      return toast.error(
        "Please create at least one Category and Subcategory first!",
      );
    }
    setEditingProduct(null);
    const defaultCatId = categories[0]?._id || "";
    const firstMatchingSub = subCategories.find(
      (s) => String(s.parentCategory) === String(defaultCatId),
    );
    setFormData({
      name: "",
      description: "",
      price: "",
      category: defaultCatId,
      subCategory: firstMatchingSub ? firstMatchingSub._id : "",
    });
    setModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || "",
      description: product.description || "",
      price: product.price || "",
      category: product.category || "",
      subCategory: product.subCategory || "",
    });
    setModalOpen(true);
  };

  const handleFormCategoryChange = (newCatId) => {
    const matchingSubs = subCategories.filter(
      (s) => String(s.parentCategory) === String(newCatId),
    );
    setFormData({
      ...formData,
      category: newCatId,
      subCategory: matchingSubs[0]?._id || "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.subCategory) {
      return toast.error(
        "Selected category has no subcategories. Please create one first.",
      );
    }
    setSubmitting(true);
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        price: Number(formData.price),
        category: formData.category,
        subCategory: formData.subCategory,
      };

      if (editingProduct) {
        const res = await axiosInstance.patch(
          `/products/${editingProduct._id}`,
          payload,
        );
        if (res.data.success) toast.success("Product updated successfully");
      } else {
        const res = await axiosInstance.post("/products", payload);
        if (res.data.success) toast.success("Product added successfully");
      }
      setModalOpen(false);
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save product");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`Are you sure you want to delete "${product.name}"?`))
      return;
    try {
      const res = await axiosInstance.delete(`/products/${product._id}`);
      if (res.data.success) {
        toast.success("Product deleted successfully");
        fetchProducts();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed");
    }
  };

  return (
    <div className="space-y-5">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Package className="w-6 h-6 text-amber-400 shrink-0" />
            <span>Product Inventory</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Aggregated catalog with dynamic category-subcategory validation
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="self-stretch sm:self-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs sm:text-sm shadow-lg shadow-amber-500/20 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Filter, Search & Sort Control Panel (100% Responsive Grid) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 sm:p-5 space-y-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative sm:col-span-2 lg:col-span-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value, page: 1 })
              }
              placeholder="Search name or description..."
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={filters.category}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  category: e.target.value,
                  subcategory: "",
                  page: 1,
                })
              }
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Subcategory Filter (Dependent on selected Category) */}
          <div>
            <select
              value={filters.subcategory}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  subcategory: e.target.value,
                  page: 1,
                })
              }
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="">All Subcategories</option>
              {filterSubCategoryOptions.map((sub) => (
                <option key={sub._id} value={sub._id}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By + Order */}
          <div className="flex items-center gap-2">
            <select
              value={filters.sort}
              onChange={(e) =>
                setFilters({ ...filters, sort: e.target.value, page: 1 })
              }
              className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="createdAt">Sort: Newest</option>
              <option value="price">Sort: Price</option>
              <option value="name">Sort: Name</option>
            </select>

            <button
              type="button"
              onClick={() =>
                setFilters({
                  ...filters,
                  order: filters.order === "asc" ? "desc" : "asc",
                  page: 1,
                })
              }
              title={`Order: ${filters.order.toUpperCase()}`}
              className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 text-xs font-semibold text-amber-400 flex items-center gap-1 cursor-pointer shrink-0"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span className="uppercase">{filters.order}</span>
            </button>
          </div>
        </div>

        {/* Bottom Filter Row: Min/Max Price & Reset */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/70">
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-amber-400" /> Price Range:
            </span>
            <input
              type="number"
              min="0"
              placeholder="Min ₹"
              value={filters.minPrice}
              onChange={(e) =>
                setFilters({ ...filters, minPrice: e.target.value, page: 1 })
              }
              className="w-24 sm:w-28 px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-amber-500"
            />
            <span className="text-slate-600">-</span>
            <input
              type="number"
              min="0"
              placeholder="Max ₹"
              value={filters.maxPrice}
              onChange={(e) =>
                setFilters({ ...filters, maxPrice: e.target.value, page: 1 })
              }
              className="w-24 sm:w-28 px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          <button
            type="button"
            onClick={handleResetFilters}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-amber-400 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>
        </div>
      </div>

      {/* Product Listing Area */}
      {loading ? (
        <div className="py-16 text-center text-sm text-slate-400">
          Loading products...
        </div>
      ) : products.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <Package className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-semibold text-slate-300">
            No products match your criteria
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Try clearing your search filters or add a new product to the
            catalog.
          </p>
        </div>
      ) : (
        <>
          {/* 1. MOBILE & SMALL SCREEN CARD VIEW (320px to 767px) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 md:hidden">
            {products.map((prod) => (
              <div
                key={prod._id}
                className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between gap-3"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-bold text-slate-100 leading-snug">
                      {prod.name}
                    </h3>
                    <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 font-bold text-xs shrink-0">
                      ₹{Number(prod.price).toLocaleString()}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2">
                    {prod.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-[11px] text-slate-300">
                      <Layers className="w-3 h-3 text-amber-400" />
                      {prod.categoryName || "N/A"}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-[11px] text-sky-400">
                      <GitBranch className="w-3 h-3" />
                      {prod.subcategoryName || "N/A"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800/80">
                  <button
                    onClick={() => openEditModal(prod)}
                    className="flex-1 py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-amber-400" /> Edit
                  </button>
                  {isAdminOrSuper && (
                    <button
                      onClick={() => handleDelete(prod)}
                      className="py-1.5 px-3 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-xs font-medium text-rose-400 flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* 2. DESKTOP TABLE VIEW (md: 768px and above) */}
          <div className="hidden md:block bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    <th className="py-3.5 px-5">Product Details</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Subcategory</th>
                    <th className="py-3.5 px-4">Price</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70 text-sm">
                  {products.map((prod) => (
                    <tr
                      key={prod._id}
                      className="hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-5 max-w-xs lg:max-w-md">
                        <p className="font-semibold text-slate-100 truncate">
                          {prod.name}
                        </p>
                        <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                          {prod.description}
                        </p>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-medium">
                          {prod.categoryName || "N/A"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-medium">
                          {prod.subcategoryName || "N/A"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-100">
                        ₹{Number(prod.price).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(prod)}
                            title="Edit Product"
                            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 transition cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          {isAdminOrSuper && (
                            <button
                              onClick={() => handleDelete(prod)}
                              title="Delete Product"
                              className="p-2 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Component */}
          <Pagination
            pagination={pagination}
            onPageChange={(newPage) =>
              setFilters({ ...filters, page: newPage })
            }
          />
        </>
      )}

      {/* ADD / EDIT PRODUCT MODAL */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingProduct ? "Edit Product" : "Add New Product"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5">
              Product Name
            </label>
            <div className="relative">
              <Tag className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                minLength={2}
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g. MacBook Pro 16 M4"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5">
              Price
            </label>
            <div className="relative">
              <IndianRupee className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                placeholder="e.g. 149999"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5">
                Category
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) => handleFormCategoryChange(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-amber-500"
              >
                <option value="" disabled>
                  Select Category
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
                Subcategory
              </label>
              <select
                required
                value={formData.subCategory}
                onChange={(e) =>
                  setFormData({ ...formData, subCategory: e.target.value })
                }
                disabled={formSubCategoryOptions.length === 0}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-amber-500 disabled:opacity-50"
              >
                {formSubCategoryOptions.length === 0 ? (
                  <option value="">No subcategories under this category</option>
                ) : (
                  formSubCategoryOptions.map((sub) => (
                    <option key={sub._id} value={sub._id}>
                      {sub.name}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5">
              Description
            </label>
            <textarea
              rows={3}
              required
              minLength={5}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Write key specifications and product details..."
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs sm:text-sm text-slate-300 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || formSubCategoryOptions.length === 0}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs sm:text-sm transition disabled:opacity-50 cursor-pointer"
            >
              {submitting
                ? "Saving..."
                : editingProduct
                  ? "Update Product"
                  : "Create Product"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Products;
