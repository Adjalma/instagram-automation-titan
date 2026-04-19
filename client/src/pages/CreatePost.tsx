import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Sparkles, ImagePlus, Send, Calendar, X } from "lucide-react";
import { useLocation } from "wouter";

export default function CreatePost() {
  const [, setLocation] = useLocation();
  const { data: accounts } = trpc.accounts.list.useQuery();
  const { data: themes } = trpc.themes.list.useQuery();
  const [accountId, setAccountId] = useState<string>("");
  const [theme, setTheme] = useState<string>("");
  const [caption, setCaption] = useState("");
  const [extraContext, setExtraContext] = useState("");
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [scheduledAt, setScheduledAt] = useState("");
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);
  const [isGeneratingArt, setIsGeneratingArt] = useState(false);

  const generateCaption = trpc.ai.generateCaption.useMutation();
  const generateArt = trpc.ai.generateArt.useMutation();
  const createPost = trpc.posts.create.useMutation();
  const submitForApproval = trpc.posts.submitForApproval.useMutation();

  const selectedAccount = useMemo(() => accounts?.find(a => a.id === Number(accountId)), [accounts, accountId]);

  const handleGenerateCaption = async () => {
    if (!accountId || !theme) {
      toast.error("Selecione a conta e o tema primeiro");
      return;
    }
    setIsGeneratingCaption(true);
    try {
      const result = await generateCaption.mutateAsync({
        accountId: Number(accountId),
        theme,
        extraContext: extraContext || undefined,
      });
      setCaption(typeof result.caption === 'string' ? result.caption : '');
      toast.success("Legenda gerada com sucesso!");
    } catch (e) {
      toast.error("Erro ao gerar legenda");
    } finally {
      setIsGeneratingCaption(false);
    }
  };

  const handleGenerateArt = async () => {
    if (!accountId || !theme) {
      toast.error("Selecione a conta e o tema primeiro");
      return;
    }
    setIsGeneratingArt(true);
    try {
      const result = await generateArt.mutateAsync({
        accountId: Number(accountId),
        theme,
        description: extraContext || undefined,
      });
      if (result.url) setMediaUrls(prev => [...prev, result.url as string]);
      toast.success("Arte gerada com sucesso!");
    } catch (e) {
      toast.error("Erro ao gerar arte");
    } finally {
      setIsGeneratingArt(false);
    }
  };

  const handleSubmit = async (submitApproval: boolean) => {
    if (!accountId) {
      toast.error("Selecione uma conta");
      return;
    }
    try {
      const result = await createPost.mutateAsync({
        accountId: Number(accountId),
        caption,
        theme: theme || undefined,
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
    } catch (e) {
      toast.error("Erro ao criar post");
    }
  };

  const removeMedia = (index: number) => {
    setMediaUrls(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Criar Post</h1>
        <p className="label-mono mt-1">Editor de conteúdo // Geração com IA</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card className="card-blueprint">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">Configuração</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-mono mb-2 block">Conta Destino</label>
                  <Select value={accountId} onValueChange={setAccountId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar conta" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts?.map(a => (
                        <SelectItem key={a.id} value={String(a.id)}>
                          @{a.handle}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="label-mono mb-2 block">Tema</label>
                  <Select value={theme} onValueChange={setTheme}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar tema" />
                    </SelectTrigger>
                    <SelectContent>
                      {themes?.map(t => (
                        <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {selectedAccount && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={selectedAccount.tone === "personal" ? "border-pink-300 text-pink-600" : "border-cyan-300 text-cyan-700"}>
                    Tom: {selectedAccount.tone === "personal" ? "Pessoal" : "Corporativo"}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

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
              <Input
                placeholder="Contexto adicional para a IA (opcional)"
                value={extraContext}
                onChange={e => setExtraContext(e.target.value)}
                className="text-sm"
              />
              <Textarea
                placeholder="Escreva ou gere a legenda do post..."
                value={caption}
                onChange={e => setCaption(e.target.value)}
                rows={8}
                className="font-mono text-sm resize-none"
              />
              <p className="label-mono text-right">{caption.length} caracteres</p>
            </CardContent>
          </Card>

          <Card className="card-blueprint">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold">Mídia</CardTitle>
                <Button variant="outline" size="sm" onClick={handleGenerateArt} disabled={isGeneratingArt} className="gap-1.5">
                  {isGeneratingArt ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />}
                  Gerar Arte com IA
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {mediaUrls.length > 0 ? (
                <div className="grid grid-cols-3 gap-3">
                  {mediaUrls.map((url, i) => (
                    <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border">
                      <img src={url} alt={`Media ${i + 1}`} className="w-full h-full object-cover" />
                      <button onClick={() => removeMedia(i)} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="h-3 w-3" />
                      </button>
                      <span className="absolute bottom-1 left-1 label-mono bg-black/60 text-white px-1.5 py-0.5 rounded text-[10px]">{i + 1}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground">
                  <ImagePlus className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Gere artes com IA ou adicione URLs de imagens</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="card-blueprint">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">Agendamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <label className="label-mono mb-2 block">Data e Hora</label>
                <Input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={e => setScheduledAt(e.target.value)}
                  className="font-mono text-sm"
                />
              </div>
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
                {mediaUrls[0] && (
                  <div className="aspect-square rounded overflow-hidden bg-muted">
                    <img src={mediaUrls[0]} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
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
