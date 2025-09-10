// src/AppRouter.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import RouteGuard from "./shared/RouteGuard";
import { useSession, isSuperAdmin, isAdmin } from "./shared/auth";

/* ==== Páginas ==== */
import Home from "./pages/Home";
import LoginStaff from "./pages/LoginStaff";
import Unauthorized from "./pages/Unauthorized";

/* Portal clientes */
import CustomerOTP from "./pages/CustomerOTP";
import PortalPoints from "./pages/PortalPoints";

/* Staff */
import StaffCheckin from "./pages/StaffCheckin";

/* Dashboard negocio */
import AdminPanel from "./pages/AdminPanel";
import CustomersPage from "./pages/CustomersPage";
import CustomerDetail from "./pages/CustomerDetail";
import CustomersNew from "./pages/CustomersNew";
import AdminUsers from "./pages/AdminUsers";

/* CPanel (solo SUPERADMIN) */
import CPanelAdminDashboard from "./pages/CPanelAdminDashboard";

export default function AppRouter() {
  const session = useSession();

  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginStaff />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Portal clientes */}
        <Route path="/portal" element={<CustomerOTP />} />
        <Route path="/portal/points" element={<PortalPoints />} />

        {/* Staff check-in */}
        <Route
          path="/staff/checkin"
          element={
            <RouteGuard>
              <StaffCheckin />
            </RouteGuard>
          }
        />

        {/* Dashboard negocio (OWNER/ADMIN/BARBER) */}
        <Route
          path="/app/*"
          element={
            <RouteGuard>
              <Routes>
                <Route
                  index
                  element={
                    isAdmin(session) ? (
                      <Navigate to="admin" replace />
                    ) : (
                      <Navigate to="/unauthorized" replace />
                    )
                  }
                />
                <Route path="admin" element={<AdminPanel />} />
                <Route path="customers" element={<CustomersPage />} />
                <Route path="customers/new" element={<CustomersNew />} />
                <Route path="customers/:id" element={<CustomerDetail />} />
                <Route path="users" element={<AdminUsers />} />
              </Routes>
            </RouteGuard>
          }
        />

        {/* CPanel (solo SUPERADMIN) */}
        <Route
          path="/cpanel"
          element={
            <RouteGuard>
              {isSuperAdmin(session) ? (
                <CPanelAdminDashboard />
              ) : (
                <Navigate to="/unauthorized" replace />
              )}
            </RouteGuard>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
