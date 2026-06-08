import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";
import {
  FileText, Heart, MessageCircle, CheckCircle2,
  Clock, TrendingUp, ExternalLink, RefreshCw, Instagram, Linkedin, Facebook,
  Percent,
} from "lucide-react";
import { toast } from "sonner";
import { useMemo } from "react";

function StatCard({
  icon: Icon, label, value, sub, color = "text-cyan-400",
}: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color?: string;
}) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 ${color}`}><Icon size={20} /></div>
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold tabular-nums text-foreground">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SkeletonCard() {
  return (
    <Card className="bg-card border-border">
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start gap-3">
          <Skeleton className="w-5 h-5 rounded mt-0.5" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-16" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Analytics() {
  const summary = trpc.analytics.getSummary.useQuery();
  const accountStats = trpc.analytics.getAccountStats.useQuery();
  const posts = trpc.analytics.getPostsWithMetrics.useQuery();
  const utils = trpc.useUtils();

  const syncInsights = trpc.analytics.syncAllInsights.useMutation({
    onSuccess: (data) => {
      toast.success(`Insights sincronizados: ${data.updated}/${data.total} posts atualizados`);
      utils.analytics.getPostsWithMetrics.invalidate();
      utils.analytics.getSummary.invalidate();
    },
    onError: (e) => toast.error(`Erro ao sincronizar: ${e.message}`),
  });

  const isLoading = summary.isLoading || accountStats.isLoading || posts.isLoading;

  function handleRefresh() {
    utils.analytics.getSummary.invalidate();
    utils.analytics.getAccountStats.invalidate();
    utils.analytics.getPostsWithMetrics.invalidate();
  }

  const publishedPosts = posts.data ?? [];
  const instagramCount = publishedPosts.filter((p) => p.instagramPostId).length;
  const linkedinCount = publishedPosts.filter((p) => (p as any).linkedinPublished === 1).length;
  const facebookCount = publishedPosts.filter((p) => (p as any).facebookPublished === 1).length;

  const totalLikes = summary.data?.totalLikes ?? 0;
  const totalComments = summary.data?.totalComments ?? 0;
  const publishedCount = summary.data?.published ?? 0;
  const engagementRate = publishedCount > 0
    ? ((totalLikes + totalComments) / publishedCount).toFixed(1)
    : "0";

  // Gráfico de barras — últimos 9 posts
  const barData = useMemo(() => (
    (posts.data ?? []).slice(0, 9).reverse().map((p) => ({
      name: p.theme ? p.theme.slice(0, 12) : `#${p.id}`,
      Curtidas: p.likes,
      Comentários: p.comments,
    }))
  ), [posts.data]);

  // Gráfico de linha — engajamento ao longo do tempo
  const lineData = useMemo(() => (
    (posts.data ?? [])
      .filter((p) => p.publishedAt)
      .slice(0, 20)
      .reverse()
      .map((p) => ({
        data: new Date(p.publishedAt!).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
        Engajamento: (p.likes ?? 0) + (p.comments ?? 0),
      }))
  ), [posts.data]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
          <p className="text-sm text-muted-foreground">Desempenho dos conteúdos publicados</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm"
            onClick={() => syncInsights.mutate()}
            disabled={syncInsights.isPending}>
            <RefreshCw size={14} className={syncInsights.isPending ? "animate-spin" : ""} />
            <span className="ml-1.5">Sincronizar</span>
          </Button>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            <span className="ml-1.5">Atualizar</span>
          </Button>
        </div>
      </div>

      {/* Plataformas */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Instagram, color: "text-pink-500", label: "Instagram", count: instagramCount },
          { icon: Linkedin, color: "text-blue-600", label: "LinkedIn", count: linkedinCount },
          { icon: Facebook, color: "text-blue-500", label: "Facebook", count: facebookCount },
        ].map(({ icon: Icon, color, label, count }) => (
          <Card key={label} className="text-center py-3">
            <CardContent className="p-0">
              <Icon className={`w-5 h-5 mx-auto mb-1 ${color}`} />
              <p className="text-xl font-bold tabular-nums">{count}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <StatCard icon={FileText} label="Total de Posts" value={summary.data?.total ?? 0} color="text-cyan-400" />
            <StatCard icon={CheckCircle2} label="Publicados" value={publishedCount} color="text-green-400" />
            <StatCard icon={Clock} label="Pendentes" value={summary.data?.pending ?? 0} color="text-yellow-400" />
            <StatCard icon={TrendingUp} label="Aprovados" value={summary.data?.approved ?? 0} color="text-blue-400" />
          </>
        )}
      </div>

      {/* Engajamento + Taxa */}
      <div className="grid grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <StatCard icon={Heart} label="Total de Curtidas" value={totalLikes} sub="em posts publicados" color="text-pink-400" />
            <StatCard icon={MessageCircle} label="Total de Comentários" value={totalComments} sub="em posts publicados" color="text-purple-400" />
            <StatCard icon={Percent} label="Eng. Médio / Post" value={engagementRate} sub="curtidas + comentários" color="text-orange-400" />
          </>
        )}
      </div>

      {/* Gráfico de linha — evolução do engajamento */}
      {lineData.length > 1 && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base">Evolução do Engajamento</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={lineData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="data" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Line type="monotone" dataKey="Engajamento" stroke="#06b6d4" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Gráfico de barras por post */}
      {barData.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base">Engajamento por Post (últimos 9)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Curtidas" fill="#ec4899" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Comentários" fill="#a855f7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Lista de posts publicados */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-base">Posts Publicados</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="divide-y divide-border">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3 px-4 py-3">
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : publishedPosts.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground text-sm">Nenhum post publicado ainda.</div>
          ) : (
            <div className="divide-y divide-border">
              {publishedPosts.map((post) => (
                <div key={post.id} className="flex items-start gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground line-clamp-2">{post.caption}</p>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      {post.theme && <Badge variant="outline" className="text-xs">{post.theme}</Badge>}
                      {post.publishedAt && (
                        <span className="text-xs text-muted-foreground">
                          {new Date(post.publishedAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                        </span>
                      )}
                      <span className="text-xs text-pink-400 flex items-center gap-1"><Heart size={11} /> {post.likes}</span>
                      <span className="text-xs text-purple-400 flex items-center gap-1"><MessageCircle size={11} /> {post.comments}</span>
                      <div className="flex items-center gap-1 ml-1">
                        {post.instagramPostId && <span title="Instagram"><Instagram size={11} className="text-pink-500" /></span>}
                        {(post as any).linkedinPublished === 1 && <span title="LinkedIn"><Linkedin size={11} className="text-blue-600" /></span>}
                        {(post as any).facebookPublished === 1 && <span title="Facebook"><Facebook size={11} className="text-blue-500" /></span>}
                      </div>
                    </div>
                  </div>
                  {post.instagramPermalink && (
                    <a href={post.instagramPermalink} target="_blank" rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-cyan-400 transition-colors mt-0.5 shrink-0" title="Ver no Instagram">
                      <ExternalLink size={15} />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground text-center pb-2">
        Clique em "Sincronizar" para atualizar curtidas e comentários via API do Instagram.
      </p>
    </div>
  );
}
