import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Sparkles, Send, Calendar, X, Plus, Images, Lightbulb, RefreshCw } from "lucide-react";
import { useLocation } from "wouter";

// Componente para adicionar URL manualmente
function AddMediaUrlField({ onAdd, disabled }: { onAdd: (url: string) => void; disabled: boolean }) {
  const [url, setUrl] = useState("");
  const handleAdd = () => {
    const trimmed = url.trim();
    if (!trimmed.startsWith("http")) { toast.error("URL inválida"); return; }
    onAdd(trimmed);
    setUrl("");
  };
  return (
    <div className="flex gap-2">
      <Input
        placeholder="Adicionar URL de imagem manualmente..."
        value={url}
        onChange={e => setUrl(e.target.value)}
        onKeyDown={e => e.key === "Enter" && !disabled && handleAdd()}
        disabled={disabled}
        className="text-sm font-mono"
      />
      <Button variant="outline" size="sm" onClick={handleAdd} disabled={disabled || !url.trim()}>
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}

export default function CreatePost() {
  const [, setLocation] = useLocation();
  const { data: accounts } = trpc.accounts.list.useQuery();
  const { data: themes } = trpc.themes.list.useQuery();
  const { data: triacItems } = trpc.triacContent.list.useQuery();
  const [accountId, setAccountId] = useState<string>("");
  const [theme, setTheme] = useState<string>("");
  const [contentSource, setContentSource] = useState<"theme" | "triac">("triac");
  const [selectedTriacId, setSelectedTriacId] = useState<string>("");
  const [caption, setCaption] = useState("");
  const [extraContext, setExtraContext] = useState("");
  const [customSubject, setCustomSubject] = useState("");
  const [isGeneratingSubjects, setIsGeneratingSubjects] = useState(false);
  const [subjectSuggestions, setSubjectSuggestions] = useState<string[]>([]);

  const DEFAULT_SUBJECTS = [
    "Inteligência Artificial no desenvolvimento de software",
    "Automação de processos com IA",
    "Segurança da informação para empresas",
    "Desenvolvimento web moderno com React",
    "Cases de sucesso da Triarc Solutions",
    "Tendências de tecnologia em 2026",
    "DevOps e CI/CD na prática",
    "Transformação digital para pequenas empresas",
    "APIs e integrações: como conectar sistemas",
    "Cloud computing: AWS, Azure e GCP",
    "Mobile first: apps iOS e Android",
    "UX/UI: design que converte",
  ];
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [scheduledAt, setScheduledAt] = useState("");
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);
  const [isGeneratingArt, setIsGeneratingArt] = useState(false);

  const generateCaption = trpc.ai.generateCaption.useMutation();
  const generateArt = trpc.ai.generateArt.useMutation();
  const createPost = trpc.posts.create.useMutation();
  const submitForApproval = trpc.posts.submitForApproval.useMutation();

  const selectedAccount = useMemo(() => accounts?.find(a => a.id === Number(accountId)), [accounts, accountId]);
  const selectedTriacItem = useMemo(() => triacItems?.find(i => i.id === Number(selectedTriacId)), [triacItems, selectedTriacId]);

  const effectiveTheme = useMemo(() => {
    if (contentSource === "triac" && selectedTriacItem) {
      return `${selectedTriacItem.name}: ${selectedTriacItem.description}`;
    }
    return theme;
  }, [contentSource, selectedTriacItem, theme]);

  const handleGenerateSuggestions = async () => {
    setIsGeneratingSubjects(true);
    try {
      const result = await generateCaption.mutateAsync({
        accountId: Number(accountId) || 1,
        theme: "Gere 8 sugestões criativas de assuntos para posts de marketing digital e tecnologia para a empresa Triarc Solutions. Retorne apenas uma lista JSON de strings, sem explicações.",
        extraContext: "Retorne SOMENTE um array JSON de 8 strings com os assuntos. Ex: [\"Assunto 1\", \"Assunto 2\", ...]",
      });
      try {
        const text = typeof result.caption === "string" ? result.caption : "";
        const match = text.match(/\[[\s\S]*\]/);
        if (match) {
          const parsed = JSON.parse(match[0]);
          if (Array.isArray(parsed)) { setSubjectSuggestions(parsed.slice(0, 8)); return; }
        }
      } catch {}
      setSubjectSuggestions(DEFAULT_SUBJECTS.slice(0, 8));
    } catch {
      setSubjectSuggestions(DEFAULT_SUBJECTS.slice(0, 8));
    } finally {
      setIsGeneratingSubjects(false);
    }
  };

  const handleGenerateCaption = async () => {
    const effectiveSubject = customSubject.trim() || effectiveTheme;
    if (!accountId || !effectiveSubject) { toast.error("Selecione a conta e defina um assunto primeiro"); return; }
    setIsGeneratingCaption(true);
    try {
      const result = await generateCaption.mutateAsync({ accountId: Number(accountId), theme: customSubject.trim() || effectiveTheme, extraContext: extraContext || undefined });
      setCaption(typeof result.caption === "string" ? result.caption : "");
      toast.success("Legenda gerada!");
    } catch { toast.error("Erro ao gerar legenda"); }
    finally { setIsGeneratingCaption(false); }
  };

  const handleGenerateArt = async () => {
    const effectiveSubject = customSubject.trim() || effectiveTheme;
    if (!accountId || !effectiveSubject) { toast.error("Selecione a conta e defina um assunto primeiro"); return; }
    if (mediaUrls.length >= 10) { toast.error("Máximo de 10 imagens por carrossel"); return; }
    setIsGeneratingArt(true);
    try {
      const result = await generateArt.mutateAsync({ accountId: Number(accountId), theme: customSubject.trim() || effectiveTheme, description: extraContext || undefined });
      if (result.url) {
        setMediaUrls(prev => [...prev, result.url as string]);
        toast.success(mediaUrls.length === 0 ? "Arte gerada!" : `Slide ${mediaUrls.length + 1} adicionado ao carrossel!`);
      }
    } catch { toast.error("Erro ao gerar arte"); }
    finally { setIsGeneratingArt(false); }
  };

  const removeMedia = (index: number) => setMediaUrls(prev => prev.filter((_, i) => i !== index));

  const handleSubmit = async (submitApproval: boolean) => {
    if (!accountId) { toast.error("Selecione uma conta"); return; }
    try {
      const result = await createPost.mutateAsync({
        accountId: Number(accountId),
        caption,
        theme: effectiveTheme || undefined,
        scheduledAt: scheduledAt || undefined,
        mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
      });
      if (submitApproval) {
        await submitForApproval.mutateAsync({ id: result.id });
        toast.success("Post enviado para aprovação!");
      } else {
        toast.success("Rascunho salvo!");
      }
      setLocation("/");
    } catch { toast.error("Erro ao criar post"); }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Criar Post</h1>
        <p className="label-mono mt-1">Editor de conteúdo // Geração com IA</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {/* Configuração */}
          <Card className="card-blueprint">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">Configuração</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-mono mb-2 block">Conta Destino</label>
                  <Select value={accountId} onValueChange={setAccountId}>
                    <SelectTrigger><SelectValue placeholder="Selecionar conta" /></SelectTrigger>
                    <SelectContent>
                      {accounts?.map(a => <SelectItem key={a.id} value={String(a.id)}>@{a.handle}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="label-mono mb-2 block">Fonte de Conteúdo</label>
                  <Select value={contentSource} onValueChange={(v) => setContentSource(v as "theme" | "triac")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="triac">Projetos e Serviços Triarc</SelectItem>
                      <SelectItem value="theme">Temas Genéricos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {contentSource === "triac" && (
                <div>
                  <label className="label-mono mb-2 block">Projeto / Serviço</label>
                  <Select value={selectedTriacId} onValueChange={setSelectedTriacId}>
                    <SelectTrigger><SelectValue placeholder="Selecionar projeto ou serviço" /></SelectTrigger>
                    <SelectContent className="max-h-72">
                      {triacItems?.filter(i => i.type === "servico").length ? (
                        <>
                          <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">💼 Serviços</div>
                          {triacItems.filter(i => i.type === "servico").map(i => <SelectItem key={i.id} value={String(i.id)}>{i.name}</SelectItem>)}
                        </>
                      ) : null}
                      {triacItems?.filter(i => i.type === "projeto").length ? (
                        <>
                          <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide mt-1">🚀 Projetos</div>
                          {triacItems.filter(i => i.type === "projeto").map(i => <SelectItem key={i.id} value={String(i.id)}>{i.name}</SelectItem>)}
                        </>
                      ) : null}
                    </SelectContent>
                  </Select>
                  {selectedTriacItem && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{selectedTriacItem.subtitle}</p>}
                </div>
              )}
              {contentSource === "theme" && (
                <div>
                  <label className="label-mono mb-2 block">Tema</label>
                  <Select value={theme} onValueChange={setTheme}>
                    <SelectTrigger><SelectValue placeholder="Selecionar tema" /></SelectTrigger>
                    <SelectContent>
                      {themes?.map(t => <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {selectedAccount && (
                <Badge variant="outline" className={selectedAccount.tone === "personal" ? "border-pink-300 text-pink-600" : "border-cyan-300 text-cyan-700"}>
                  Tom: {selectedAccount.tone === "personal" ? "Pessoal" : "Corporativo"}
                </Badge>
              )}
            </CardContent>
          </Card>

          {/* Assunto do Post */}
          <Card className="card-blueprint">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-yellow-400" /> Assunto do Post
                </CardTitle>
                <Button variant="outline" size="sm" onClick={handleGenerateSuggestions} disabled={isGeneratingSubjects} className="gap-1.5 text-xs">
                  {isGeneratingSubjects ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                  Sugerir com IA
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="Digite o assunto do post (ex: Segurança da informação para PMEs)..."
                value={customSubject}
                onChange={e => setCustomSubject(e.target.value)}
                className="text-sm"
              />
              {(subjectSuggestions.length > 0 || DEFAULT_SUBJECTS.length > 0) && (
                <div className="space-y-2">
                  <p className="label-mono text-xs">Sugestões — clique para usar:</p>
                  <div className="flex flex-wrap gap-2">
                    {(subjectSuggestions.length > 0 ? subjectSuggestions : DEFAULT_SUBJECTS).map((s, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setCustomSubject(s)}
                        className={`text-xs px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                          customSubject === s
                            ? "border-cyan-400 bg-cyan-400/20 text-cyan-300"
                            : "border-border/50 text-muted-foreground hover:border-cyan-400/50 hover:text-cyan-300"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {customSubject && (
                <p className="text-xs text-muted-foreground">
                  A IA vai gerar a legenda e a arte com base neste assunto, ignorando o tema/projeto selecionado acima.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Legenda */}
          <Card className="card-blueprint">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold">Legenda</CardTitle>
                <Button variant="outline" size="sm" onClick={handleGenerateCaption} disabled={isGeneratingCaption} className="gap-1.5">
                  {isGeneratingCaption ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                  Gerar com IA
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input placeholder="Contexto adicional para a IA (opcional)" value={extraContext} onChange={e => setExtraContext(e.target.value)} className="text-sm" />
              <Textarea placeholder="Escreva ou gere a legenda do post..." value={caption} onChange={e => setCaption(e.target.value)} rows={8} className="font-mono text-sm resize-none" />
              <p className="label-mono text-right">{caption.length} caracteres</p>
            </CardContent>
          </Card>

          {/* Mídia / Carrossel */}
          <Card className="card-blueprint">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Images className="h-4 w-4" /> Mídia
                    {mediaUrls.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {mediaUrls.length}/10 {mediaUrls.length > 1 ? "— Carrossel" : "— Imagem única"}
                      </Badge>
                    )}
                  </CardTitle>
                  {mediaUrls.length > 1 && (
                    <p className="text-xs text-muted-foreground mt-0.5">Carrossel: {mediaUrls.length} imagens publicadas em sequência no Instagram</p>
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={handleGenerateArt} disabled={isGeneratingArt || mediaUrls.length >= 10} className="gap-1.5">
                  {isGeneratingArt ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                  Gerar Arte IA
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {mediaUrls.length > 0 ? (
                <div className="grid grid-cols-3 gap-3">
                  {mediaUrls.map((url, i) => (
                    <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border">
                      <img src={url} alt={`Slide ${i + 1}`} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                      <div className="absolute top-1 left-1 bg-black/60 text-white rounded text-xs px-1.5 py-0.5 font-mono">{i + 1}</div>
                      <button onClick={() => removeMedia(i)} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {mediaUrls.length < 10 && (
                    <button
                      onClick={handleGenerateArt}
                      disabled={isGeneratingArt}
                      className="aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
                    >
                      {isGeneratingArt ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
                      <span className="text-xs">Gerar slide</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground">
                  <Images className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm font-medium">Nenhuma imagem adicionada</p>
                  <p className="text-xs mt-1">Gere com IA ou cole uma URL abaixo. Até 10 imagens para carrossel.</p>
                </div>
              )}
              <AddMediaUrlField onAdd={(url) => setMediaUrls(prev => [...prev, url])} disabled={mediaUrls.length >= 10} />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar direita */}
        <div className="space-y-4">
          <Card className="card-blueprint">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">Agendamento</CardTitle>
            </CardHeader>
            <CardContent>
              <label className="label-mono mb-2 block">Data e Hora</label>
              <Input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} className="font-mono text-sm" />
              {scheduledAt && (
                <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {new Date(scheduledAt).toLocaleString("pt-BR")}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="card-blueprint">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border bg-white p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-400 to-pink-400" />
                  <span className="text-xs font-bold">{selectedAccount ? `@${selectedAccount.handle}` : "Selecione uma conta"}</span>
                </div>
                {mediaUrls.length > 0 ? (
                  <div className="relative aspect-square rounded overflow-hidden bg-muted">
                    <img src={mediaUrls[0]} alt="Preview" className="w-full h-full object-cover" />
                    {mediaUrls.length > 1 && (
                      <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded font-mono">
                        1/{mediaUrls.length}
                      </div>
                    )}
                  </div>
                ) : null}
                <p className="text-xs leading-relaxed whitespace-pre-wrap line-clamp-6">{caption || "Legenda do post..."}</p>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <Button onClick={() => handleSubmit(true)} className="w-full gap-2" disabled={createPost.isPending}>
              {createPost.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Enviar para Aprovação
            </Button>
            <Button variant="outline" onClick={() => handleSubmit(false)} className="w-full" disabled={createPost.isPending}>
              Salvar Rascunho
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
