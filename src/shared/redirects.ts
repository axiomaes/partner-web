// src/shared/redirects.ts
import type { Session } from "./auth";

export function postLoginPath(s: Pick<Session, "role">): string {
  switch (s.role) {
    case "SUPERADMIN": return "/cpanel";
    case "OWNER":      return "/app/admin";
    case "ADMIN":      return "/app/admin";
    case "BARBER":     return "/app";        // o "/staff/checkin"
    default:           return "/app";
  }
}
