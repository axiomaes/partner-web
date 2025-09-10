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
import PortalPoints from "./portal/PortalPoints"; // ← ruta correcta

/* Staff / negocio */
import StaffCheckin from "./pages/StaffCheckin";
import Dashboard from "./pages/Dashboard";
import CustomersNew from "./pages/CustomersNew";
import CustomerDetail from "./pages/CustomerDetail";
// import CustomersPage from "./pages/CustomersPage"; // ← NO existe, la quitamos

/* CPanel (solo SUPERADMIN) */
import CPanelAdminDashboard from "./pages/CPanelAdminDashboard";

function AlreadyLoggedRedirect() {
  const s = useSession();
  if (!s.ready) return null;
  if (s.token) {
    // SUPERADMIN -> /cpanel ; resto -> /app
    return <Navigate to={isSuperAdmin(s) ? "/cpanel" : "/app"} replace />;
  }
  return null;
}

export default function AppRouter() {
  const s = useSession();

  return (
    <BrowserRouter>
      <Routes>
        {/* Primera pantalla = Home (redirige según sesión/rol) */}
        <Route
          path="/"
          element={
            <>
              <AlreadyLoggedRedirect />
              <Home />
            </>
          }
        />

        {/* Login staff */}
        <Route path="/login" element={<LoginStaff />} />

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
              {/* Si es ADMIN/OWNER entra al dashboard; si es BARBER puedes redirigir a check-in */}
              {isAdmin(s) ? (
                <Dashboard />
              ) : (
                <Navigate to="/staff/checkin" replace />
              )}
            </RouteGuard>
          }
        />

        {/* Clientes (usa CustomersNew y Detail que sí existen) */}
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
              {isSuperAdmin(s) ? (
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
