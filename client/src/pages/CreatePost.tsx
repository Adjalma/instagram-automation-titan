import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { getAccountConnectionStatus } from "@/lib/accountStatus";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import QueryError from "@/components/QueryError";
import {
  Loader2, Sparkles, Send, Image, CalendarClock, AlertCircle, CheckCircle,
} from "lucide-react";

const CAPTION_LIMIT = 2200;

export default function CreatePost() {
  const [accountId, setAccountId] = useState("");
  const [selectedTheme, setSelectedTheme] = useState("");
  const [customTheme, setCustomTheme] = useState("");
  const [caption, setCaption] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const mountedRef = useRef(true);
  const cancelImagePollRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    cancelImagePollRef.current = false;
    return () => {
      mountedRef.current = false;
      cancelImagePollRef.current = true;
    };
  }, []);

  const theme = customTheme.trim() || selectedTheme;
  const { data: accounts } = trpc.accounts.list.useQuery();
  const { data: themes, isLoading: themesLoading, isError: themesError, error: themesErr, refetch: refetchThemes } = trpc.themes.list.useQuery();
  const { data: catalog } = trpc.triacContent.list.useQuery({ socialOnly: true });
  const utils = trpc.useUtils();

  const createPost = trpc.posts.create.useMutation({
    onSuccess: () => {
      if (!mountedRef.current) return;
      toast.success("✅ Post criado com sucesso!", { description: "Acesse Aprovação para revisar." });
      setCaption("");
      setMediaUrl("");
      setScheduledAt("");
      setSelectedTheme("");
      setCustomTheme("");
      utils.posts.list.invalidate();
      utils.analytics.getSummary.invalidate();
    },
    onError: (e) => {
      if (!mountedRef.current) return;
      toast.error("Erro ao criar post", { description: e.message });
    },
  });

  useEffect(() => {
    const busy = isGeneratingImage || isGenerating || createPost.isPending;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!busy) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isGeneratingImage, isGenerating, createPost.isPending]);

  const generateCaption = trpc.ai.generateCaption.useMutation({
    onSuccess: (data) => {
      if (!mountedRef.current) return;
      setCaption(data.caption);
      toast.success("Legenda gerada!");
    },
    onError: (e) => {
      if (!mountedRef.current) return;
      toast.error("Erro ao gerar legenda", { description: e.message });
    },
  });

  const generateArt = trpc.ai.generateArt.useMutation();


  const handleGenerateCaption = useCallback(async () => {
    if (!accountId) { toast.error("Selecione uma conta"); return; }
    if (!theme) { toast.error("Selecione ou informe um tema"); return; }
    setIsGenerating(true);
    try {
      await generateCaption.mutateAsync({ accountId: Number(accountId), theme });
    } catch {
      // toast via onError (silenciado se saiu da página)
    } finally {
      if (mountedRef.current) setIsGenerating(false);
    }
  }, [accountId, theme, generateCaption]);

  const handleGenerateImage = useCallback(async () => {
    if (!accountId) { toast.error("Selecione uma conta"); return; }
    if (!theme) { toast.error("Informe o tema para gerar a imagem"); return; }

    cancelImagePollRef.current = false;
    setIsGeneratingImage(true);
    const toastId = toast.loading("Gerando imagem com Gemini...", {
      description: "Pode levar até 2 min. Você pode sair — a geração continua no servidor.",
    });

    try {
      const { jobId } = await generateArt.mutateAsync({
        accountId: Number(accountId),
        theme,
        description: theme !== caption ? caption.slice(0, 200) || undefined : undefined,
      });

      for (let i = 0; i < 60; i++) {
        if (cancelImagePollRef.current || !mountedRef.current) {
          toast.dismiss(toastId);
          return;
        }

        await new Promise((r) => setTimeout(r, 3000));

        if (cancelImagePollRef.current || !mountedRef.current) {
          toast.dismiss(toastId);
          return;
        }

        const status = await utils.client.ai.generateArtStatus.query({ jobId });

        if (status.status === "done" && status.url) {
          if (mountedRef.current) {
            setMediaUrl(status.url);
            toast.success("Imagem gerada!", { id: toastId });
          } else {
            toast.dismiss(toastId);
          }
          return;
        }

        if (status.status === "failed") {
          throw new Error(status.error ?? "Falha na geração da imagem");
        }
      }

      throw new Error("Tempo esgotado aguardando a imagem. Tente Gerar Imagem novamente em 1 minuto.");
    } catch (e: unknown) {
      if (cancelImagePollRef.current || !mountedRef.current) {
        toast.dismiss(toastId);
        return;
      }
      const msg = e instanceof Error ? e.message : String(e);
      toast.error("Erro ao gerar imagem", { description: msg, id: toastId, duration: 10000 });
    } finally {
      if (mountedRef.current) setIsGeneratingImage(false);
    }
  }, [accountId, theme, caption, generateArt, utils.client.ai.generateArtStatus]);

  const handleSubmit = useCallback(() => {
    if (!accountId) { toast.error("Selecione uma conta"); return; }
    if (!caption.trim()) { toast.error("A legenda não pode ser vazia"); return; }
    if (caption.length > CAPTION_LIMIT) { toast.error(`Legenda excede ${CAPTION_LIMIT} caracteres`); return; }
    if (scheduledAt) {
      const scheduled = new Date(scheduledAt);
      if (isNaN(scheduled.getTime())) { toast.error("Data inválida"); return; }
      if (scheduled <= new Date()) { toast.error("A data de agendamento deve ser no futuro"); return; }
    }
    createPost.mutate({
      accountId: Number(accountId),
      theme: theme || undefined,
      caption: caption.trim(),
      mediaUrls: mediaUrl ? [mediaUrl] : undefined,
      scheduledAt: scheduledAt || undefined,
    });
  }, [accountId, caption, theme, mediaUrl, scheduledAt, createPost]);

  const selectedAccount = accounts?.find((a: any) => String(a.id) === accountId);
  const selectedAccountStatus = selectedAccount ? getAccountConnectionStatus(selectedAccount) : null;

  const accountsSummary = useMemo(() => {
    if (!accounts?.length) return { total: 0, connected: 0 };
    const connected = accounts.filter((a: any) => getAccountConnectionStatus(a).connected).length;
    return { total: accounts.length, connected };
  }, [accounts]);

  const captionLength = caption.length;
  const captionOverLimit = captionLength > CAPTION_LIMIT;
  const captionWarning = captionLength > CAPTION_LIMIT * 0.9;

  const minDateTime = new Date(Date.now() + 5 * 60 * 1000)
    .toISOString()
    .slice(0, 16);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Criar Post</h1>
        <p className="text-sm text-muted-foreground mt-1">Crie um post manual ou use IA para gerar a legenda e a imagem</p>
      </div>

      {/* Status das contas */}
      {accounts && accounts.length > 0 && (
        <Card className="border-dashed">
          <CardContent className="py-3 px-4 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-muted-foreground">Contas OAuth:</span>
            {accounts.map((a: any) => {
              const st = getAccountConnectionStatus(a);
              return (
                <Badge
                  key={a.id}
                  variant="outline"
                  className={
                    st.level === "full" ? "border-green-500 text-green-700" :
                    st.level === "partial" ? "border-amber-500 text-amber-700" :
                    "border-gray-300 text-muted-foreground"
                  }
                >
                  @{a.handle} — {st.label}
                </Badge>
              );
            })}
            {accountsSummary.connected < accountsSummary.total && (
              <span className="text-amber-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {accountsSummary.total - accountsSummary.connected} sem token — conecte em Contas
              </span>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Configurações do Post</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Conta */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Conta *</label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger className={!accountId ? "border-amber-400" : ""}>
                <SelectValue placeholder="Selecionar conta" />
              </SelectTrigger>
              <SelectContent>
                {accounts?.map((a: any) => {
                  const st = getAccountConnectionStatus(a);
                  return (
                    <SelectItem key={a.id} value={String(a.id)}>
                      @{a.handle} {st.connected ? `(${st.label})` : "(desconectado)"}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {selectedAccount && (
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-xs text-muted-foreground">{selectedAccount.displayName} · {selectedAccount.platform ?? "instagram"}</p>
                {selectedAccountStatus?.connected ? (
                  <Badge variant="outline" className="text-[10px] border-green-500 text-green-700">
                    <CheckCircle className="h-3 w-3 mr-1" />{selectedAccountStatus.label}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] border-amber-500 text-amber-700">
                    <AlertCircle className="h-3 w-3 mr-1" />Conecte em Contas antes de publicar
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Tema */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pilar editorial</label>
            {themesLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Carregando temas...
              </div>
            ) : themesError ? (
              <QueryError message={themesErr?.message} onRetry={() => refetchThemes()} />
            ) : (
              <>
                <div className="flex flex-wrap gap-2">
                  {themes?.map((t: any) => (
                    <Button
                      key={t.id}
                      type="button"
                      variant={selectedTheme === t.name && !customTheme ? "default" : "outline"}
                      size="sm"
                      className="text-xs"
                      onClick={() => {
                        setSelectedTheme(t.name);
                        setCustomTheme("");
                      }}
                    >
                      {t.name}
                    </Button>
                  ))}
                </div>
                {(!themes || themes.length === 0) && (
                  <p className="text-xs text-amber-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Nenhum pilar no banco — acesse Cronograma após o deploy.
                  </p>
                )}
              </>
            )}
          </div>

          {/* App / serviço Triarc */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              App ou serviço Triarc (opcional)
            </label>
            <p className="text-xs text-muted-foreground">
              Sobre qual produto falar. Apps excluídos do Instagram corporativo não aparecem aqui.
            </p>
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
              {catalog?.map((item: any) => (
                <Button
                  key={item.id}
                  type="button"
                  variant={customTheme === item.name ? "default" : "outline"}
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    setCustomTheme(item.name);
                    setSelectedTheme("");
                  }}
                >
                  {item.name}
                </Button>
              ))}
            </div>
            <Input
              placeholder="Ou digite manualmente (app, serviço ou pilar)"
              value={customTheme}
              onChange={(e) => {
                setCustomTheme(e.target.value);
                if (e.target.value) setSelectedTheme("");
              }}
              className="text-sm"
            />
            {theme && (
              <p className="text-xs text-muted-foreground">Tema do post: <strong>{theme}</strong></p>
            )}
          </div>

          {/* Legenda */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Legenda *</label>
              <div className="flex items-center gap-2">
                <span className={`text-xs tabular-nums ${
                  captionOverLimit ? "text-red-500 font-semibold" :
                  captionWarning ? "text-amber-500" :
                  "text-muted-foreground"
                }`}>
                  {captionLength}/{CAPTION_LIMIT}
                </span>
                <Button
                  variant="outline" size="sm"
                  onClick={handleGenerateCaption}
                  disabled={isGenerating || !accountId || !theme}
                  className="gap-1.5 h-7 text-xs"
                >
                  {isGenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                  Gerar com IA
                </Button>
              </div>
            </div>
            <Textarea
              placeholder="Digite a legenda do post ou gere com IA..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={6}
              className={`resize-none font-mono text-sm ${
                captionOverLimit ? "border-red-500 focus-visible:ring-red-500" : ""
              }`}
            />
            {captionOverLimit && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Legenda excede o limite do Instagram ({CAPTION_LIMIT} caracteres)
              </p>
            )}
          </div>

          {/* Imagem */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">URL da Imagem</label>
              <Button
                variant="outline" size="sm"
                onClick={handleGenerateImage}
                disabled={isGeneratingImage || !theme || !accountId}
                className="gap-1.5 h-7 text-xs"
              >
                {isGeneratingImage ? <Loader2 className="h-3 w-3 animate-spin" /> : <Image className="h-3 w-3" />}
                Gerar Imagem
              </Button>
            </div>
            <Input
              placeholder="https://... (opcional, gerado automaticamente)"
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              className="text-sm"
            />
            {mediaUrl && (
              <div className="rounded-lg overflow-hidden border border-border">
                <img
                  src={mediaUrl}
                  alt="Preview"
                  className="w-full h-40 object-cover"
                  loading="lazy"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              </div>
            )}
          </div>

          {/* Agendamento */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <CalendarClock className="h-3.5 w-3.5 inline mr-1" />
              Agendar Para (opcional)
            </label>
            <Input
              type="datetime-local"
              value={scheduledAt}
              min={minDateTime}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="font-mono text-sm"
            />
            {scheduledAt && (
              <p className="text-xs text-muted-foreground">
                Será publicado em {new Date(scheduledAt).toLocaleString("pt-BR")}
              </p>
            )}
          </div>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={createPost.isPending || !accountId || !caption.trim() || captionOverLimit}
            className="w-full gap-2" size="lg"
          >
            {createPost.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : scheduledAt ? (
              <CalendarClock className="h-5 w-5" />
            ) : (
              <Send className="h-5 w-5" />
            )}
            {createPost.isPending ? "Criando..." : scheduledAt ? "Agendar Post" : "Criar Post"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
