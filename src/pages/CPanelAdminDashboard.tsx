import React, { useEffect, useMemo, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Loader2, RefreshCw, ShieldCheck, ShieldAlert, Download, Building2, DollarSign, ChartLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// --- Helpers ---------------------------------------------------------------
const thisPeriod = () => {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
};

function normBearer(tokenRaw: string) {
  const t = (tokenRaw || "").trim();
  if (!t) return "";
  return t.toLowerCase().startsWith("bearer ") ? t : `Bearer ${t}`;
}

async function fetchJson(apiBase: string, path: string, token: string, init?: RequestInit) {
  const res = await fetch(`${apiBase}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
      Authorization: normBearer(token),
    },
  });
  const ct = res.headers.get("content-type") || "";
  if (!res.ok) {
    const err = ct.includes("json") ? await res.json() : { message: await res.text() };
    throw new Error(`HTTP ${res.status}: ${err.message || "error"}`);
  }
  return ct.includes("json") ? res.json() : res.text();
}

// --- Types (partial) -------------------------------------------------------
interface BusinessRow {
  id: string;
  name: string;
  status: "trial" | "active" | "suspended" | "cancelled";
}

interface MessagingSummary {
  range: { from: string; to: string };
  totals: {
    byStatus: Record<string, number>;
    byChannel: Record<string, number>;
    all: number;
  };
  series: { byDay: { day: string; count: number }[] };
  today: number;
  monthToDate: number;
}

interface TemplateRow { templateId: string; sent: number; delivered: number; failed: number; lastSentAt?: string; deliveryRate?: number }
interface ProviderRow { providerId: string; sent: number; delivered: number; failed: number; lastSentAt?: string; deliveryRate?: number; topErrorClass?: string; topErrorCount?: number; sampleError?: string }

interface BillingItem {
  id: string;
  businessId: string;
  period: string;
  kind: "LEASE" | "MSG_MARKETING" | "MSG_UTILITY";
  status: "DRAFT" | "FINALIZED";
  quantity: number;
  unitAmountCents: number;
  totalAmountCents: number;
  meta?: any;
}

// --- Component -------------------------------------------------------------
export default function CpanelDashboard() {
  const [apiBase, setApiBase] = useState<string>("/api");
  const [tokenRaw, setTokenRaw] = useState<string>("");
  const token = useMemo(() => normBearer(tokenRaw), [tokenRaw]);

  const [health, setHealth] = useState<{ ok: boolean; ts?: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const [businesses, setBusinesses] = useState<BusinessRow[]>([]);
  const [bizId, setBizId] = useState<string>("");
  const [period, setPeriod] = useState<string>(thisPeriod());

  // Messaging
  const [summary, setSummary] = useState<MessagingSummary | null>(null);
  const [byTemplate, setByTemplate] = useState<TemplateRow[]>([]);
  const [byCampaign, setByCampaign] = useState<any[]>([]);
  const [byProvider, setByProvider] = useState<ProviderRow[]>([]);

  // Billing
  const [preview, setPreview] = useState<any | null>(null);
  const [feed, setFeed] = useState<{ ok: boolean; period: string; items: BillingItem[]; totalFinalized: number } | null>(null);

  const canQuery = !!(apiBase && token);

  const loadBase = async () => {
    setError("");
    setLoading(true);
    try {
      const [svc, cp, biz] = await Promise.all([
        fetchJson(apiBase, "/health", token).catch(() => ({ ok: false })),
        fetchJson(apiBase, "/cp/health", token),
        fetchJson(apiBase, "/cp/businesses", token).then((r) => r.rows as BusinessRow[]),
      ]);
      setHealth({ ok: cp?.ok, ts: cp?.ts });
      setBusinesses(biz);
      if (!bizId && biz?.length) setBizId(biz[0].id);
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  const refreshMessaging = async () => {
    if (!bizId) return;
    setError("");
    setLoading(true);
    try {
      const [sum, tmpl, camp, prov] = await Promise.all([
        fetchJson(apiBase, `/cp/messaging/summary?businessId=${bizId}`, token),
        fetchJson(apiBase, `/cp/messaging/by-template?businessId=${bizId}&page=1&pageSize=20`, token),
        fetchJson(apiBase, `/cp/messaging/by-campaign?businessId=${bizId}&page=1&pageSize=20`, token),
        fetchJson(apiBase, `/cp/messaging/by-provider?businessId=${bizId}&page=1&pageSize=20`, token),
      ]);
      setSummary(sum);
      setByTemplate(tmpl.rows || []);
      setByCampaign(camp.rows || []);
      setByProvider(prov.rows || []);
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  const doPreview = async () => {
    if (!bizId) return;
    setError("");
    setLoading(true);
    try {
      const p = await fetchJson(apiBase, `/cp/billing/preview?businessId=${bizId}&period=${encodeURIComponent(period)}`, token);
      setPreview(p);
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  const doFinalize = async () => {
    if (!bizId) return;
    setError("");
    setLoading(true);
    try {
      const body = { businessId: bizId, period };
      const f = await fetchJson(apiBase, "/cp/billing/finalize", token, { method: "POST", body: JSON.stringify(body) });
      setFeed(f);
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  const loadFeed = async () => {
    if (!bizId) return;
    setError("");
    setLoading(true);
    try {
      const f = await fetchJson(apiBase, `/cp/billing/feed?businessId=${bizId}&period=${encodeURIComponent(period)}`, token);
      setFeed(f);
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  const csvLink = (path: string) => `${apiBase}${path}${path.includes("?") ? "&" : "?"}businessId=${bizId}`;

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2"><ShieldCheck className="w-5 h-5"/> CPanel API — Conexión</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label>API Base</Label>
                <Input placeholder="https://api.tu-dominio" value={apiBase} onChange={(e) => setApiBase(e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <Label>Token (pega el JWT o con "Bearer …")</Label>
                <Input type="password" placeholder="Bearer eyJ…" value={tokenRaw} onChange={(e) => setTokenRaw(e.target.value)} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button disabled={!canQuery || loading} onClick={loadBase}><RefreshCw className="w-4 h-4 mr-2"/>Conectar</Button>
              {health?.ok ? (
                <Badge variant="secondary" className="flex items-center gap-1"><ShieldCheck className="w-4 h-4"/> ok {health.ts ? new Date(health.ts).toLocaleString() : ""}</Badge>
              ) : (
                <Badge variant="destructive" className="flex items-center gap-1"><ShieldAlert className="w-4 h-4"/> sin conexión</Badge>
              )}
              {loading && <Loader2 className="w-4 h-4 animate-spin"/>}
              {error && <span className="text-sm text-red-600">{error}</span>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle>Contexto</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Negocio</Label>
              <Select value={bizId} onValueChange={setBizId}>
                <SelectTrigger><SelectValue placeholder="Selecciona"/></SelectTrigger>
                <SelectContent>
                  {businesses.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.name} — {b.status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Periodo (YYYY-MM)</Label>
              <Input value={period} onChange={(e) => setPeriod(e.target.value)} placeholder="2025-09" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="messaging" className="w-full">
        <TabsList>
          <TabsTrigger value="messaging"><ChartLine className="w-4 h-4 mr-2"/>Mensajería</TabsTrigger>
          <TabsTrigger value="billing"><DollarSign className="w-4 h-4 mr-2"/>Billing</TabsTrigger>
        </TabsList>

        {/* MESSAGING */}
        <TabsContent value="messaging" className="space-y-4">
          <div className="flex gap-2">
            <Button variant="secondary" disabled={!bizId || loading} onClick={refreshMessaging}><RefreshCw className="w-4 h-4 mr-2"/>Refrescar</Button>
            <a className="inline-flex items-center text-sm underline" href={csvLink(`/cp/messaging/by-template.csv?period=${period}`)} target="_blank" rel="noreferrer"><Download className="w-4 h-4 mr-1"/>CSV por Template</a>
            <a className="inline-flex items-center text-sm underline" href={csvLink(`/cp/messaging/by-campaign.csv?period=${period}`)} target="_blank" rel="noreferrer"><Download className="w-4 h-4 mr-1"/>CSV por Campaña</a>
            <a className="inline-flex items-center text-sm underline" href={csvLink(`/cp/messaging/by-provider.csv?period=${period}`)} target="_blank" rel="noreferrer"><Download className="w-4 h-4 mr-1"/>CSV por Proveedor</a>
          </div>

          {summary && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Building2 className="w-5 h-5"/>{businesses.find(b=>b.id===bizId)?.name || bizId} — Resumen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Stat label="Total" value={summary.totals.all} />
                  <Stat label="Sent" value={summary.totals.byStatus?.SENT || 0} />
                  <Stat label="Delivered" value={summary.totals.byStatus?.DELIVERED || 0} />
                  <Stat label="Failed" value={summary.totals.byStatus?.FAILED || 0} />
                </div>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={summary.series.byDay} margin={{ left: 8, right: 8, top: 5, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Line type="monotone" dataKey="count" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle>Top por Template</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Template</TableHead>
                      <TableHead className="text-right">Sent</TableHead>
                      <TableHead className="text-right">Delivered</TableHead>
                      <TableHead className="text-right">Failed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {byTemplate.map((r) => (
                      <TableRow key={r.templateId}>
                        <TableCell className="font-medium">{r.templateId}</TableCell>
                        <TableCell className="text-right">{r.sent}</TableCell>
                        <TableCell className="text-right">{r.delivered}</TableCell>
                        <TableCell className="text-right">{r.failed}</TableCell>
                      </TableRow>
                    ))}
                    {!byTemplate.length && (
                      <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Sin datos</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Top por Proveedor</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Proveedor</TableHead>
                      <TableHead className="text-right">Sent</TableHead>
                      <TableHead className="text-right">Delivered</TableHead>
                      <TableHead className="text-right">Failed</TableHead>
                      <TableHead>Top Error</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {byProvider.map((r) => (
                      <TableRow key={r.providerId}>
                        <TableCell className="font-medium">{r.providerId}</TableCell>
                        <TableCell className="text-right">{r.sent}</TableCell>
                        <TableCell className="text-right">{r.delivered}</TableCell>
                        <TableCell className="text-right">{r.failed}</TableCell>
                        <TableCell>{r.topErrorClass ? `${r.topErrorClass} (${r.topErrorCount})` : "-"}</TableCell>
                      </TableRow>
                    ))}
                    {!byProvider.length && (
                      <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Sin datos</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* BILLING */}
        <TabsContent value="billing" className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button variant="secondary" disabled={!bizId || loading} onClick={doPreview}><RefreshCw className="w-4 h-4 mr-2"/>Preview</Button>
            <Button disabled={!bizId || loading} onClick={doFinalize}><DollarSign className="w-4 h-4 mr-2"/>Finalize</Button>
            <Button variant="outline" disabled={!bizId || loading} onClick={loadFeed}><RefreshCw className="w-4 h-4 mr-2"/>Feed</Button>
          </div>

          {preview && (
            <Card>
              <CardHeader><CardTitle>Preview — {preview.period}</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm text-muted-foreground">{preview.business?.name} | {new Date(preview.range.from).toLocaleDateString()} → {new Date(preview.range.to).toLocaleDateString()}</div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kind</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Unit (¢)</TableHead>
                      <TableHead className="text-right">Total (¢)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.items?.map((it: BillingItem) => (
                      <TableRow key={it.kind}>
                        <TableCell className="font-medium">{it.kind}</TableCell>
                        <TableCell className="text-right">{it.quantity}</TableCell>
                        <TableCell className="text-right">{it.unitAmountCents}</TableCell>
                        <TableCell className="text-right">{it.totalAmountCents}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={3} className="text-right font-medium">Subtotal</TableCell>
                      <TableCell className="text-right font-semibold">{preview.subtotalCents}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {feed && (
            <Card>
              <CardHeader><CardTitle>Feed — {feed.period}</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm text-muted-foreground">Total FINALIZED: <span className="font-semibold">{(feed.totalFinalized/100).toFixed(2)} $</span> ({feed.totalFinalized} ¢)</div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kind</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Unit (¢)</TableHead>
                      <TableHead className="text-right">Total (¢)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feed.items?.map((it: BillingItem) => (
                      <TableRow key={it.id}>
                        <TableCell className="font-medium">{it.kind}</TableCell>
                        <TableCell>
                          <Badge variant={it.status === "FINALIZED" ? "default" : "secondary"}>{it.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">{it.quantity}</TableCell>
                        <TableCell className="text-right">{it.unitAmountCents}</TableCell>
                        <TableCell className="text-right">{it.totalAmountCents}</TableCell>
                      </TableRow>
                    ))}
                    {!feed.items?.length && (
                      <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Sin ítems</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border p-4">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="text-2xl font-semibold">{value ?? 0}</div>
    </div>
  );
}
