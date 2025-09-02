// partner-web/src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
  useParams,
} from "react-router-dom";

// Público (sin sidebar)
import Home from "@/pages/Home";
import PortalLogin from "@/portal/PortalLogin";
import PortalPoints from "@/portal/PortalPoints";
import StaffCheckin from "@/pages/StaffCheckin";

// Panel (con layout unificado por página)
import CustomersPage from "@/pages/Customers";
import CustomersNew from "@/pages/CustomersNew";
import StaffNew from "@/pages/StaffNew";
import CustomerDetail from "@/pages/CustomerDetail";

import "./index.css";

const qc = new QueryClient();

/** ===== Wrappers para redirecciones legacy con params dinámicos ===== */
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
  // HOME bonito en "/"
  { path: "/", element: <Home /> },

  // Portal cliente (público)
  { path: "/portal", element: <PortalLogin /> },
  { path: "/portal/points", element: <PortalPoints /> },

  // Check-in Staff (público: para kiosko/QR directo)
  { path: "/staff/checkin", element: <StaffCheckin /> },

  // Dashboard interno en /app/*
  {
    path: "/app",
    children: [
      // Dashboard → Clientes por defecto
      { index: true, element: <CustomersPage /> },

      // Clientes
      { path: "customers", element: <CustomersPage /> },
      { path: "customers/new", element: <CustomersNew /> },
      { path: "customers/:id", element: <CustomerDetail /> },

      // Staff
      { path: "staff/new", element: <StaffNew /> },
      { path: "staff/checkin", element: <StaffCheckin /> }, // ← versión con layout unificado

      // Portal (vista interna de puntos para demo/soporte)
      { path: "portal/points", element: <PortalPoints /> }, // ← misma pantalla, con AppLayout si la página lo usa
    ],
  },

  // Redirecciones antiguas (por si quedaron marcadores)
  { path: "/customers/new", element: <LegacyCustomersNewToApp /> },
  { path: "/customers/:id", element: <LegacyCustomerToApp /> },
  { path: "/staff/new", element: <LegacyStaffNewToApp /> },

  // Fallback 404 básico: vuelve al Home
  { path: "*", element: <Navigate to="/" replace /> },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={qc}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>
);
