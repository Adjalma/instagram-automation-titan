import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";
import {
  FileText, Heart, MessageCircle, CheckCircle2,
  Clock, TrendingUp, ExternalLink, RefreshCw, Instagram, Linkedin, Facebook,
  Percent, Activity,
} from "lucide-react";
import { toast } from "sonner";
import { useMemo } from "react";

const NEON = {
  cyan: "oklch(0.82 0.18 195)",
  purple: "oklch(0.72 0.22 290)",
  pink: "oklch(0.75 0.22 340)",
  green: "oklch(0.80 0.18 145)",
  gold: "oklch(0.82 0.18 80)",
};

function StatCard({ icon: Icon, label, value, sub, neon = NEON.cyan }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; neon?: string;
}) {
  return (
    <div className="rounded-xl p-4 transition-all"
      style={{ background: "oklch(0.17 0.03 240 / 90%)", border: `1px solid ${neon.replace(")", " / 25%)")}`, backdropFilter: "blur(12px)" }}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5" style={{ color: neon }}><Icon size={18} /></div>
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest" style={{ color: "oklch(0.55 0.02 240)" }}>{label}</p>
          <p className="text-2xl font-bold tabular-nums mt-0.5" style={{ fontFamily: "'Orbitron', sans-serif", color: neon }}>{value}</p>
          {sub && <p className="text-[10px] mt-0.5" style={{ color: "oklch(0.45 0.02 240)" }}>{sub}</p>}
        </div>
      </div>
    </div>
  );
}

