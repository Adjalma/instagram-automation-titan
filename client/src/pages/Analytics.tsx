import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import {
  Users, FileText, Heart, MessageCircle, CheckCircle2,
  Clock, TrendingUp, ExternalLink, RefreshCw,
} from "lucide-react";

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color = "text-cyan-400",
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 ${color}`}>
            <Icon size={20} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
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

  const isLoading = summary.isLoading || accountStats.isLoading || posts.isLoading;

  function handleRefresh() {
    utils.analytics.getSummary.invalidate();
    utils.analytics.getAccountStats.invalidate();
    utils.analytics.getPostsWithMetrics.invalidate();
  }

  // Dados para gráfico de barras (últimos 9 posts publicados)
  const chartData = (posts.data ?? [])
    .slice(0, 9)
    .reverse()
    .map((p) => ({
      name: p.theme ? p.theme.slice(0, 14) : `#${p.id}`,
      Curtidas: p.likes,
      Comentários: p.comments,
    }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
          <p className="text-sm text-muted-foreground">
            @triarcsolutions — desempenho dos conteúdos publicados
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
          <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
          <span className="ml-1.5">Atualizar</span>
        </Button>
      </div>

      {/* Conta Instagram */}
      {accountStats.data && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Conta Instagram
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div>
                <p className="text-lg font-bold text-foreground">
                  @{accountStats.data.account?.handle}
                </p>
                <p className="text-sm text-muted-foreground">
                  {accountStats.data.account?.name}
                </p>
              </div>
              <Badge variant="secondary" className="ml-auto">
                {accountStats.data.account?.accountType ?? "Business"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={FileText}
          label="Total de Posts"
          value={summary.data?.total ?? "—"}
          color="text-cyan-400"
        />
        <StatCard
          icon={CheckCircle2}
          label="Publicados"
          value={summary.data?.published ?? "—"}
          color="text-green-400"
        />
        <StatCard
          icon={Clock}
          label="Pendentes"
          value={summary.data?.pending ?? "—"}
          color="text-yellow-400"
        />
        <StatCard
          icon={TrendingUp}
          label="Aprovados"
          value={summary.data?.approved ?? "—"}
          color="text-blue-400"
        />
      </div>

      {/* Engajamento */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard
          icon={Heart}
          label="Total de Curtidas"
          value={summary.data?.totalLikes ?? "—"}
          sub="em posts publicados"
          color="text-pink-400"
        />
        <StatCard
          icon={MessageCircle}
          label="Total de Comentários"
          value={summary.data?.totalComments ?? "—"}
          sub="em posts publicados"
          color="text-purple-400"
        />
      </div>

      {/* Gráfico de engajamento */}
      {chartData.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base">Engajamento por Post</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
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
            <div className="p-6 text-center text-muted-foreground text-sm">Carregando...</div>
          ) : (posts.data ?? []).length === 0 ? (
            <div className="p-6 text-center text-muted-foreground text-sm">
              Nenhum post publicado ainda.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {(posts.data ?? []).map((post) => (
                <div key={post.id} className="flex items-start gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground line-clamp-2">{post.caption}</p>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      {post.theme && (
                        <Badge variant="outline" className="text-xs">
                          {post.theme}
                        </Badge>
                      )}
                      {post.publishedAt && (
                        <span className="text-xs text-muted-foreground">
                          {new Date(post.publishedAt).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      )}
                      <span className="text-xs text-pink-400 flex items-center gap-1">
                        <Heart size={11} /> {post.likes}
                      </span>
                      <span className="text-xs text-purple-400 flex items-center gap-1">
                        <MessageCircle size={11} /> {post.comments}
                      </span>
                    </div>
                  </div>
                  {post.instagramPermalink && (
                    <a
                      href={post.instagramPermalink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-cyan-400 transition-colors mt-0.5 shrink-0"
                      title="Ver no Instagram"
                    >
                      <ExternalLink size={15} />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Nota sobre métricas */}
      <p className="text-xs text-muted-foreground text-center pb-2">
        Curtidas e comentários são sincronizados via botão "Publicar Agora" na tela de Aprovação.
        Posts recém-publicados podem mostrar zero até a próxima sincronização.
      </p>
    </div>
  );
}
