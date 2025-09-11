// partner-web/src/pages/Logout.tsx
import { useEffect } from "react";
import { clearSession } from "@/shared/auth";

export default function Logout() {
  useEffect(() => {
    clearSession();
    if (typeof window !== "undefined") window.location.replace("/login");
  }, []);
  return null;
}
