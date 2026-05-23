import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Target, Zap, Calendar, TrendingUp, BarChart2,
  AlertTriangle, CheckCircle, Clock, RefreshCw,
} from "lucide-react";

type ActionPlanData = {
  diagnosis: string;
  score: number;
  actions: { priority: string; title: string; description: string; metric: string; deadline: string }[];
  contentCalendar: { day: string; type: string; theme: string; platform: string }[];
  kpis: { name: string; current: string; target: string; period: string }[];
  quickWins: string[];
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  alta: { label: "Alta", color: "bg-red-100 text-red-700 border-red-200", icon: AlertTriangle },
  media: { label: "Média", color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: Clock },
  baixa: { label: "Baixa", color: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle },
};

function ScoreRing({ score }: { score: number }) {
  const r = 40;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 70 ? "#22c55e" : score >= 40 ? "#f59e0b" : "#ef4444";
  return (
    <div className="relative w-28 h-28 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
        <circle
          cx="50" cy="50" r={r} fill="none"
          stroke={color} strokeWidth="10"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold" style={{ color }}>{score}</span>
        <span className="text-xs text-muted-foreground">/ 100</span>
      </div>
    </div>
  );
}

export default function ActionPlan() {
  const [plan, setPlan] = useState<ActionPlanData | null>(null);
  const [period, setPeriod] = useState<"week" | "month">("week");

  const generate = trpc.actionPlan.generate.useMutation({
    onSuccess: (data) => {
      setPlan(data as ActionPlanData);
      toast.success("Plano de ação gerado com sucesso!");
    },
    onError: (e) => toast.error(`Erro ao gerar plano: ${e.message}`),
  });

  const summary = trpc.analytics.getSummary.useQuery();

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Target className="w-6 h-6 text-primary" />
            Plano de Ação
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            IA analisa sua performance e gera um plano estratégico personalizado
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border overflow-hidden">
            {(["week", "month"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  period === p ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                }`}
              >
                {p === "week" ? "Semana" : "Mês"}
              </button>
            ))}
          </div>
          <Button
            onClick={() => generate.mutate({ period })}
            disabled={generate.isPending}
            className="gap-2"
          >
            {generate.isPending ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Zap className="w-4 h-4" />
            )}
            {generate.isPending ? "Gerando..." : "Gerar Plano"}
          </Button>
        </div>
      </div>

      {/* Stats rápidos */}
      {summary.data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Posts Publicados", value: summary.data.published, color: "text-green-600" },
            { label: "Curtidas Totais", value: summary.data.totalLikes, color: "text-pink-500" },
            { label: "Comentários", value: summary.data.totalComments, color: "text-purple-500" },
            { label: "Pendentes", value: summary.data.pending, color: "text-yellow-600" },
          ].map((s) => (
            <Card key={s.label} className="text-center py-3">
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </Card>
          ))}
        </div>
      )}

      {/* Placeholder quando não há plano */}
      {!plan && !generate.isPending && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center space-y-3">
            <Target className="w-12 h-12 text-muted-foreground mx-auto" />
            <p className="font-medium">Nenhum plano gerado ainda</p>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Clique em "Gerar Plano" para que a IA analise sua performance e crie um plano estratégico personalizado para a Triarc Solutions.
            </p>
          </CardContent>
        </Card>
      )}

      {generate.isPending && (
        <Card>
          <CardContent className="py-12 text-center space-y-3">
            <RefreshCw className="w-10 h-10 text-primary mx-auto animate-spin" />
            <p className="font-medium">Analisando performance e gerando plano...</p>
            <p className="text-sm text-muted-foreground">Isso pode levar até 30 segundos</p>
          </CardContent>
        </Card>
      )}

      {plan && (
        <>
          {/* Score + Diagnóstico */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-primary" /> Score de Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScoreRing score={plan.score} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" /> Diagnóstico
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">{plan.diagnosis}</p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Wins */}
          {plan.quickWins?.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-500" /> Quick Wins (Ações Imediatas)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {plan.quickWins.map((win, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                      <span>{win}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Ações Estratégicas */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" /> Ações Estratégicas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {plan.actions.map((action, i) => {
                const cfg = PRIORITY_CONFIG[action.priority.toLowerCase()] ?? PRIORITY_CONFIG.media;
                const Icon = cfg.icon;
                return (
                  <div key={i} className="border rounded-lg p-3 space-y-1.5">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <p className="font-medium text-sm">{action.title}</p>
                      <Badge variant="outline" className={`text-xs ${cfg.color} shrink-0`}>
                        <Icon className="w-3 h-3 mr-1" />
                        {cfg.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{action.description}</p>
                    <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <BarChart2 className="w-3 h-3" /> {action.metric}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {action.deadline}
                      </span>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Calendário de Conteúdo */}
          {plan.contentCalendar?.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" /> Calendário de Conteúdo Sugerido
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {plan.contentCalendar.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                      <span className="text-xs font-semibold text-muted-foreground w-20 shrink-0">{item.day}</span>
                      <Badge variant="secondary" className="text-xs shrink-0">{item.type}</Badge>
                      <span className="text-sm flex-1 min-w-0 truncate">{item.theme}</span>
                      <span className="text-xs text-muted-foreground shrink-0">{item.platform}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* KPIs */}
          {plan.kpis?.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" /> KPIs e Metas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-3">
                  {plan.kpis.map((kpi, i) => (
                    <div key={i} className="border rounded-lg p-3 space-y-1">
                      <p className="text-sm font-medium">{kpi.name}</p>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-muted-foreground">Atual: <strong>{kpi.current}</strong></span>
                        <span className="text-primary">→ Meta: <strong>{kpi.target}</strong></span>
                      </div>
                      <p className="text-xs text-muted-foreground">{kpi.period}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
