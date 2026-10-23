import { useState, useEffect, useCallback } from "react";
import {
  Users as UsersIcon,
  UserPlus,
  Search,
  Edit3,
  Trash2,
  Power,
  Mail,
  Shield,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import axiosInstance from "../../api/axiosInstance";
import { useAuth } from "../../context/AuthContext";
import Modal from "../../components/common/Modal";
import Pagination from "../../components/common/Pagination";
import toast from "react-hot-toast";

const Users = () => {
  const { user: currentUser, isSuperAdmin } = useAuth();

  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 8,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    page: 1,
    limit: 8,
    search: "",
    role: "",
  });

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    roleName: "User",
  });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: filters.page,
        limit: filters.limit,
      };
      if (filters.search.trim()) params.search = filters.search.trim();
      if (filters.role) params.role = filters.role;

      const res = await axiosInstance.get("/users", { params });
      if (res.data.success) {
        setUsers(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const canModifyTargetUser = (targetUser) => {
    if (targetUser.role === "Super Admin") return false;
    if (isSuperAdmin) return true;

    return targetUser.role === "User";
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({
      name: "",
      email: "",
      roleName: "User",
    });
    setModalOpen(true);
  };

  const openEditModal = (target) => {
    setEditingUser(target);
    setFormData({
      name: target.name,
      email: target.email,
      roleName: target.role,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingUser) {
        const payload = {
          name: formData.name,
          email: formData.email,
          ...(isSuperAdmin ? { roleName: formData.roleName } : {}),
        };
        const res = await axiosInstance.patch(
          `/users/${editingUser._id}`,
          payload,
        );
        if (res.data.success) toast.success("User updated successfully");
      } else {
        const res = await axiosInstance.post("/users", formData);
        if (res.data.success) {
          toast.success(
            res.data.message ||
              "Account created & auto-generated password emailed!",
          );
        }
      }
      setModalOpen(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Operation failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (target) => {
    try {
      const res = await axiosInstance.patch(`/users/${target._id}/status`, {
        isActive: !target.isActive,
      });
      if (res.data.success) {
        toast.success(res.data.message);
        fetchUsers();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update status");
    }
  };

  const handleDeleteUser = async (target) => {
    if (
      !window.confirm(
        `Are you sure you want to permanently delete user "${target.name}"?`,
      )
    )
      return;
    try {
      const res = await axiosInstance.delete(`/users/${target._id}`);
      if (res.data.success) {
        toast.success(res.data.message || "User deleted");
        fetchUsers();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete user");
    }
  };

  const getRoleBadge = (role) => {
    if (role === "Super Admin")
      return "bg-amber-500/15 text-amber-400 border-amber-500/30";
    if (role === "Admin") return "bg-sky-500/15 text-sky-400 border-sky-500/30";
    return "bg-slate-800 text-slate-300 border-slate-700";
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold text-slate-100 flex items-center gap-2">
            <UsersIcon className="w-6 h-6 text-amber-400 shrink-0" />
            <span>User & Role Administration</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            {isSuperAdmin
              ? "Super Admin Mode: Create & manage Admin and User accounts"
              : "Admin Mode: Manage standard User accounts"}
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="self-stretch sm:self-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs sm:text-sm shadow-lg shadow-amber-500/20 transition cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>{isSuperAdmin ? "Create Admin / User" : "Create User"}</span>
        </button>
      </div>

      {/* Search & Role Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) =>
              setFilters({ ...filters, search: e.target.value, page: 1 })
            }
            placeholder="Search by user name or email..."
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <select
          value={filters.role}
          onChange={(e) =>
            setFilters({ ...filters, role: e.target.value, page: 1 })
          }
          className="w-full sm:w-48 px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-amber-500"
        >
          <option value="">All Roles</option>
          <option value="Super Admin">Super Admin</option>
          <option value="Admin">Admin</option>
          <option value="User">User</option>
        </select>
      </div>

      {/* Users List */}
      {loading ? (
        <div className="py-16 text-center text-sm text-slate-400">
          Loading user accounts...
        </div>
      ) : users.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-10 text-center space-y-2">
          <UsersIcon className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-sm text-slate-400">No users found.</p>
        </div>
      ) : (
        <>
          {/* 1. MOBILE CARD VIEW (320px to 767px) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 md:hidden">
            {users.map((u) => {
              const editable = canModifyTargetUser(u);
              return (
                <div
                  key={u._id}
                  className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-slate-100 truncate">
                        {u.name}
                      </h3>
                      <p className="text-xs text-slate-400 truncate">
                        {u.email}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-md border text-[10px] font-semibold uppercase shrink-0 ${getRoleBadge(
                        u.role,
                      )}`}
                    >
                      {u.role}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-medium ${
                        u.isActive ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {u.isActive ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5" />
                      )}
                      {u.isActive ? "Active" : "Deactivated"}
                    </span>

                    {editable ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleToggleStatus(u)}
                          title={u.isActive ? "Deactivate" : "Activate"}
                          className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-amber-400 cursor-pointer"
                        >
                          <Power className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(u)}
                          title="Edit User"
                          className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-amber-400 cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u)}
                          title="Delete User"
                          className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-rose-400 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-500 italic">
                        Protected Role
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 2. DESKTOP TABLE VIEW (md: 768px+) */}
          <div className="hidden md:block bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    <th className="py-3.5 px-5">User</th>
                    <th className="py-3.5 px-4">Role</th>
                    <th className="py-3.5 px-4">Account Status</th>
                    <th className="py-3.5 px-4">Joined</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70 text-sm">
                  {users.map((u) => {
                    const editable = canModifyTargetUser(u);
                    return (
                      <tr
                        key={u._id}
                        className="hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3.5 px-5">
                          <p className="font-semibold text-slate-100">
                            {u.name}{" "}
                            {currentUser?.id === u._id && (
                              <span className="text-[10px] ml-1 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                                You
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-slate-400">{u.email}</p>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-md border text-xs font-semibold ${getRoleBadge(
                              u.role,
                            )}`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${
                              u.isActive
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                                : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                u.isActive ? "bg-emerald-400" : "bg-rose-400"
                              }`}
                            />
                            {u.isActive ? "Active" : "Deactivated"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-400">
                          {u.createdAt
                            ? new Date(u.createdAt).toLocaleDateString()
                            : "N/A"}
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          {editable ? (
                            <div className="inline-flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleToggleStatus(u)}
                                title={
                                  u.isActive
                                    ? "Deactivate Account"
                                    : "Activate Account"
                                }
                                className={`p-2 rounded-lg bg-slate-800 transition cursor-pointer ${
                                  u.isActive
                                    ? "text-emerald-400 hover:bg-rose-500/20 hover:text-rose-400"
                                    : "text-rose-400 hover:bg-emerald-500/20 hover:text-emerald-400"
                                }`}
                              >
                                <Power className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => openEditModal(u)}
                                title="Edit User"
                                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 transition cursor-pointer"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteUser(u)}
                                title="Delete User"
                                className="p-2 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-500 italic">
                              Protected
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <Pagination
            pagination={pagination}
            onPageChange={(newPage) =>
              setFilters({ ...filters, page: newPage })
            }
          />
        </>
      )}

      {/* CREATE / EDIT USER MODAL */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingUser ? "Edit User Account" : "Create New User Account"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {!editingUser && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex items-start gap-2">
              <Mail className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                An autogenerated temporary password will be sent directly to the
                user&apos;s email upon creation.
              </span>
            </div>
          )}

          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              required
              minLength={2}
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Enter full name"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder="user@company.com"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Role Selection: Only Super Admin can choose 'Admin' role */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-amber-400" />
              <span>Assign Role</span>
            </label>
            <select
              value={formData.roleName}
              onChange={(e) =>
                setFormData({ ...formData, roleName: e.target.value })
              }
              disabled={!isSuperAdmin}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-amber-500 disabled:opacity-60"
            >
              <option value="User">User (Standard Inventory Access)</option>
              {isSuperAdmin && (
                <option value="Admin">
                  Admin (User & Inventory Management)
                </option>
              )}
            </select>
            {!isSuperAdmin && (
              <p className="text-[11px] text-slate-500 mt-1">
                Only Super Admin can assign or modify Admin roles.
              </p>
            )}
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
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs sm:text-sm transition disabled:opacity-50 cursor-pointer"
            >
              {submitting
                ? "Saving..."
                : editingUser
                  ? "Save Changes"
                  : "Create Account"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Users;