const chartTooltipStyle = {
  background: "oklch(0.12 0.025 240)",
  border: "1px solid oklch(0.82 0.18 195 / 20%)",
  borderRadius: 8,
  fontSize: 11,
  color: "oklch(0.85 0.01 220)",
};

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
  const engagementRate = publishedCount > 0 ? ((totalLikes + totalComments) / publishedCount).toFixed(1) : "0";

  const barData = useMemo(() => (
    (posts.data ?? []).slice(0, 9).reverse().map((p) => ({
      name: p.theme ? p.theme.slice(0, 12) : `#${p.id}`,
      Curtidas: p.likes,
      Comentários: p.comments,
    }))
  ), [posts.data]);

  const lineData = useMemo(() => (
    (posts.data ?? []).filter((p) => p.publishedAt).slice(0, 20).reverse().map((p) => ({
      data: new Date(p.publishedAt!).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      Engajamento: (p.likes ?? 0) + (p.comments ?? 0),
    }))
  ), [posts.data]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "'Orbitron', sans-serif", background: `linear-gradient(135deg, oklch(0.92 0.01 220), ${NEON.cyan})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Analytics
          </h1>
          <p className="text-xs mt-1 font-mono uppercase tracking-widest" style={{ color: `${NEON.cyan.replace(")", " / 60%)")}` }}>
            Desempenho dos conteúdos publicados
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => syncInsights.mutate()} disabled={syncInsights.isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{ background: `${NEON.green.replace(")", " / 10%)")}`, color: NEON.green, border: `1px solid ${NEON.green.replace(")", " / 25%)")}` }}
          >
            <RefreshCw size={13} className={syncInsights.isPending ? "animate-spin" : ""} />
            Sincronizar
          </button>
          <button onClick={handleRefresh} disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{ background: "oklch(0.12 0.025 240)", color: "oklch(0.65 0.02 240)", border: "1px solid oklch(0.22 0.04 240)" }}
          >
            <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} />
            Atualizar
          </button>
        </div>
      </div>

      {/* Plataformas */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Instagram, neon: NEON.pink, label: "Instagram", count: instagramCount },
          { icon: Linkedin, neon: "oklch(0.65 0.18 240)", label: "LinkedIn", count: linkedinCount },
          { icon: Facebook, neon: "oklch(0.65 0.18 255)", label: "Facebook", count: facebookCount },
        ].map(({ icon: Icon, neon, label, count }) => (
          <div key={label} className="text-center py-4 rounded-xl transition-all"
            style={{ background: "oklch(0.17 0.03 240 / 90%)", border: `1px solid ${neon.replace(")", " / 25%)")}` }}
          >
            <Icon className="w-5 h-5 mx-auto mb-1.5" style={{ color: neon }} />
            <p className="text-xl font-bold tabular-nums" style={{ fontFamily: "'Orbitron', sans-serif", color: neon }}>{count}</p>
            <p className="text-[10px] font-mono uppercase tracking-wide mt-0.5" style={{ color: "oklch(0.50 0.02 240)" }}>{label}</p>
          </div>
        ))}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl p-4 animate-pulse" style={{ background: "oklch(0.12 0.025 240 / 80%)", border: "1px solid oklch(0.22 0.04 240)", height: 80 }} />
          ))
        ) : (
          <>
            <StatCard icon={FileText} label="Total de Posts" value={summary.data?.total ?? 0} neon={NEON.cyan} />
            <StatCard icon={CheckCircle2} label="Publicados" value={publishedCount} neon={NEON.green} />
            <StatCard icon={Clock} label="Pendentes" value={summary.data?.pending ?? 0} neon={NEON.gold} />
            <StatCard icon={TrendingUp} label="Aprovados" value={summary.data?.approved ?? 0} neon={NEON.purple} />
          </>
        )}
      </div>

      {/* Engajamento */}
      <div className="grid grid-cols-3 gap-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl p-4 animate-pulse" style={{ background: "oklch(0.12 0.025 240 / 80%)", border: "1px solid oklch(0.22 0.04 240)", height: 80 }} />
          ))
        ) : (
          <>
            <StatCard icon={Heart} label="Curtidas" value={totalLikes} sub="em posts publicados" neon={NEON.pink} />
            <StatCard icon={MessageCircle} label="Comentários" value={totalComments} sub="em posts publicados" neon={NEON.purple} />
            <StatCard icon={Percent} label="Eng. Médio" value={engagementRate} sub="curtidas + comentários" neon={NEON.gold} />
          </>
        )}
      </div>

      {/* Gráfico linha */}
      {lineData.length > 1 && (
        <div className="rounded-xl p-5" style={{ background: "oklch(0.17 0.03 240 / 90%)", border: "1px solid oklch(0.82 0.18 195 / 22%)" }}>
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-4 w-4" style={{ color: NEON.cyan }} />
            <p className="label-mono" style={{ color: `${NEON.cyan.replace(")", " / 80%)")}` }}>Evolução do Engajamento</p>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={lineData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0.04 240)" />
              <XAxis dataKey="data" tick={{ fontSize: 10, fill: "oklch(0.50 0.02 240)", fontFamily: "JetBrains Mono" }} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "oklch(0.50 0.02 240)" }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Line type="monotone" dataKey="Engajamento" stroke={NEON.cyan} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Gráfico barras */}
      {barData.length > 0 && (
        <div className="rounded-xl p-5" style={{ background: "oklch(0.17 0.03 240 / 90%)", border: "1px solid oklch(0.72 0.22 290 / 22%)" }}>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4" style={{ color: NEON.purple }} />
            <p className="label-mono" style={{ color: `${NEON.purple.replace(")", " / 80%)")}` }}>Engajamento por Post (últimos 9)</p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0.04 240)" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "oklch(0.50 0.02 240)", fontFamily: "JetBrains Mono" }} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "oklch(0.50 0.02 240)" }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Bar dataKey="Curtidas" fill={NEON.pink} radius={[4, 4, 0, 0]} />
              <Bar dataKey="Comentários" fill={NEON.purple} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Lista de posts */}
      <div className="rounded-xl overflow-hidden" style={{ background: "oklch(0.17 0.03 240 / 90%)", border: "1px solid oklch(0.28 0.04 240)" }}>
        <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: "1px solid oklch(0.22 0.04 240)" }}>
          <FileText className="h-4 w-4" style={{ color: NEON.cyan }} />
          <p className="label-mono" style={{ color: `${NEON.cyan.replace(")", " / 80%)")}` }}>Posts Publicados</p>
        </div>
        {isLoading ? (
          <div className="divide-y" style={{ borderColor: "oklch(0.18 0.04 240)" }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-4 py-3 animate-pulse" style={{ background: "oklch(0.10 0.02 240 / 50%)" }}>
                <div className="h-3 rounded mb-2" style={{ background: "oklch(0.18 0.04 240)", width: "80%" }} />
                <div className="h-2 rounded" style={{ background: "oklch(0.18 0.04 240)", width: "40%" }} />
              </div>
            ))}
          </div>
        ) : publishedPosts.length === 0 ? (
          <div className="p-8 text-center text-xs font-mono" style={{ color: "oklch(0.45 0.02 240)" }}>
            Nenhum post publicado ainda.
          </div>
        ) : (
          <div>
            {publishedPosts.map((post, i) => (
              <div key={post.id} className="flex items-start gap-3 px-4 py-3 transition-all"
                style={{ borderTop: i > 0 ? "1px solid oklch(0.18 0.04 240)" : "none" }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "oklch(0.14 0.025 240 / 50%)"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs line-clamp-2" style={{ color: "oklch(0.78 0.01 220)" }}>{post.caption}</p>
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    {post.theme && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-mono" style={{ background: "oklch(0.82 0.18 195 / 8%)", color: "oklch(0.82 0.18 195 / 70%)", border: "1px solid oklch(0.82 0.18 195 / 15%)" }}>
                        {post.theme}
                      </span>
                    )}
                    {post.publishedAt && (
                      <span className="text-[10px] font-mono" style={{ color: "oklch(0.45 0.02 240)" }}>
                        {new Date(post.publishedAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                      </span>
                    )}
                    <span className="text-[10px] flex items-center gap-0.5" style={{ color: NEON.pink }}>
                      <Heart size={10} /> {post.likes}
                    </span>
                    <span className="text-[10px] flex items-center gap-0.5" style={{ color: NEON.purple }}>
                      <MessageCircle size={10} /> {post.comments}
                    </span>
                    <div className="flex items-center gap-1">
                      {post.instagramPostId && <span title="Instagram"><Instagram size={11} style={{ color: NEON.pink }} /></span>}
                      {(post as any).linkedinPublished === 1 && <span title="LinkedIn"><Linkedin size={11} style={{ color: "oklch(0.65 0.18 240)" }} /></span>}
                      {(post as any).facebookPublished === 1 && <span title="Facebook"><Facebook size={11} style={{ color: "oklch(0.65 0.18 255)" }} /></span>}
                    </div>
                  </div>
                </div>
                {post.instagramPermalink && (
                  <a href={post.instagramPermalink} target="_blank" rel="noopener noreferrer"
                    className="mt-0.5 shrink-0 transition-colors" style={{ color: "oklch(0.45 0.02 240)" }}
                    onMouseEnter={e => (e.target as HTMLElement).style.color = NEON.cyan}
                    onMouseLeave={e => (e.target as HTMLElement).style.color = "oklch(0.45 0.02 240)"}
                    title="Ver no Instagram"
                  >
                    <ExternalLink size={14} />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-[10px] text-center font-mono pb-2" style={{ color: "oklch(0.35 0.02 240)" }}>
        Clique em "Sincronizar" para atualizar curtidas e comentários via API do Instagram.
      </p>
    </div>
  );
}
