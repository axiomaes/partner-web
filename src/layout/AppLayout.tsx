import Sidebar from "./Sidebar";
import { Outlet } from "react-router-dom";

export default function AppLayout() {
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 min-h-screen">
        <div className="max-w-6xl mx-auto p-4">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
