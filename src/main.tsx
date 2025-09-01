// partner-web/src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import AppLayout from "@/layout/AppLayout";

// Páginas
import CustomersPage from "@/pages/Customers";
import CustomersNew from "@/pages/CustomersNew";
import StaffNew from "@/pages/StaffNew";
import CustomerDetail from "@/pages/CustomerDetail";
import PortalLogin from "@/portal/PortalLogin";
import PortalPoints from "@/portal/PortalPoints";

import "./index.css";

const qc = new QueryClient();

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <CustomersPage /> },
      { path: "customers/new", element: <CustomersNew /> },
      { path: "customers/:id", element: <CustomerDetail /> },
      { path: "staff/new", element: <StaffNew /> },
      { path: "portal", element: <PortalLogin /> },
      { path: "portal/points", element: <PortalPoints /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={qc}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>
);
