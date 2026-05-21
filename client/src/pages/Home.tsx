import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Loader2, Instagram, FileText, Clock,
  CheckCircle, AlertCircle, Rocket, ArrowRight,
  Linkedin, Facebook, Youtube, Music, Globe,
} from "lucide-react";
import { useLocation } from "wouter";
import { useEffect } from "react";
import React from "react";

const PLATFORM_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; bg: string; badge: string }> = {
  instagram: { label: "Instagram", icon: Instagram, color: "text-pink-600", bg: "bg-pink-100", badge: "border-pink-300 text-pink-700" },
  linkedin:  { label: "LinkedIn",  icon: Linkedin,  color: "text-blue-700", bg: "bg-blue-100",  badge: "border-blue-400 text-blue-700" },
  facebook:  { label: "Facebook",  icon: Facebook,  color: "text-blue-500", bg: "bg-blue-50",   badge: "border-blue-300 text-blue-600" },
  tiktok:    { label: "TikTok",    icon: Music,     color: "text-gray-900", bg: "bg-gray-100",  badge: "border-gray-400 text-gray-700" },
  youtube:   { label: "YouTube",   icon: Youtube,   color: "text-red-600",  bg: "bg-red-100",   badge: "border-red-300 text-red-700" },
};

export default function Home() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    document.title = "Triarc Social Manager — Automação Instagram";
  }, []);

  const { data: accounts, isLoading: loadingAccounts } = trpc.accounts.list.useQuery();

  // Pega a conta principal (Instagram) para os stats gerais
  const triarc = accounts?.find((a: any) => a.platform === "instagram" || !a.platform) ?? accounts?.[0];
  const triacId = triarc?.id ?? 0;

  const { data: stats, isLoading: loadingStats } = trpc.accounts.stats.useQuery(
    { accountId: triacId },
    { enabled: !!triacId }
  );

  const { data: pendingPosts } = trpc.posts.list.useQuery({ status: "pending" });
  const { data: approvedPosts } = trpc.posts.list.useQuery({ status: "approved" });

  const isLoading = loadingAccounts || loadingStats;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const pendingCount = pendingPosts?.length ?? 0;
  const approvedCount = approvedPosts?.length ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Triarc Social Manager // Visão Geral</p>
        <h2 className="sr-only">Automação de conteúdo para Instagram com inteligência artificial</h2>
      </div>

      {/* Cards de todas as contas */}
      {(accounts ?? []).length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Redes Conectadas</h2>
          <div className="grid gap-3">
            {(accounts ?? []).map((account: any) => {
              const platform = account.platform ?? "instagram";
              const cfg = PLATFORM_CONFIG[platform] ?? { label: platform, icon: Globe, color: "text-gray-600", bg: "bg-gray-100", badge: "border-gray-300 text-gray-600" };
              const Icon = cfg.icon;
              const isInstagram = platform === "instagram";
              return (
                <Card key={account.id} className="border-border">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${cfg.bg}`}>
                        <Icon className={`h-5 w-5 ${cfg.color}`} />
                      </div>
                      <div>
                        <CardTitle className="text-base font-bold">
                          {platform === "instagram" || platform === "tiktok" ? "@" : ""}{account.handle}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">{account.displayName}</p>
                      </div>
                      <div className="ml-auto flex items-center gap-2">
                        <Badge variant="outline" className={`text-xs ${cfg.badge}`}>{cfg.label}</Badge>
                        {!isInstagram && (
                          <Badge variant="secondary" className="text-xs">Cadastrada</Badge>
                        )}
                        {isInstagram && (
                          <Badge variant="outline" className="text-xs border-green-400 text-green-700">MCP Ativo</Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  {isInstagram && (
                    <CardContent>
                      <div className="grid grid-cols-4 gap-3">
                        <button onClick={() => setLocation("/approval")} className="text-center p-3 rounded-lg bg-amber-50 hover:bg-amber-100 transition-colors border border-amber-100">
                          <div className="text-2xl font-extrabold text-amber-600">{stats?.pending ?? 0}</div>
                          <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wide">Pendentes</p>
                        </button>
                        <button onClick={() => setLocation("/approval")} className="text-center p-3 rounded-lg bg-green-50 hover:bg-green-100 transition-colors border border-green-200">
                          <div className="text-2xl font-extrabold text-green-600">{stats?.approved ?? 0}</div>
                          <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wide">Aprovados</p>
                        </button>
                        <button onClick={() => setLocation("/calendar")} className="text-center p-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors border border-blue-100">
                          <div className="text-2xl font-extrabold text-blue-600">{stats?.scheduled ?? 0}</div>
                          <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wide">Agendados</p>
                        </button>
                        <button onClick={() => setLocation("/history")} className="text-center p-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 transition-colors border border-emerald-100">
                          <div className="text-2xl font-extrabold text-emerald-600">{stats?.published ?? 0}</div>
                          <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wide">Publicados</p>
                        </button>
                      </div>
                    </CardContent>
                  )}
                  {!isInstagram && account.profileUrl && (
                    <CardContent className="pt-0">
                      <a href={account.profileUrl} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline truncate block">
                        {account.profileUrl}
                      </a>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Alerta: posts aprovados aguardando publicação */}
      {approvedCount > 0 && (
        <Card className="border-green-300 bg-green-50/50">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Rocket className="h-5 w-5 text-green-600" />
              <CardTitle className="text-base font-bold text-green-800">
                {approvedCount} post{approvedCount > 1 ? "s" : ""} aprovado{approvedCount > 1 ? "s" : ""} — aguardando publicação
              </CardTitle>
              <Button
                size="sm"
                variant="outline"
                className="ml-auto gap-1.5 border-green-400 text-green-700 hover:bg-green-100"
                onClick={() => setLocation("/approval")}
              >
                Publicar Agora
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(approvedPosts ?? []).slice(0, 3).map((post: any) => (
                <div key={post.id} className="flex items-center gap-3 p-2 rounded-lg bg-white/70">
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                  <p className="text-sm truncate flex-1">{post.caption?.substring(0, 80) ?? "Sem legenda"}</p>
                  {post.theme && (
                    <Badge variant="outline" className="text-xs shrink-0">{post.theme.substring(0, 20)}</Badge>
                  )}
                </div>
              ))}
              {approvedCount > 3 && (
                <p className="text-xs text-muted-foreground text-center pt-1">
                  +{approvedCount - 3} post{approvedCount - 3 > 1 ? "s" : ""} aprovado{approvedCount - 3 > 1 ? "s" : ""}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerta: posts pendentes de aprovação */}
      {pendingCount > 0 && (
        <Card className="border-amber-200 bg-amber-50/30">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              <CardTitle className="text-base font-bold">
                {pendingCount} post{pendingCount > 1 ? "s" : ""} aguardando aprovação
              </CardTitle>
              <Button
                size="sm"
                variant="outline"
                className="ml-auto gap-1.5 border-amber-300 text-amber-700 hover:bg-amber-100"
                onClick={() => setLocation("/approval")}
              >
                Revisar
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(pendingPosts ?? []).slice(0, 3).map((post: any) => (
                <div key={post.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <p className="text-sm truncate flex-1">{post.caption?.substring(0, 80) ?? "Sem legenda"}</p>
                  {post.scheduledAt && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                      <Clock className="h-3 w-3" />
                      {new Date(post.scheduledAt).toLocaleDateString("pt-BR")}
                    </div>
                  )}
                </div>
              ))}
              {pendingCount > 3 && (
                <p className="text-xs text-muted-foreground text-center pt-1">
                  +{pendingCount - 3} post{pendingCount - 3 > 1 ? "s" : ""} pendente{pendingCount - 3 > 1 ? "s" : ""}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resumo total */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-extrabold text-primary">{stats?.published ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wide">Total Publicados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-extrabold text-green-600">{stats?.approved ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wide">Na Fila</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-extrabold text-amber-500">{stats?.pending ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wide">Pendentes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-extrabold text-blue-500">{stats?.scheduled ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wide">Agendados</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
