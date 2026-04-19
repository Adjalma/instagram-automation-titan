import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Instagram, Heart, MessageCircle, ExternalLink } from "lucide-react";

export default function HistoryView() {
  const [accountFilter, setAccountFilter] = useState<string>("all");
  const { data: allPosts, isLoading } = trpc.posts.list.useQuery({});
  const { data: accounts } = trpc.accounts.list.useQuery();

  const filteredPosts = useMemo(() => {
    if (!allPosts) return [];
    let filtered = allPosts.filter(p => p.status === "published");
    if (accountFilter !== "all") {
      filtered = filtered.filter(p => p.accountId === Number(accountFilter));
    }
    return filtered;
  }, [allPosts, accountFilter]);

  const getAccount = (accountId: number) => accounts?.find(a => a.id === accountId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Histórico</h1>
          <p className="label-mono mt-1">Posts publicados // {filteredPosts.length} resultado(s)</p>
        </div>
        <Select value={accountFilter} onValueChange={setAccountFilter}>
          <SelectTrigger className="w-48">
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
        <Card className="card-blueprint">
          <CardContent className="py-12 text-center">
            <Instagram className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-30" />
            <p className="text-lg font-semibold text-muted-foreground">Nenhum post publicado</p>
            <p className="label-mono mt-1">Os posts publicados aparecerão aqui</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredPosts.map(post => {
            const account = getAccount(post.accountId);
            const isPersonal = account?.tone === "personal";
            return (
              <Card key={post.id} className="card-blueprint">
                <CardContent className="py-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isPersonal ? "bg-pink-pastel/30" : "bg-cyan-pastel/30"}`}>
                      <Instagram className={`h-5 w-5 ${isPersonal ? "text-pink-500" : "text-cyan-600"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-sm">@{account?.handle ?? "?"}</span>
                        <Badge variant="outline" className="text-[10px]">{post.theme ?? "Sem tema"}</Badge>
                        {post.publishedAt && (
                          <span className="label-mono ml-auto">{new Date(post.publishedAt).toLocaleDateString("pt-BR")}</span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{post.caption ?? "Sem legenda"}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1 text-sm">
                          <Heart className="h-3.5 w-3.5 text-pink-500" />
                          <span className="font-mono font-semibold">{post.likes ?? 0}</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm">
                          <MessageCircle className="h-3.5 w-3.5 text-blue-500" />
                          <span className="font-mono font-semibold">{post.comments ?? 0}</span>
                        </div>
                        {post.instagramPermalink && (
                          <a href={post.instagramPermalink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-primary hover:underline ml-auto">
                            <ExternalLink className="h-3 w-3" />
                            Ver no Instagram
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
