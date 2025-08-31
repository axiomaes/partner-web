import { useQuery } from "@tanstack/react-query";
import { Card } from "../components/Card";
import { api } from "../shared/api";
import type { NewsItem } from "../types/api";

export default function News() {
  const { data, isFetching, error } = useQuery<NewsItem[]>({
    queryKey: ["news"],
    queryFn: async () => (await api.get<NewsItem[]>("/news")).data,
  });

  if (error) {
    return <div className="text-sm text-red-600">Error cargando noticias.</div>;
  }

  const news = data ?? [];

  return (
    <div className="grid gap-4">
      {news.map((n: NewsItem) => (
        <Card key={n.id} title={n.title}>
          <div className="text-sm whitespace-pre-wrap text-slate-700">{n.body}</div>
        </Card>
      ))}
      {isFetching && <div className="text-sm text-slate-500">Cargando…</div>}
      {!isFetching && news.length === 0 && (
        <div className="text-sm text-slate-500">Sin noticias.</div>
      )}
    </div>
  );
}
