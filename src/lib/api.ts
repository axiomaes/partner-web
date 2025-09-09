// partner-web/src/lib/api.ts
export function makeApi(apiBase: string, token: string) {
  const base = apiBase.replace(/\/+$/, "");
  const auth = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
  async function req(path: string, init: RequestInit = {}) {
    const res = await fetch(`${base}${path}`, {
      ...init,
      headers: {
        ...(init.headers || {}),
        Authorization: auth,
      },
      credentials: "include",
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return res;
  }
  return {
    getJson: async (p: string) => (await req(p)).json(),
    postJson: async (p: string, body: any) =>
      (await req(p, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })).json(),
    downloadCsv: async (p: string, filename: string) => {
      const res = await req(p);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(a.href);
    },
  };
}
