// partner-web/src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
  useParams,
  Outlet,
} from "react-router-dom";

// Públicas
import Home from "@/pages/Home";
import PortalLogin from "@/portal/PortalLogin";
import PortalPoints from "@/portal/PortalPoints";
import StaffCheckin from "@/pages/StaffCheckin";
import LoginStaff from "@/pages/LoginStaff";
import Unauthorized from "@/pages/Unauthorized";

// Legales (públicas)
import Privacidad from "@/pages/Legal/Privacidad";
import AvisoLegal from "@/pages/Legal/AvisoLegal";
import Cookies from "@/pages/Legal/Cookies";

// Panel
import CustomersPage from "@/pages/Customers";
import CustomersNew from "@/pages/CustomersNew";
import CustomerDetail from "@/pages/CustomerDetail";
import StaffNew from "@/pages/StaffNew";
import AdminPanel from "@/pages/AdminPanel";
import AdminUsers from "@/pages/AdminUsers";

import ProtectedRoute from "@/components/ProtectedRoute";

import "./index.css";

const qc = new QueryClient();

/** Redirecciones legacy */
function LegacyCustomerToApp() {
  const { id } = useParams();
  return <Navigate to={`/app/customers/${id}`} replace />;
}
function LegacyCustomersNewToApp() {
  return <Navigate to="/app/customers/new" replace />;
}
function LegacyStaffNewToApp() {
  return <Navigate to="/app/staff/new" replace />;
}

const router = createBrowserRouter([
  // Home
  { path: "/", element: <Home /> },

  // Legales (públicas) -> paths en minúsculas
  { path: "/legal/privacidad", element: <Privacidad /> },
  { path: "/legal/aviso", element: <AvisoLegal /> },
  { path: "/legal/cookies", element: <Cookies /> },

  // Login staff y acceso denegado
  { path: "/login", element: <LoginStaff /> },
  { path: "/unauthorized", element: <Unauthorized /> },

  // Portal cliente (público)
  { path: "/portal", element: <PortalLogin /> },
  { path: "/portal/points", element: <PortalPoints /> },

  // Check-in Staff (público para QR/kiosko)
  { path: "/staff/checkin", element: <StaffCheckin /> },

  // Panel interno en /app/* (protegido a nivel de rama)
  {
    path: "/app",
    element: (
      <ProtectedRoute roles={["ADMIN", "BARBER", "OWNER", "SUPERADMIN"]}>
        <Outlet />
      </ProtectedRoute>
    ),
    children: [
      // Por defecto, enviar al Admin Panel
      { index: true, element: <Navigate to="admin" replace /> },

      // Admin Panel (ya protegido por el wrapper superior)
      { path: "admin", element: <AdminPanel /> },

      // Usuarios (roles más restrictivos)
      {
        path: "users",
        element: (
          <ProtectedRoute roles={["ADMIN", "OWNER", "SUPERADMIN"]}>
            <AdminUsers />
          </ProtectedRoute>
        ),
      },

      // Clientes
      {
        path: "customers",
        element: (
          <ProtectedRoute roles={["ADMIN", "BARBER", "OWNER", "SUPERADMIN"]}>
            <CustomersPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "customers/new",
        element: (
          <ProtectedRoute roles={["ADMIN", "BARBER", "OWNER", "SUPERADMIN"]}>
            <CustomersNew />
          </ProtectedRoute>
        ),
      },
      {
        path: "customers/:id",
        element: (
          <ProtectedRoute roles={["ADMIN", "BARBER", "OWNER", "SUPERADMIN"]}>
            <CustomerDetail />
          </ProtectedRoute>
        ),
      },

      // Staff (ADMIN, OWNER, SUPERADMIN)
      {
        path: "staff/new",
        element: (
          <ProtectedRoute roles={["ADMIN", "OWNER", "SUPERADMIN"]}>
            <StaffNew />
          </ProtectedRoute>
        ),
      },

      // Versión con layout interno (protegida)
      {
        path: "staff/checkin",
        element: (
          <ProtectedRoute roles={["ADMIN", "BARBER", "OWNER", "SUPERADMIN"]}>
            <StaffCheckin />
          </ProtectedRoute>
        ),
      },

      // (Opcional) Portal points dentro del panel
      {
        path: "portal/points",
        element: (
          <ProtectedRoute roles={["ADMIN", "BARBER", "OWNER", "SUPERADMIN"]}>
            <PortalPoints />
          </ProtectedRoute>
        ),
      },
    ],
  },

  // Redirecciones antiguas
  { path: "/customers/new", element: <LegacyCustomersNewToApp /> },
  { path: "/customers/:id", element: <LegacyCustomerToApp /> },
  { path: "/staff/new", element: <LegacyStaffNewToApp /> },

  // Fallback
  { path: "*", element: <Navigate to="/" replace /> },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={qc}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>
);
