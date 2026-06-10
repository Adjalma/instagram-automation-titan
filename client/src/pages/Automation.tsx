import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Loader2, Zap, CalendarPlus, CheckCheck, Clock, Sparkles, ArrowRight, ListOrdered, RotateCcw } from "lucide-react";

export default function Automation() {
  const { data: accounts } = trpc.accounts.list.useQuery();
  const { data: themes } = trpc.themes.list.useQuery();
  const { data: queue, refetch: refetchQueue } = trpc.automation.getQueue.useQuery();
  const [selectedAccountIds, setSelectedAccountIds] = useState<number[]>([]);
  const [batchAccountId, setBatchAccountId] = useState<string>("");
  const [batchStartDate, setBatchStartDate] = useState("");
  const [batchInterval, setBatchInterval] = useState("24");
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
  const [isGeneratingWeek, setIsGeneratingWeek] = useState(false);
  const [isGeneratingBatch, setIsGeneratingBatch] = useState(false);
  const [weekProgress, setWeekProgress] = useState("");

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

  const toggleAccount = (id: number) => {
    setSelectedAccountIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleTheme = (name: string) => {
    setSelectedThemes(prev =>
      prev.includes(name) ? prev.filter(x => x !== name) : [...prev, name]
    );
  };

  const handleGenerateWeek = async () => {
    setIsGeneratingWeek(true);
    setWeekProgress("Gerando legendas e artes com IA para 7 dias... Isso pode levar alguns minutos.");
    try {
      const result = await generateWeek.mutateAsync({
        accountIds: selectedAccountIds.length > 0 ? selectedAccountIds : undefined,
      });
      toast.success(`${result.created} posts gerados com sucesso!`);
      setWeekProgress("");
      refetchQueue();
    } catch (e) {
      toast.error("Erro ao gerar semana");
      setWeekProgress("");
    } finally {
      setIsGeneratingWeek(false);
    }
  };

  const handleGenerateBatch = async () => {
    if (!batchAccountId || selectedThemes.length === 0 || !batchStartDate) {
      toast.error("Preencha todos os campos do lote");
      return;
    }
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
    } catch (e) {
      toast.error("Erro ao gerar lote");
    } finally {
      setIsGeneratingBatch(false);
    }
  };

  const handleApproveAll = async () => {
    try {
      const result = await approveAll.mutateAsync();
      toast.success(`Processamento concluído!`, {
        description: `${result.approved} na fila de publicação, ${result.scheduled} agendados.`,
      });
      refetchQueue();
    } catch (e) {
      toast.error("Erro ao aprovar posts");
    }
  };

  const handleProcessScheduled = async () => {
    try {
      const result = await processScheduled.mutateAsync();
      if (result.processed === 0) {
        toast.info("Nenhum post agendado vencido no momento.");
      } else {
        toast.success(`${result.promoted} posts movidos para fila de publicação de ${result.processed} verificados!`);
      }
      refetchQueue();
    } catch (e) {
      toast.error("Erro ao processar agendados");
    }
  };

  const getAccountHandle = (accountId: number) => {
    return accounts?.find(a => a.id === accountId)?.handle ?? "?";
  };

  const statusColor = (status: string, hasMcpPending?: boolean) => {
    if (status === "approved" && hasMcpPending) return "bg-violet-100 text-violet-700 border-violet-300";
    switch (status) {
      case "pending": return "bg-amber-100 text-amber-700 border-amber-300";
      case "approved": return "bg-green-100 text-green-700 border-green-300";
      case "scheduled": return "bg-blue-100 text-blue-700 border-blue-300";
      case "published": return "bg-emerald-100 text-emerald-700 border-emerald-300";
      default: return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  const statusLabel = (status: string, hasMcpPending?: boolean) => {
    if (status === "approved" && hasMcpPending) return "Aguardando MCP";
    switch (status) {
      case "pending": return "Pendente";
      case "approved": return "Aprovado";
      case "scheduled": return "Agendado";
      case "published": return "Publicado";
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Automação</h1>
        <p className="label-mono mt-1">Geração em lote // Fila de publicação // Auto-agendamento</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Generate Week */}
        <Card className="card-blueprint">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-cyan-600" />
              <CardTitle className="text-lg font-bold">Gerar Semana Completa</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Cria automaticamente posts para 7 dias com legendas e artes geradas por IA, distribuídos nos melhores horários.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="label-mono mb-2 block">Contas (selecione ou deixe vazio para todas)</label>
              <div className="flex flex-wrap gap-2">
                {accounts?.map(a => (
                  <Button
                    key={a.id}
                    variant={selectedAccountIds.includes(a.id) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleAccount(a.id)}
                    className="gap-1.5"
                  >
                    @{a.handle}
                  </Button>
                ))}
              </div>
            </div>
            {weekProgress && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-cyan-50 border border-cyan-200">
                <Loader2 className="h-4 w-4 animate-spin text-cyan-600" />
                <span className="text-sm text-cyan-700">{weekProgress}</span>
              </div>
            )}
            <Button
              onClick={handleGenerateWeek}
              disabled={isGeneratingWeek}
              className="w-full gap-2 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-700 hover:to-cyan-600"
              size="lg"
            >
              {isGeneratingWeek ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Zap className="h-5 w-5" />
              )}
              {isGeneratingWeek ? "Gerando..." : "Gerar 7 Dias de Conteúdo"}
            </Button>
          </CardContent>
        </Card>

        {/* Generate Batch */}
        <Card className="card-blueprint">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CalendarPlus className="h-5 w-5 text-pink-500" />
              <CardTitle className="text-lg font-bold">Gerar Lote Personalizado</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Escolha a conta, os temas e o intervalo para gerar um lote de posts customizado.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="label-mono mb-2 block">Conta</label>
              <Select value={batchAccountId} onValueChange={setBatchAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar conta" />
                </SelectTrigger>
                <SelectContent>
                  {accounts?.map(a => (
                    <SelectItem key={a.id} value={String(a.id)}>@{a.handle}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="label-mono mb-2 block">Temas do Lote</label>
              <div className="flex flex-wrap gap-2">
                {themes?.map(t => (
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
              {selectedThemes.length > 0 && (
                <p className="label-mono mt-2">{selectedThemes.length} temas selecionados → {selectedThemes.length} posts</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-mono mb-2 block">Data Início</label>
                <Input
                  type="datetime-local"
                  value={batchStartDate}
                  onChange={e => setBatchStartDate(e.target.value)}
                  className="font-mono text-sm"
                />
              </div>
              <div>
                <label className="label-mono mb-2 block">Intervalo (horas)</label>
                <Input
                  type="number"
                  value={batchInterval}
                  onChange={e => setBatchInterval(e.target.value)}
                  min="1"
                  className="font-mono text-sm"
                />
              </div>
            </div>
            <Button
              onClick={handleGenerateBatch}
              disabled={isGeneratingBatch}
              className="w-full gap-2"
              size="lg"
              variant="outline"
            >
              {isGeneratingBatch ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Sparkles className="h-5 w-5" />
              )}
              {isGeneratingBatch ? "Gerando Lote..." : "Gerar Lote de Posts"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Queue Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ListOrdered className="h-5 w-5 text-gray-600" />
            <h2 className="text-xl font-bold">Fila de Publicação</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetchQueue()} className="gap-1.5">
              <RotateCcw className="h-3.5 w-3.5" />
              Atualizar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleProcessScheduled}
              disabled={processScheduled.isPending}
              className="gap-1.5"
            >
              {processScheduled.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CalendarPlus className="h-3.5 w-3.5" />}
              Publicar Agendados
            </Button>
            {queueByStatus.pending.length > 0 && (
              <Button size="sm" onClick={handleApproveAll} disabled={approveAll.isPending} className="gap-1.5 bg-green-600 hover:bg-green-700">
                {approveAll.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCheck className="h-3.5 w-3.5" />}
                Aprovar e Publicar Todos ({queueByStatus.pending.length})
              </Button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <Card className="card-blueprint p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="label-mono">Pendentes</p>
                <p className="text-2xl font-extrabold text-amber-600">{queueByStatus.pending.length}</p>
              </div>
              <Clock className="h-8 w-8 text-amber-300" />
            </div>
          </Card>
          <Card className="card-blueprint p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="label-mono">Aprovados</p>
                <p className="text-2xl font-extrabold text-green-600">{queueByStatus.approved.length}</p>
              </div>
              <CheckCheck className="h-8 w-8 text-green-300" />
            </div>
          </Card>
          <Card className="card-blueprint p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="label-mono">Agendados</p>
                <p className="text-2xl font-extrabold text-blue-600">{queueByStatus.scheduled.length}</p>
              </div>
              <CalendarPlus className="h-8 w-8 text-blue-300" />
            </div>
          </Card>
        </div>

        {/* Queue List */}
        <div className="space-y-2">
          {queue && queue.length > 0 ? (
            queue.map((post: any, index: number) => (
              <Card key={post.id} className="card-blueprint">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-sm font-bold text-gray-500 shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-sm">@{getAccountHandle(post.accountId)}</span>
                        <Badge variant="outline" className={`text-[10px] ${statusColor(post.status, post.mcpPending)}`}>
                          {statusLabel(post.status, post.mcpPending)}
                        </Badge>
                        {post.theme && (
                          <Badge variant="outline" className="text-[10px]">{post.theme}</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {post.caption ? (typeof post.caption === 'string' ? post.caption.substring(0, 120) : '') + "..." : "Sem legenda"}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      {post.scheduledAt && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {new Date(post.scheduledAt).toLocaleString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
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
            <Card className="card-blueprint">
              <CardContent className="p-8 text-center text-muted-foreground">
                <Zap className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Nenhum post na fila. Use os geradores acima para criar conteúdo automaticamente.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
