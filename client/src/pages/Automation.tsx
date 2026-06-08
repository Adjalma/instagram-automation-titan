import { useState, useMemo, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Loader2, Zap, CalendarPlus, CheckCheck, Clock,
  Sparkles, ArrowRight, ListOrdered, RotateCcw, AlertCircle,
} from "lucide-react";

export default function Automation() {
  const { data: accounts } = trpc.accounts.list.useQuery();
  const { data: themes } = trpc.themes.list.useQuery();
  const { data: queue, refetch: refetchQueue } = trpc.automation.getQueue.useQuery();

  const [selectedAccountIds, setSelectedAccountIds] = useState<number[]>([]);
  const [batchAccountId, setBatchAccountId] = useState<string>("");
  const [batchStartDate, setBatchStartDate] = useState("");
  const [batchInterval, setBatchInterval] = useState("24");
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
  const [weekProgress, setWeekProgress] = useState(0);
  const [isGeneratingWeek, setIsGeneratingWeek] = useState(false);
  const [isGeneratingBatch, setIsGeneratingBatch] = useState(false);

  const generateWeek = trpc.automation.generateWeek.useMutation();
  const generateBatch = trpc.automation.generateBatch.useMutation();
  const approveAll = trpc.automation.approveAll.useMutation();
  const processScheduled = trpc.automation.processScheduled.useMutation();

  const queueByStatus = useMemo(() => {
    if (!queue) return { pending: [], approved: [], scheduled: [] };
    return {
      pending: queue.filter((p: any) => p.status === "pending"),
      approved: queue.filter((p: any) => p.status === "approved"),
      scheduled: queue.filter((p: any) => p.status === "scheduled"),
    };
  }, [queue]);

  const toggleAccount = useCallback((id: number) => {
    setSelectedAccountIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const toggleTheme = useCallback((name: string) => {
    setSelectedThemes((prev) =>
      prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name]
    );
  }, []);

  const handleGenerateWeek = async () => {
    setIsGeneratingWeek(true);
    setWeekProgress(10);
    try {
      const progressInterval = setInterval(() => {
        setWeekProgress((p) => Math.min(p + 8, 85));
      }, 3000);
      const result = await generateWeek.mutateAsync({
        accountIds: selectedAccountIds.length > 0 ? selectedAccountIds : undefined,
      });
      clearInterval(progressInterval);
      setWeekProgress(100);
      toast.success(`${result.created} posts gerados com sucesso!`);
      setTimeout(() => setWeekProgress(0), 1000);
      refetchQueue();
    } catch {
      setWeekProgress(0);
      toast.error("Erro ao gerar semana");
    } finally {
      setIsGeneratingWeek(false);
    }
  };

  const handleGenerateBatch = async () => {
    if (!batchAccountId) { toast.error("Selecione uma conta"); return; }
    if (selectedThemes.length === 0) { toast.error("Selecione pelo menos um tema"); return; }
    if (!batchStartDate) { toast.error("Informe a data de início"); return; }
    setIsGeneratingBatch(true);
    try {
      const result = await generateBatch.mutateAsync({
        accountId: Number(batchAccountId),
        themes: selectedThemes,
        startDate: batchStartDate,
        intervalHours: Number(batchInterval),
      });
      toast.success(`${result.created} posts gerados no lote!`);
      refetchQueue();
    } catch {
      toast.error("Erro ao gerar lote");
    } finally {
      setIsGeneratingBatch(false);
    }
  };

  const handleApproveAll = async () => {
    try {
      const result = await approveAll.mutateAsync({ publish: true });
      toast.success(`Processamento concluído!`, {
        description: `${result.approved} aprovados, ${result.published} publicados, ${result.scheduled} agendados.`,
      });
      if (result.errors?.length) {
        toast.warning(result.errors[0]);
      }
      refetchQueue();
    } catch {
      toast.error("Erro ao aprovar posts");
    }
  };

  const handleProcessScheduled = async () => {
    try {
      const result = await processScheduled.mutateAsync();
      if (result.processed === 0) {
        toast.info("Nenhum post agendado vencido no momento.");
      } else {
        toast.success(`${result.promoted} posts movidos para fila de publicação!`);
      }
      refetchQueue();
    } catch {
      toast.error("Erro ao processar agendados");
    }
  };

  const getAccountHandle = useCallback(
    (accountId: number) => accounts?.find((a: any) => a.id === accountId)?.handle ?? "?",
    [accounts]
  );

  const statusColor = (status: string, hasMcpPending?: boolean) => {
    if (status === "approved" && hasMcpPending) return "bg-violet-100 text-violet-700 border-violet-300";
    const map: Record<string, string> = {
      pending: "bg-amber-100 text-amber-700 border-amber-300",
      approved: "bg-green-100 text-green-700 border-green-300",
      scheduled: "bg-blue-100 text-blue-700 border-blue-300",
      published: "bg-emerald-100 text-emerald-700 border-emerald-300",
    };
    return map[status] ?? "bg-gray-100 text-gray-700 border-gray-300";
  };

  const statusLabel = (status: string, hasMcpPending?: boolean) => {
    if (status === "approved" && hasMcpPending) return "Publicando…";
    const map: Record<string, string> = {
      pending: "Pendente", approved: "Aprovado",
      scheduled: "Agendado", published: "Publicado",
    };
    return map[status] ?? status;
  };

  const batchValid = batchAccountId && selectedThemes.length > 0 && batchStartDate;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Automação</h1>
        <p className="text-sm text-muted-foreground mt-1">Geração em lote · Fila de publicação · Auto-agendamento</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gerar Semana */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-cyan-600" />
              <CardTitle className="text-lg font-bold">Gerar Semana Completa</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Cria posts para 7 dias com legendas e artes geradas por IA, nos melhores horários.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 block">
                Contas (vazio = todas)
              </label>
              <div className="flex flex-wrap gap-2">
                {accounts?.map((a: any) => (
                  <Button
                    key={a.id}
                    variant={selectedAccountIds.includes(a.id) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleAccount(a.id)}
                  >
                    @{a.handle}
                  </Button>
                ))}
              </div>
            </div>
            {isGeneratingWeek && weekProgress > 0 && (
              <div className="space-y-2">
                <Progress value={weekProgress} className="h-2" />
                <p className="text-xs text-muted-foreground text-center">
                  {weekProgress < 90 ? "Gerando legendas e imagens com IA..." : "Finalizando..."} {weekProgress}%
                </p>
              </div>
            )}
            <Button
              onClick={handleGenerateWeek}
              disabled={isGeneratingWeek}
              className="w-full gap-2 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-700 hover:to-cyan-600"
              size="lg"
            >
              {isGeneratingWeek ? <Loader2 className="h-5 w-5 animate-spin" /> : <Zap className="h-5 w-5" />}
              {isGeneratingWeek ? "Gerando..." : "Gerar 7 Dias de Conteúdo"}
            </Button>
          </CardContent>
        </Card>

        {/* Gerar Lote */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CalendarPlus className="h-5 w-5 text-pink-500" />
              <CardTitle className="text-lg font-bold">Gerar Lote Personalizado</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Escolha a conta, os temas e o intervalo para um lote customizado.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 block">Conta *</label>
              <Select value={batchAccountId} onValueChange={setBatchAccountId}>
                <SelectTrigger className={!batchAccountId ? "border-amber-400" : ""}>
                  <SelectValue placeholder="Selecionar conta" />
                </SelectTrigger>
                <SelectContent>
                  {accounts?.map((a: any) => (
                    <SelectItem key={a.id} value={String(a.id)}>@{a.handle}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 block">
                Temas * {selectedThemes.length > 0 && `(${selectedThemes.length} selecionados)`}
              </label>
              <div className="flex flex-wrap gap-2">
                {themes?.map((t: any) => (
                  <Button
                    key={t.id}
                    variant={selectedThemes.includes(t.name) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleTheme(t.name)}
                    className="text-xs"
                  >
                    {t.name}
                  </Button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 block">Data Início *</label>
                <Input
                  type="datetime-local"
                  value={batchStartDate}
                  onChange={(e) => setBatchStartDate(e.target.value)}
                  className={`font-mono text-sm ${!batchStartDate ? "border-amber-400" : ""}`}
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 block">Intervalo (h)</label>
                <Input
                  type="number" value={batchInterval}
                  onChange={(e) => setBatchInterval(e.target.value)}
                  min="1" className="font-mono text-sm"
                />
              </div>
            </div>
            {!batchValid && (
              <div className="flex items-center gap-2 text-xs text-amber-600">
                <AlertCircle className="h-3.5 w-3.5" />
                Preencha conta, temas e data de início
              </div>
            )}
            <Button
              onClick={handleGenerateBatch}
              disabled={isGeneratingBatch || !batchValid}
              className="w-full gap-2" size="lg" variant="outline"
            >
              {isGeneratingBatch ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
              {isGeneratingBatch ? "Gerando Lote..." : "Gerar Lote de Posts"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Fila */}
      <div>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <ListOrdered className="h-5 w-5 text-gray-600" />
            <h2 className="text-xl font-bold">Fila de Publicação</h2>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => refetchQueue()} className="gap-1.5">
              <RotateCcw className="h-3.5 w-3.5" />Atualizar
            </Button>
            <Button
              variant="outline" size="sm"
              onClick={handleProcessScheduled}
              disabled={processScheduled.isPending}
              className="gap-1.5"
            >
              {processScheduled.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CalendarPlus className="h-3.5 w-3.5" />}
              Publicar Agendados
            </Button>
            {queueByStatus.pending.length > 0 && (
              <Button size="sm" onClick={handleApproveAll} disabled={approveAll.isPending}
                className="gap-1.5 bg-green-600 hover:bg-green-700">
                {approveAll.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCheck className="h-3.5 w-3.5" />}
                Aprovar e Publicar Todos ({queueByStatus.pending.length})
              </Button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          {[
            { label: "Pendentes", count: queueByStatus.pending.length, color: "text-amber-600", icon: Clock, iconColor: "text-amber-300" },
            { label: "Aprovados", count: queueByStatus.approved.length, color: "text-green-600", icon: CheckCheck, iconColor: "text-green-300" },
            { label: "Agendados", count: queueByStatus.scheduled.length, color: "text-blue-600", icon: CalendarPlus, iconColor: "text-blue-300" },
          ].map(({ label, count, color, icon: Icon, iconColor }) => (
            <Card key={label} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
                  <p className={`text-2xl font-extrabold tabular-nums ${color}`}>{count}</p>
                </div>
                <Icon className={`h-8 w-8 ${iconColor}`} />
              </div>
            </Card>
          ))}
        </div>

        {/* Lista */}
        <div className="space-y-2">
          {queue && queue.length > 0 ? (
            queue.map((post: any, index: number) => (
              <Card key={post.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-bold text-muted-foreground shrink-0 tabular-nums">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-bold text-sm">@{getAccountHandle(post.accountId)}</span>
                        <Badge variant="outline" className={`text-[10px] ${statusColor(post.status, post.mcpPending)}`}>
                          {statusLabel(post.status, post.mcpPending)}
                        </Badge>
                        {post.theme && <Badge variant="outline" className="text-[10px]">{post.theme}</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {post.caption ? post.caption.substring(0, 120) + "..." : "Sem legenda"}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      {post.scheduledAt && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {new Date(post.scheduledAt).toLocaleString("pt-BR", {
                            day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
                          })}
                        </div>
                      )}
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <Zap className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Nenhum post na fila.</p>
                <p className="text-xs mt-1">Use os geradores acima para criar conteúdo automaticamente.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
