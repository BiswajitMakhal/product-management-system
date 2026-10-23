import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/common/ProtectedRoute";
import AppLayout from "./components/layout/AppLayout";

// Auth Pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";

// Protected App Pages
import Dashboard from "./pages/dashboard/Dashboard";
import Products from "./pages/products/Products";
import Categories from "./pages/categories/Categories";
import Users from "./pages/users/Users";
import ChangePassword from "./pages/settings/ChangePassword";

const HomeRedirect = () => {
  const { user, isAdminOrSuper } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={isAdminOrSuper ? "/dashboard" : "/products"} replace />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              background: "#0f172a",
              color: "#f8fafc",
              border: "1px solid #334155",
              fontSize: "13px",
            },
          }}
        />

        <Routes>
          {/* Default Root Redirect */}
          <Route path="/" element={<HomeRedirect />} />

          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          {/* Protected Routes inside AppLayout */}
          <Route
            element={
              <ProtectedRoute allowedRoles={["Super Admin", "Admin", "User"]} />
            }
          >
            <Route element={<AppLayout />}>
              {/* Product, Category & Password Settings (Accessible by All Logged-in Roles) */}
              <Route path="/products" element={<Products />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/settings" element={<ChangePassword />} />

              {/* Admin & Super Admin Exclusive Routes */}
              <Route
                element={
                  <ProtectedRoute allowedRoles={["Super Admin", "Admin"]} />
                }
              >
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/users" element={<Users />} />
              </Route>
            </Route>
          </Route>

          {/* Fallback 404 Redirect */}
          <Route path="*" element={<HomeRedirect />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
