// src/pages/CustomerDetail.tsx
import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import AppLayout from "@/layout/AppLayout";
import { useSession, isAdmin, isOwner, isSuperAdmin } from "@/shared/auth";
import { api, publicCustomerQrUrl, addVisit } from "@/shared/api";

type Customer = {
  id: string;
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  birthday?: string | null; // YYYY-MM-DD
  visitsCount?: number | null;
  createdAt?: string | null;
  [k: string]: any;
};

const maskPhone = (p?: string | null) => {
  if (!p) return "—";
  const d = p.replace(/\D/g, "");
  if (d.length <= 4) return "•••";
  return `${d.slice(0, 2)}•••${d.slice(-2)}`;
};
const maskEmail = (e?: string | null) => {
  if (!e) return "—";
  const [u, dom] = e.split("@");
  if (!dom) return "—";
  const u2 = u.length <= 2 ? "••" : u[0] + "••" + u.slice(-1);
  return `${u2}@${dom}`;
};

function isDuplicateVisitError(e: any): boolean {
  const msg = e?.response?.data?.message || e?.message || "";
  return e?.response?.status === 409 || /same\s*day|mismo\s*d[ií]a|already.*today/i.test(msg);
}
const waHref = (phone?: string | null, text?: string) => {
  const digits = (phone || "").replace(/\D/g, "");
  const t = text || "¡Feliz cumpleaños! 🎉 Gracias por elegirnos.";
  return `https://wa.me/${digits}?text=${encodeURIComponent(t)}`;
};

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();

  const { role } = useSession();
  const canSeeSensitive = isAdmin(role) || isOwner(role) || isSuperAdmin(role);
  const canAddVisit = useMemo(
    () => ["BARBER", "ADMIN", "OWNER", "SUPERADMIN"].includes(String(role || "")),
    [role]
  );
  const isOwnerRole = isOwner(role);

  const [c, setC] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, set]()
