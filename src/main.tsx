import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";

import AppLayout from "@/layout/AppLayout";

// Público (sin sidebar)
import Home from "@/pages/Home";
import PortalLogin from "@/portal/PortalLogin";
import PortalPoints from "@/portal/PortalPoints";

// Panel (con sidebar)
import CustomersPage from "@/pages/Customers";
import CustomersNew from "@/pages/CustomersNew";
import StaffNew from "@/pages/StaffNew";
import CustomerDetail from "./pages/CustomerDetail";

import "./index.css";

const qc = new QueryClient();

const router = createBrowserRouter([
  // HOME bonito en "/"
  { path: "/", element: <Home /> },

  // Portal cliente
  { path: "/portal", element: <PortalLogin /> },
  { path: "/portal/points", element: <PortalPoints /> },

  // Dashboard interno con sidebar en /app/*
  {
    path: "/app",
    element: <AppLayout />,
    children: [
      { index: true, element: <CustomersPage /> },
      { path: "customers/new", element: <CustomersNew /> },
      { path: "customers/:id", element: <CustomerDetail /> },
      { path: "staff/new", element: <StaffNew /> },
    ],
  },

  // Redirecciones antiguas (por si quedaron marcadores)
  { path: "/customers/:id", element: <Navigate to="/app/customers/:id" replace /> },
  { path: "/customers/new", element: <Navigate to="/app/customers/new" replace /> },
  { path: "/staff/new", element: <Navigate to="/app/staff/new" replace /> },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={qc}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>
);
