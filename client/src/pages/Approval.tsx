import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, CheckCircle, XCircle, Clock, Instagram, Send, Zap, CalendarCheck, Radio } from "lucide-react";

export default function Approval() {
  const utils = trpc.useUtils();
  const { data: pendingPosts, isLoading } = trpc.posts.list.useQuery({ status: "pending" });
  const { data: accounts } = trpc.accounts.list.useQuery();

  const approve = trpc.posts.approve.useMutation({
    onSuccess: (data) => {
      utils.posts.list.invalidate();
      utils.automation.getQueue.invalidate();
      if (data.status === "published") {
        toast.success("✅ Post publicado no Instagram!", {
          description: data.instagramPostId ? `ID: ${data.instagramPostId}` : "Publicado com sucesso.",
        });
      } else if (data.status === "scheduled") {
        toast.success("📅 Post agendado!", {
          description: "Será publicado automaticamente no horário configurado.",
        });
      } else if (data.status === "approved") {
        toast.info("📤 Enviado ao Instagram", {
          description: (data as any).publishError
            ? `Nota: ${(data as any).publishError}. Será publicado em breve.`
            : "Aguardando confirmação no card do Manus para publicar.",
        });
      }
    },
    onError: (err) => toast.error("Erro ao aprovar", { description: err.message }),
  });

  const reject = trpc.posts.reject.useMutation({
    onSuccess: () => {
      utils.posts.list.invalidate();
      toast.success("Post rejeitado");
    },
    onError: () => toast.error("Erro ao rejeitar"),
  });

  const approveAll = trpc.automation.approveAll.useMutation({
    onSuccess: (data) => {
      utils.posts.list.invalidate();
      utils.automation.getQueue.invalidate();
      toast.success(`Processamento concluído!`, {
        description: `${data.published} publicados, ${data.scheduled} agendados, ${data.approved} aguardando.`,
      });
    },
    onError: (err) => toast.error("Erro ao aprovar todos", { description: err.message }),
  });

  const processScheduled = trpc.automation.processScheduled.useMutation({
    onSuccess: (data) => {
      utils.posts.list.invalidate();
      toast.success(`Posts agendados processados`, {
        description: `${data.published} publicados de ${data.processed} verificados.`,
      });
    },
    onError: (err) => toast.error("Erro ao processar agendados", { description: err.message }),
  });

  const getAccount = (accountId: number) => accounts?.find(a => a.id === accountId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Aprovação</h1>
          <p className="label-mono mt-1">Fluxo de revisão // {pendingPosts?.length ?? 0} pendente(s)</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => processScheduled.mutate()}
            disabled={processScheduled.isPending}
            className="gap-1.5"
          >
            {processScheduled.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CalendarCheck className="h-3.5 w-3.5" />}
            Processar Agendados
          </Button>
          {pendingPosts && pendingPosts.length > 0 && (
            <Button
              size="sm"
              onClick={() => approveAll.mutate()}
              disabled={approveAll.isPending}
              className="gap-1.5"
            >
              {approveAll.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
              Aprovar e Publicar Todos ({pendingPosts.length})
            </Button>
          )}
        </div>
      </div>

      {/* Info banner about how publishing works */}
      <Card className="card-blueprint border-cyan-pastel/40 bg-cyan-pastel/5">
        <CardContent className="py-3 px-4">
          <div className="flex items-start gap-3">
            <Send className="h-4 w-4 text-cyan-600 mt-0.5 shrink-0" />
            <div className="text-sm">
              <span className="font-semibold">Como funciona a publicação:</span>
              <span className="text-muted-foreground ml-1">Ao aprovar um post, ele entra na fila de publicação. O agente Manus verifica a fila a cada 10 minutos, publica no Instagram via MCP e atualiza o status automaticamente. Posts com data futura aguardam o horário configurado. Você verá um card de confirmação no chat do Manus quando cada post for publicado.</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* MCP Pending explanation banner */}
      <Card className="card-blueprint border-violet-200 bg-violet-50/50">
        <CardContent className="py-3 px-4">
          <div className="flex items-start gap-3">
            <Radio className="h-4 w-4 text-violet-600 mt-0.5 shrink-0" />
            <div className="text-sm">
              <span className="font-semibold text-violet-700">Fluxo automático:</span>
              <span className="text-muted-foreground ml-1">Após aprovar, o post fica com status <strong>"Aprovado"</strong>. O agente Manus roda a cada 10 minutos, detecta posts aprovados, publica no Instagram e marca como <strong>"Publicado"</strong> automaticamente. Não é necessário nenhuma ação adicional.</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {!pendingPosts || pendingPosts.length === 0 ? (
        <Card className="card-blueprint">
          <CardContent className="py-12 text-center">
            <CheckCircle className="h-12 w-12 mx-auto mb-3 text-emerald-400 opacity-50" />
            <p className="text-lg font-semibold text-muted-foreground">Nenhum post pendente</p>
            <p className="label-mono mt-1">Todos os posts foram revisados</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {pendingPosts.map(post => {
            const account = getAccount(post.accountId);
            const isPersonal = account?.tone === "personal";
            const isScheduled = !!post.scheduledAt;
            const isFuture = isScheduled && new Date(post.scheduledAt!) > new Date();

            return (
              <Card key={post.id} className="card-blueprint">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isPersonal ? "bg-pink-pastel/30" : "bg-cyan-pastel/30"}`}>
                      <Instagram className={`h-4 w-4 ${isPersonal ? "text-pink-500" : "text-cyan-600"}`} />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-bold">@{account?.handle ?? "?"}</CardTitle>
                      <p className="label-mono">{post.theme ?? "Sem tema"}</p>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                      {isFuture ? (
                        <Badge variant="outline" className="gap-1 text-xs border-amber-300 text-amber-600">
                          <Clock className="h-3 w-3" />
                          Agendado: {new Date(post.scheduledAt!).toLocaleString("pt-BR")}
                        </Badge>
                      ) : isScheduled ? (
                        <Badge variant="outline" className="gap-1 text-xs border-emerald-300 text-emerald-600">
                          <Send className="h-3 w-3" />
                          Publicar agora
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1 text-xs border-cyan-300 text-cyan-600">
                          <Send className="h-3 w-3" />
                          Publicar imediatamente
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="bg-muted/30 rounded-lg p-4 max-h-40 overflow-y-auto">
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{post.caption ?? "Sem legenda"}</p>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => reject.mutate({ id: post.id })}
                      disabled={reject.isPending || approve.isPending}
                      className="gap-1.5 text-destructive hover:text-destructive"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Rejeitar
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => approve.mutate({ id: post.id })}
                      disabled={approve.isPending || reject.isPending}
                      className="gap-1.5"
                    >
                      {approve.isPending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : isFuture ? (
                        <CalendarCheck className="h-3.5 w-3.5" />
                      ) : (
                        <Send className="h-3.5 w-3.5" />
                      )}
                      {isFuture ? "Aprovar e Agendar" : "Aprovar e Publicar"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
