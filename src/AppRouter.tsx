// src/AppRouter.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import RouteGuard from "./shared/RouteGuard";
import { useSession, isSuperAdmin, isAdmin } from "./shared/auth";
import { postLoginPath } from "./shared/redirects";

/* Páginas */
import LoginStaff from "./pages/LoginStaff";
import Unauthorized from "./pages/Unauthorized";

/* Portal clientes (si los usas aparte) */
import CustomerOTP from "./pages/CustomerOTP";
import PortalPoints from "./pages/PortalPoints";

/* Staff + Panel negocio */
import StaffCheckin from "./pages/StaffCheckin";
import AdminPanel from "./pages/AdminPanel";
import CustomersPage from "./pages/CustomersPage";
import CustomerDetail from "./pages/CustomerDetail";
import CustomersNew from "./pages/CustomersNew";
import AdminUsers from "./pages/AdminUsers";

/* CPanel (superadmin) */
import CPanelAdminDashboard from "./pages/CPanelAdminDashboard";

function AlreadyLoggedRedirect() {
  const s = useSession();
  if (!s.ready) return null;
  if (s.token) return <Navigate to={postLoginPath(s)} replace />;
  return null;
}

export default function AppRouter() {
  const s = useSession();

  return (
    <BrowserRouter>
      <Routes>
        {/* Primera pantalla = Login */}
        <Route
          path="/"
          element={
            <>
              <AlreadyLoggedRedirect />
              <LoginStaff />
            </>
          }
        />

        {/* Portal clientes (opcionales) */}
        <Route path="/portal" element={<CustomerOTP />} />
        <Route path="/portal/points" element={<PortalPoints />} />

        {/* Staff (requiere sesión) */}
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
          path="/app/*"
          element={
            <RouteGuard>
              <Routes>
                <Route
                  index
                  element={
                    isAdmin(s) ? (
                      <Navigate to="admin" replace />
                    ) : (
                      // Si no es ADMIN/OWNER/SUPERADMIN, deja al BARBER donde elijas
                      <Navigate to="/staff/checkin" replace />
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
              {isSuperAdmin(s) ? (
                <CPanelAdminDashboard />
              ) : (
                <Navigate to="/unauthorized" replace />
              )}
            </RouteGuard>
          }
        />

        {/* Secundarias */}
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
