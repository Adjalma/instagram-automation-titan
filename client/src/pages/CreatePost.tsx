import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Loader2, Sparkles, Send, Image, CalendarClock, AlertCircle, CheckCircle,
} from "lucide-react";

const CAPTION_LIMIT = 2200;

export default function CreatePost() {
  const [accountId, setAccountId] = useState("");
  const [theme, setTheme] = useState("");
  const [caption, setCaption] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: accounts } = trpc.accounts.list.useQuery();
  const { data: themes } = trpc.themes.list.useQuery();
  const utils = trpc.useUtils();

  const createPost = trpc.posts.create.useMutation({
    onSuccess: () => {
      toast.success("✅ Post criado com sucesso!", { description: "Acesse Aprovação para revisar." });
      setCaption("");
      setMediaUrl("");
      setScheduledAt("");
      setTheme("");
      utils.posts.list.invalidate();
      utils.analytics.getSummary.invalidate();
    },
    onError: (e) => toast.error("Erro ao criar post", { description: e.message }),
  });

  const generateCaption = trpc.ai.generateCaption.useMutation({
    onSuccess: (data) => {
      setCaption(data.caption);
      toast.success("Legenda gerada!");
    },
    onError: (e) => toast.error("Erro ao gerar legenda", { description: e.message }),
  });

  const generateImage = trpc.ai.generateArt.useMutation({
    onSuccess: (data) => {
      if (data.url) setMediaUrl(data.url);
      toast.success("Imagem gerada!");
    },
    onError: (e) => toast.error("Erro ao gerar imagem", { description: e.message }),
  });

  const handleGenerateCaption = useCallback(async () => {
    if (!accountId) { toast.error("Selecione uma conta"); return; }
    if (!theme) { toast.error("Selecione ou informe um tema"); return; }
    setIsGenerating(true);
    try {
      await generateCaption.mutateAsync({ accountId: Number(accountId), theme });
    } finally {
      setIsGenerating(false);
    }
  }, [accountId, theme, generateCaption]);

  const handleGenerateImage = useCallback(async () => {
    if (!accountId) { toast.error("Selecione uma conta"); return; }
    if (!theme) { toast.error("Informe o tema para gerar a imagem"); return; }
    await generateImage.mutateAsync({
      accountId: Number(accountId),
      theme,
      description: caption || undefined,
    });
  }, [accountId, theme, caption, generateImage]);

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
  const captionLength = caption.length;
  const captionOverLimit = captionLength > CAPTION_LIMIT;
  const captionWarning = captionLength > CAPTION_LIMIT * 0.9;

  // Data mínima: agora + 5 minutos
  const minDateTime = new Date(Date.now() + 5 * 60 * 1000)
    .toISOString()
    .slice(0, 16);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Criar Post</h1>
        <p className="text-sm text-muted-foreground mt-1">Crie um post manual ou use IA para gerar a legenda e a imagem</p>
      </div>

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
                {accounts?.map((a: any) => (
                  <SelectItem key={a.id} value={String(a.id)}>@{a.handle}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedAccount && (
              <p className="text-xs text-muted-foreground">{selectedAccount.displayName} · {selectedAccount.platform ?? "instagram"}</p>
            )}
          </div>

          {/* Tema */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tema</label>
            <div className="flex gap-2">
              <Select value={theme} onValueChange={setTheme}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Selecionar tema" />
                </SelectTrigger>
                <SelectContent>
                  {themes?.map((t: any) => (
                    <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Ou digitar tema customizado"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="flex-1 text-sm"
              />
            </div>
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
                disabled={generateImage.isPending || !theme || !accountId}
                className="gap-1.5 h-7 text-xs"
              >
                {generateImage.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Image className="h-3 w-3" />}
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
