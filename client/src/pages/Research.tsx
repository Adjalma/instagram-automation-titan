import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Loader2, Plus, Trash2, Play, Globe, Clock, CheckCircle2,
  XCircle, SkipForward, Newspaper, Sparkles, Zap, Pause,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

function StatusBadge({ status }: { status: string }) {
  if (status === "success")
    return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 gap-1 text-xs"><CheckCircle2 className="h-3 w-3" />Sucesso</Badge>;
  if (status === "failed")
    return <Badge className="bg-red-500/20 text-red-400 border-red-500/30 gap-1 text-xs"><XCircle className="h-3 w-3" />Falhou</Badge>;
  return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 gap-1 text-xs"><SkipForward className="h-3 w-3" />Ignorado</Badge>;
}

function AddTopicDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [query, setQuery] = useState("");
  const [language, setLanguage] = useState<"pt" | "en">("pt");
  const [accountId, setAccountId] = useState("");
  const [publishHour, setPublishHour] = useState("8");
  const { data: accounts } = trpc.accounts.list.useQuery();
  const createTopic = trpc.research.createTopic.useMutation();

  const handleSubmit = async () => {
    if (!name.trim()) { toast.error("Informe o nome do tópico"); return; }
    if (!query.trim()) { toast.error("Informe a query de busca"); return; }
    if (!accountId) { toast.error("Selecione uma conta"); return; }
    try {
      await createTopic.mutateAsync({
        name: name.trim(), query: query.trim(),
        language, accountId: Number(accountId), publishHour: Number(publishHour),
      });
      toast.success("Tópico criado!");
      setOpen(false);
      setName(""); setQuery(""); setAccountId("");
      onCreated();
    } catch { toast.error("Erro ao criar tópico"); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2"><Plus className="h-4 w-4" />Novo Tópico</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Novo Tópico de Pesquisa</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 block">Nome do Tópico *</label>
            <Input placeholder="ex: Inteligência Artificial" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 block">Query de Busca *</label>
            <Input placeholder='ex: "artificial intelligence" OR "machine learning"' value={query} onChange={(e) => setQuery(e.target.value)} />
            <p className="text-xs text-muted-foreground mt-1">Use aspas para frases exatas. Ex: "solar energy" OR "energia solar"</p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 block">Horário</label>
              <Select value={publishHour} onValueChange={setPublishHour}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 24 }, (_, i) => (
                    <SelectItem key={i} value={String(i)}>{String(i).padStart(2, "0")}:00</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 block">Idioma</label>
              <Select value={language} onValueChange={(v) => setLanguage(v as "pt" | "en")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pt">🇧🇷 PT</SelectItem>
                  <SelectItem value="en">🇺🇸 EN</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 block">Conta *</label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger className={!accountId ? "border-amber-400" : ""}>
                  <SelectValue placeholder="Conta" />
                </SelectTrigger>
                <SelectContent>
                  {accounts?.map((a: any) => (
                    <SelectItem key={a.id} value={String(a.id)}>@{a.handle}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleSubmit} className="w-full" disabled={createTopic.isPending}>
            {createTopic.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Criar Tópico
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Research() {
  const utils = trpc.useUtils();
  const { data: topics, isLoading: loadingTopics } = trpc.research.listTopics.useQuery();
  const { data: runs, isLoading: loadingRuns } = trpc.research.listRuns.useQuery({ limit: 30 });
  const [runningId, setRunningId] = useState<number | null>(null);

  const deleteTopic = trpc.research.deleteTopic.useMutation({
    onSuccess: () => { utils.research.listTopics.invalidate(); toast.success("Tópico removido"); },
  });
  const toggleTopic = trpc.research.updateTopic.useMutation({
    onSuccess: () => utils.research.listTopics.invalidate(),
  });
  const runNow = trpc.research.runNow.useMutation({
    onSuccess: (data) => {
      utils.research.listRuns.invalidate();
      utils.research.listTopics.invalidate();
      if (data.success) {
        toast.success(
          `Post criado! #${data.postId}`,
          { description: data.autoPublished ? "Publicado automaticamente!" : "Aguardando aprovação." }
        );
      } else {
        toast.warning(data.message);
      }
    },
    onError: () => toast.error("Erro ao executar pesquisa"),
    onSettled: () => setRunningId(null),
  });

  const handleRunNow = useCallback(async (topicId: number) => {
    setRunningId(topicId);
    await runNow.mutateAsync({ topicId });
  }, [runNow]);

  const topicMap = Object.fromEntries((topics ?? []).map((t: any) => [t.id, t.name]));

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <Newspaper className="h-7 w-7 text-cyan-400" /> Pesquisa Diária
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Notícias das últimas 24h → Post com imagem IA → Aprovação</p>
        </div>
        <AddTopicDialog onCreated={() => utils.research.listTopics.invalidate()} />
      </div>

      {/* Banner info */}
      <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/5 p-4 flex gap-3">
        <Sparkles className="h-5 w-5 text-cyan-400 shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold text-cyan-300">Automação ativa — todo dia no horário configurado</p>
          <p className="text-muted-foreground mt-0.5">
            Para cada tópico ativo, o sistema busca as 5 notícias mais recentes, gera uma legenda personalizada e uma imagem com IA.
            Com <strong>Auto</strong> <Zap className="h-3 w-3 inline text-yellow-400" /> ativo, o post é publicado diretamente sem aprovação manual.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tópicos */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Tópicos Configurados</h2>
          {loadingTopics ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}><CardContent className="py-3 px-4"><Skeleton className="h-12 w-full" /></CardContent></Card>
              ))}
            </div>
          ) : !topics?.length ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                <Newspaper className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Nenhum tópico configurado.</p>
                <p className="text-xs mt-1">Crie um tópico para começar a pesquisa diária automática.</p>
              </CardContent>
            </Card>
          ) : (
            topics.map((topic: any) => (
              <Card key={topic.id} className={`transition-opacity ${topic.active ? "" : "opacity-50"}`}>
                <CardContent className="py-3 px-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm truncate">{topic.name}</span>
                        <Badge variant="outline" className="text-xs shrink-0">
                          <Globe className="h-2.5 w-2.5 mr-1" />{topic.language === "pt" ? "PT" : "EN"}
                        </Badge>
                        <Badge variant="outline" className="text-xs shrink-0 font-mono">
                          <Clock className="h-2.5 w-2.5 mr-1" />{String(topic.publishHour ?? 8).padStart(2, "0")}:00
                        </Badge>
                        {topic.active ? (
                          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs shrink-0">Ativo</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs shrink-0 text-muted-foreground">Pausado</Badge>
                        )}
                        {topic.autoPublish ? (
                          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs shrink-0 gap-1">
                            <Zap className="h-2.5 w-2.5" />Auto
                          </Badge>
                        ) : null}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 font-mono truncate">{topic.query}</p>
                      {topic.lastRunAt && (
                        <p className="text-xs text-muted-foreground/60 mt-0.5">
                          Última execução: {new Date(topic.lastRunAt).toLocaleString("pt-BR")}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="outline" size="icon" className="h-7 w-7"
                        onClick={() => handleRunNow(topic.id)}
                        disabled={runningId === topic.id} title="Executar agora">
                        {runningId === topic.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                      </Button>
                      <Button variant="outline" size="icon" className="h-7 w-7"
                        onClick={() => toggleTopic.mutate({ id: topic.id, active: topic.active ? 0 : 1 })}
                        title={topic.active ? "Pausar" : "Ativar"}>
                        {topic.active ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 text-emerald-400" />}
                      </Button>
                      <Button
                        variant={topic.autoPublish ? "default" : "outline"}
                        size="icon" className="h-7 w-7"
                        onClick={() => toggleTopic.mutate({ id: topic.id, autoPublish: topic.autoPublish ? 0 : 1 })}
                        title={topic.autoPublish ? "Auto-publicar ativo" : "Ativar auto-publicar"}>
                        <Zap className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="outline" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => deleteTopic.mutate({ id: topic.id })} title="Remover">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Histórico */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Histórico de Execuções</h2>
          {loadingRuns ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}><CardContent className="py-3 px-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
              ))}
            </div>
          ) : !runs?.length ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Nenhuma execução ainda.</p>
                <p className="text-xs mt-1">Clique em ▶ em um tópico para testar agora.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {runs.map((run: any) => {
                const headlines: string[] = run.headlines ? JSON.parse(run.headlines) : [];
                return (
                  <Card key={run.id}>
                    <CardContent className="py-3 px-4 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold truncate">{topicMap[run.topicId] ?? `Tópico #${run.topicId}`}</span>
                        <StatusBadge status={run.status} />
                      </div>
                      {run.postId && (
                        <p className="text-xs text-muted-foreground">Post #{run.postId} criado</p>
                      )}
                      {run.error && (
                        <p className="text-xs text-red-400 font-mono line-clamp-2">{run.error}</p>
                      )}
                      {headlines.length > 0 && (
                        <div className="text-xs text-muted-foreground space-y-0.5">
                          {headlines.slice(0, 2).map((h, i) => (
                            <p key={i} className="truncate">• {h}</p>
                          ))}
                          {headlines.length > 2 && (
                            <p className="text-muted-foreground/60">+{headlines.length - 2} manchetes</p>
                          )}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground/60 font-mono">
                        {new Date(run.ranAt).toLocaleString("pt-BR")}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
