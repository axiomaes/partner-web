import { createBrowserRouter, RouterProvider } from "react-router-dom";
import DashboardLayout from "./layouts/DashboardLayout";
import Home from "./pages/Home";
import Customers from "./pages/Customers";
import Rewards from "./pages/Rewards";
import News from "./pages/News";

const router = createBrowserRouter([
  {
    path: "/app",
    element: <DashboardLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: "clientes", element: <Customers /> },
      { path: "recompensas", element: <Rewards /> },
      { path: "noticias", element: <News /> },
    ],
  },
  { path: "*", element: <div className="section">404</div> },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
