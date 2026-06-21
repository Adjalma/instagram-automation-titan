import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Instagram, Heart, MessageCircle, ExternalLink, History } from "lucide-react";

export default function HistoryView() {
  const [accountFilter, setAccountFilter] = useState<string>("all");
  const { data: allPosts, isLoading } = trpc.posts.list.useQuery({});
  const { data: accounts } = trpc.accounts.list.useQuery();

  const filteredPosts = useMemo(() => {
    if (!allPosts) return [];
    let filtered = allPosts.filter(p => p.status === "published");
    if (accountFilter !== "all") filtered = filtered.filter(p => p.accountId === Number(accountFilter));
    return filtered;
  }, [allPosts, accountFilter]);

  const getAccount = (accountId: number) => accounts?.find(a => a.id === accountId);

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-8 w-8 animate-spin" style={{ color: "oklch(0.82 0.18 195)" }} />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "'Orbitron', sans-serif", background: "linear-gradient(135deg, oklch(0.92 0.01 220), oklch(0.82 0.18 195))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Histórico
          </h1>
          <p className="text-xs mt-1 font-mono uppercase tracking-widest" style={{ color: "oklch(0.82 0.18 195 / 60%)" }}>
            Posts publicados // {filteredPosts.length} resultado(s)
          </p>
        </div>
        <Select value={accountFilter} onValueChange={setAccountFilter}>
          <SelectTrigger className="w-44 h-8 text-xs">
            <SelectValue placeholder="Filtrar por conta" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as contas</SelectItem>
            {accounts?.map(a => (
              <SelectItem key={a.id} value={String(a.id)}>@{a.handle}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredPosts.length === 0 ? (
        <div className="rounded-xl py-16 text-center" style={{ background: "oklch(0.12 0.025 240 / 80%)", border: "1px solid oklch(0.22 0.04 240)" }}>
          <History className="h-12 w-12 mx-auto mb-3 opacity-20" style={{ color: "oklch(0.82 0.18 195)" }} />
          <p className="font-semibold" style={{ color: "oklch(0.65 0.02 240)" }}>Nenhum post publicado</p>
          <p className="text-xs mt-1 font-mono" style={{ color: "oklch(0.45 0.02 240)" }}>Os posts publicados aparecerão aqui</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPosts.map(post => {
            const account = getAccount(post.accountId);
            return (
              <div key={post.id} className="rounded-xl p-4 transition-all"
                style={{ background: "oklch(0.12 0.025 240 / 80%)", border: "1px solid oklch(0.75 0.22 340 / 15%)", backdropFilter: "blur(12px)" }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = "oklch(0.75 0.22 340 / 35%)"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = "oklch(0.75 0.22 340 / 15%)"}
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: "oklch(0.75 0.22 340 / 12%)", border: "1px solid oklch(0.75 0.22 340 / 25%)" }}
                  >
                    <Instagram className="h-4 w-4" style={{ color: "oklch(0.75 0.22 340)" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-bold text-sm" style={{ color: "oklch(0.92 0.01 220)" }}>@{account?.handle ?? "?"}</span>
                      {post.theme && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-mono" style={{ background: "oklch(0.82 0.18 195 / 8%)", color: "oklch(0.82 0.18 195 / 70%)", border: "1px solid oklch(0.82 0.18 195 / 15%)" }}>
                          {post.theme}
                        </span>
                      )}
                      {post.publishedAt && (
                        <span className="ml-auto text-[10px] font-mono" style={{ color: "oklch(0.45 0.02 240)" }}>
                          {new Date(post.publishedAt).toLocaleDateString("pt-BR")}
                        </span>
                      )}
                    </div>
                    <p className="text-xs line-clamp-2" style={{ color: "oklch(0.65 0.01 220)" }}>{post.caption ?? "Sem legenda"}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1">
                        <Heart className="h-3.5 w-3.5" style={{ color: "oklch(0.75 0.22 340)" }} />
                        <span className="text-xs font-mono font-semibold" style={{ color: "oklch(0.75 0.22 340)" }}>{post.likes ?? 0}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageCircle className="h-3.5 w-3.5" style={{ color: "oklch(0.72 0.22 290)" }} />
                        <span className="text-xs font-mono font-semibold" style={{ color: "oklch(0.72 0.22 290)" }}>{post.comments ?? 0}</span>
                      </div>
                      {post.instagramPermalink && (
                        <a href={post.instagramPermalink} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[10px] font-mono ml-auto transition-colors"
                          style={{ color: "oklch(0.82 0.18 195 / 60%)" }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "oklch(0.82 0.18 195)"}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "oklch(0.82 0.18 195 / 60%)"}
                        >
                          <ExternalLink className="h-3 w-3" />
                          Ver no Instagram
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
