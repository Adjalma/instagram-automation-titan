import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Loader2, CheckCircle, XCircle, Clock, Instagram,
  Send, Zap, CalendarCheck, Rocket, RefreshCw,
} from "lucide-react";

export default function Approval() {
  const utils = trpc.useUtils();

  // Busca PENDING e APPROVED juntos
  const { data: pendingPosts, isLoading: loadingPending } = trpc.posts.list.useQuery({ status: "pending" });
  const { data: approvedPosts, isLoading: loadingApproved } = trpc.posts.list.useQuery({ status: "approved" });
  const { data: accounts } = trpc.accounts.list.useQuery();

  const isLoading = loadingPending || loadingApproved;

  function invalidateAll() {
    utils.posts.list.invalidate();
    utils.automation.getQueue.invalidate();
    utils.analytics.getSummary.invalidate();
  }

  const approve = trpc.posts.approve.useMutation({
    onSuccess: (data) => {
      invalidateAll();
      if (data.status === "scheduled") {
        toast.success("📅 Post agendado!", { description: "Será publicado no horário configurado." });
      } else {
        toast.success("✅ Post aprovado!", { description: "Clique em 'Publicar Agora' para publicar imediatamente." });
      }
    },
    onError: (err) => toast.error("Erro ao aprovar", { description: err.message }),
  });

  const reject = trpc.posts.reject.useMutation({
    onSuccess: () => { invalidateAll(); toast.success("Post rejeitado"); },
    onError: () => toast.error("Erro ao rejeitar"),
  });

  const approveAll = trpc.automation.approveAll.useMutation({
    onSuccess: (data) => {
      invalidateAll();
      toast.success(`${data.approved} posts aprovados, ${data.scheduled} agendados.`);
    },
    onError: (err) => toast.error("Erro", { description: err.message }),
  });

  const publishNow = trpc.automation.publishNow.useMutation({
    onSuccess: (_data, variables) => {
      invalidateAll();
      // Publica imediatamente via MCP
      const post = [...(approvedPosts ?? []), ...(pendingPosts ?? [])].find((p: any) => p.id === variables.postId);
      if (post) {
        toast.info("🚀 Publicando no Instagram...", {
          description: "Aguarde a confirmação no card do Manus.",
        });
      }
    },
    onError: (err) => toast.error("Erro ao publicar", { description: err.message }),
  });

  const getAccount = (accountId: number) => accounts?.find((a: any) => a.id === accountId);

  const pendingCount = pendingPosts?.length ?? 0;
  const approvedCount = approvedPosts?.length ?? 0;
  const totalCount = pendingCount + approvedCount;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  function PostCard({ post, isApproved }: { post: any; isApproved: boolean }) {
    const account = getAccount(post.accountId);
    const isFuture = post.scheduledAt && new Date(post.scheduledAt) > new Date();

    return (
      <Card className={`border ${isApproved ? "border-green-200 bg-green-50/30" : "border-border"}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-cyan-100">
              <Instagram className="h-4 w-4 text-cyan-600" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold">@{account?.handle ?? "?"}</CardTitle>
              <p className="text-xs text-muted-foreground">{post.theme ?? "Sem tema"}</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              {isApproved ? (
                <Badge className="gap-1 text-xs bg-green-100 text-green-700 border-green-300 hover:bg-green-100">
                  <CheckCircle className="h-3 w-3" />
                  Aprovado — na fila
                </Badge>
              ) : isFuture ? (
                <Badge variant="outline" className="gap-1 text-xs border-amber-300 text-amber-600">
                  <Clock className="h-3 w-3" />
                  {new Date(post.scheduledAt).toLocaleString("pt-BR")}
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1 text-xs border-cyan-300 text-cyan-600">
                  <Send className="h-3 w-3" />
                  Pendente
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Thumbnail da imagem gerada */}
          {post.mediaUrl && (
            <div className="rounded-lg overflow-hidden bg-muted/20 border border-border">
              <img
                src={post.mediaUrl}
                alt={post.theme ?? "Post"}
                className="w-full h-48 object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
          )}
          <div className="bg-muted/30 rounded-lg p-3 max-h-36 overflow-y-auto">
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{post.caption ?? "Sem legenda"}</p>
          </div>
          <div className="flex gap-2 justify-end">
            {/* Rejeitar sempre disponível */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => reject.mutate({ id: post.id })}
              disabled={reject.isPending || approve.isPending || publishNow.isPending}
              className="gap-1.5 text-destructive hover:text-destructive"
            >
              <XCircle className="h-3.5 w-3.5" />
              Rejeitar
            </Button>

            {/* Publicar Agora — disponível para approved e pending sem data futura */}
            {!isFuture && (
              <Button
                size="sm"
                onClick={() => {
                  if (isApproved) {
                    // Já aprovado: publica direto
                    publishNow.mutate({ postId: post.id });
                  } else {
                    // Pendente: aprova e depois publica
                    approve.mutate({ id: post.id }, {
                      onSuccess: () => {
                        publishNow.mutate({ postId: post.id });
                      }
                    });
                  }
                }}
                disabled={publishNow.isPending || approve.isPending || reject.isPending}
                className="gap-1.5 bg-violet-600 hover:bg-violet-700 text-white"
              >
                {publishNow.isPending || approve.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Rocket className="h-3.5 w-3.5" />
                )}
                Publicar Agora
              </Button>
            )}

            {/* Aprovar (sem publicar) — só para pending */}
            {!isApproved && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => approve.mutate({ id: post.id })}
                disabled={approve.isPending || reject.isPending || publishNow.isPending}
                className="gap-1.5"
              >
                {approve.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : isFuture ? (
                  <CalendarCheck className="h-3.5 w-3.5" />
                ) : (
                  <CheckCircle className="h-3.5 w-3.5" />
                )}
                {isFuture ? "Aprovar e Agendar" : "Só Aprovar"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Aprovação</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {pendingCount} pendente(s) · {approvedCount} aprovado(s) aguardando publicação
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => invalidateAll()}
            className="gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Atualizar
          </Button>
          {pendingCount > 0 && (
            <Button
              size="sm"
              onClick={() => approveAll.mutate()}
              disabled={approveAll.isPending}
              className="gap-1.5"
            >
              {approveAll.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
              Aprovar Todos ({pendingCount})
            </Button>
          )}
        </div>
      </div>

      {totalCount === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle className="h-12 w-12 mx-auto mb-3 text-emerald-400 opacity-50" />
            <p className="text-lg font-semibold text-muted-foreground">Nenhum post pendente</p>
            <p className="text-sm text-muted-foreground mt-1">Todos os posts foram revisados</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Posts pendentes primeiro */}
          {pendingPosts && pendingPosts.length > 0 && (
            <>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Aguardando aprovação ({pendingCount})
              </p>
              {pendingPosts.map((post: any) => (
                <PostCard key={post.id} post={post} isApproved={false} />
              ))}
            </>
          )}

          {/* Posts aprovados aguardando publicação */}
          {approvedPosts && approvedPosts.length > 0 && (
            <>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mt-4">
                Aprovados — aguardando publicação ({approvedCount})
              </p>
              {approvedPosts.map((post: any) => (
                <PostCard key={post.id} post={post} isApproved={true} />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
