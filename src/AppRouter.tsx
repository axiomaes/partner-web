// partner-web/src/AppRouter.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import RouteGuard from "./shared/RouteGuard";
import { useSession, isSuperAdmin, isAdmin, isOwner } from "./shared/auth";

/* ==== Páginas ==== */
import Home from "./pages/Home";
import LoginStaff from "./pages/LoginStaff";
import Unauthorized from "./pages/Unauthorized";

/* Portal clientes */
import CustomerOTP from "./pages/CustomerOTP";
import PortalPoints from "./portal/PortalPoints";

/* Staff / negocio */
import StaffCheckin from "./pages/StaffCheckin";
import Dashboard from "./pages/Dashboard";
import AdminPanel from "./pages/AdminPanel";
import AdminUsers from "./pages/AdminUsers";
import Customers from "./pages/Customers";
import CustomersNew from "./pages/CustomersNew";
import CustomerDetail from "./pages/CustomerDetail";
import Logout from "./pages/Logout";

/* Cuenta */
import AccountSettings from "./pages/AccountSettings";

/* CPanel (solo SUPERADMIN) */
import CPanelAdminDashboard from "./pages/CPanelAdminDashboard";

function AlreadyLoggedRedirect() {
  const s = useSession();
  if (!s.ready) return null;
  if (s.token) {
    return <Navigate to={isSuperAdmin(s.role) ? "/cpanel" : "/app"} replace />;
  }
  return null;
}

export default function AppRouter() {
  const s = useSession();
  const adminOrAbove = isSuperAdmin(s.role) || isOwner(s.role) || isAdmin(s.role);

  if (!s.ready) return null; // evita flicker antes de hidratar sesión

  return (
    <BrowserRouter>
      <Routes>
        {/* Home pública */}
        <Route
          path="/"
          element={
            <>
              <AlreadyLoggedRedirect />
              <Home />
            </>
          }
        />

        {/* Login / Logout */}
        <Route path="/login" element={<LoginStaff />} />
        <Route path="/logout" element={<Logout />} />

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

        {/* Panel negocio */}
        <Route
          path="/app"
          element={
            <RouteGuard>
              {adminOrAbove ? <Dashboard /> : <Navigate to="/staff/checkin" replace />}
            </RouteGuard>
          }
        />

        {/* Admin */}
        <Route
          path="/app/admin"
          element={
            <RouteGuard>
              <AdminPanel />
            </RouteGuard>
          }
        />
        <Route
          path="/app/users"
          element={
            <RouteGuard>
              <AdminUsers />
            </RouteGuard>
          }
        />

        {/* Mi cuenta */}
        <Route
          path="/app/account"
          element={
            <RouteGuard>
              <AccountSettings />
            </RouteGuard>
          }
        />

        {/* Clientes */}
        <Route path="/app/customers" element={<Navigate to="/app/customers/list" replace />} />
        <Route
          path="/app/customers/list"
          element={
            <RouteGuard>
              <Customers />
            </RouteGuard>
          }
        />
        <Route
          path="/app/customers/new"
          element={
            <RouteGuard>
              <CustomersNew />
            </RouteGuard>
          }
        />
        <Route
          path="/app/customers/:id"
          element={
            <RouteGuard>
              <CustomerDetail />
            </RouteGuard>
          }
        />

        {/* CPanel (solo SUPERADMIN) */}
        <Route
          path="/cpanel/*"
          element={
            <RouteGuard>
              {isSuperAdmin(s.role) ? (
                <CPanelAdminDashboard />
              ) : (
                <Navigate to="/unauthorized" replace />
              )}
            </RouteGuard>
          }
        />

        {/* Secundarias */}
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
