import { memo, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Loader2, CheckCircle, XCircle, Clock, Instagram,
  Send, Zap, Rocket, RefreshCw, AlertCircle,
} from "lucide-react";

const PostCard = memo(function PostCard({
  post,
  isApproved,
  account,
  onApprove,
  onReject,
  onPublishNow,
  isPendingApprove,
  isPendingReject,
  isPendingPublish,
}: {
  post: any;
  isApproved: boolean;
  account?: any;
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
  onPublishNow: (id: number, needsApprove: boolean) => void;
  isPendingApprove: boolean;
  isPendingReject: boolean;
  isPendingPublish: boolean;
}) {
  const isFuture = post.scheduledAt && new Date(post.scheduledAt) > new Date();
  const anyPending = isPendingApprove || isPendingReject || isPendingPublish;

  return (
    <Card className={`border transition-all ${isApproved ? "border-green-200 bg-green-50/30" : "border-border"}  hover:shadow-sm`}>
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
                <CheckCircle className="h-3 w-3" />Aprovado — na fila
              </Badge>
            ) : isFuture ? (
              <Badge variant="outline" className="gap-1 text-xs border-amber-300 text-amber-600">
                <Clock className="h-3 w-3" />
                {new Date(post.scheduledAt).toLocaleString("pt-BR")}
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1 text-xs border-cyan-300 text-cyan-600">
                <Send className="h-3 w-3" />Pendente
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {post.mediaUrl && (
          <div className="rounded-lg overflow-hidden bg-muted/20 border border-border">
            <img
              src={post.mediaUrl}
              alt={post.theme ?? "Post"}
              className="w-full h-48 object-cover"
              loading="lazy"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          </div>
        )}
        <div className="bg-muted/30 rounded-lg p-3 max-h-36 overflow-y-auto">
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{post.caption ?? "Sem legenda"}</p>
        </div>
        {post.caption && (
          <p className="text-xs text-muted-foreground text-right">{post.caption.length} caracteres</p>
        )}
        <div className="flex gap-2 justify-end">
          <Button
            variant="outline" size="sm"
            onClick={() => onReject(post.id)}
            disabled={anyPending}
            className="gap-1.5 text-destructive hover:text-destructive"
          >
            <XCircle className="h-3.5 w-3.5" />Rejeitar
          </Button>
          {!isFuture && (
            <Button
              size="sm"
              onClick={() => onPublishNow(post.id, !isApproved)}
              disabled={anyPending}
              className="gap-1.5 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-700 hover:to-cyan-600"
            >
              {isPendingPublish ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Rocket className="h-3.5 w-3.5" />}
              Publicar Agora
            </Button>
          )}
          {!isApproved && isFuture && (
            <Button
              size="sm" variant="outline"
              onClick={() => onApprove(post.id)}
              disabled={anyPending}
              className="gap-1.5"
            >
              {isPendingApprove ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
              Aprovar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

function SkeletonCard() {
  return (
    <Card className="border border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <Skeleton className="w-8 h-8 rounded-full" />
          <div className="space-y-1 flex-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-48 w-full rounded-lg" />
        <Skeleton className="h-20 w-full rounded-lg" />
        <div className="flex gap-2 justify-end">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-28" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function Approval() {
  const utils = trpc.useUtils();

  const { data: pendingPosts, isLoading: loadingPending } = trpc.posts.list.useQuery({ status: "pending" });
  const { data: approvedPosts, isLoading: loadingApproved } = trpc.posts.list.useQuery({ status: "approved" });
  const { data: accounts } = trpc.accounts.list.useQuery();

  const isLoading = loadingPending || loadingApproved;

  const invalidateAll = useCallback(() => {
    utils.posts.list.invalidate();
    utils.automation.getQueue.invalidate();
    utils.analytics.getSummary.invalidate();
  }, [utils]);

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
    onSuccess: (data) => {
      invalidateAll();
      if (data.published) {
        toast.success("✅ Post publicado!", { description: data.message });
      } else {
        toast.info("Post na fila", { description: data.message });
      }
    },
    onError: (err) => toast.error("Erro ao publicar", { description: err.message }),
  });

  const getAccount = useCallback(
    (accountId: number) => accounts?.find((a: any) => a.id === accountId),
    [accounts]
  );

  const handleApprove = useCallback((id: number) => approve.mutate({ id }), [approve]);
  const handleReject = useCallback((id: number) => reject.mutate({ id }), [reject]);
  const handlePublishNow = useCallback((postId: number, needsApprove: boolean) => {
    publishNow.mutate({ postId, approveFirst: needsApprove });
  }, [publishNow]);

  const pendingCount = pendingPosts?.length ?? 0;
  const approvedCount = approvedPosts?.length ?? 0;
  const totalCount = pendingCount + approvedCount;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Aprovação</h1>
          <p className="text-sm text-muted-foreground">
            {totalCount === 0 ? "Nenhum post aguardando" : `${pendingCount} pendentes · ${approvedCount} aprovados`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={invalidateAll} disabled={isLoading}>
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            <span className="ml-1.5">Atualizar</span>
          </Button>
          {pendingCount > 0 && (
            <Button size="sm" onClick={() => approveAll.mutate()}
              disabled={approveAll.isPending}
              className="gap-1.5 bg-green-600 hover:bg-green-700">
              {approveAll.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
              Aprovar Todos ({pendingCount})
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : totalCount === 0 ? (
        <Card className="border border-border">
          <CardContent className="p-12 text-center">
            <AlertCircle className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-40" />
            <p className="text-muted-foreground text-sm font-medium">Nenhum post aguardando aprovação</p>
            <p className="text-xs text-muted-foreground mt-1">Gere conteúdo na aba Automação para começar.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {approvedCount > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Aprovados — Prontos para Publicar</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {(approvedPosts ?? []).map((post: any) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    isApproved
                    account={getAccount(post.accountId)}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    onPublishNow={handlePublishNow}
                    isPendingApprove={approve.isPending && approve.variables?.id === post.id}
                    isPendingReject={reject.isPending && reject.variables?.id === post.id}
                    isPendingPublish={publishNow.isPending && publishNow.variables?.postId === post.id}
                  />
                ))}
              </div>
            </div>
          )}
          {pendingCount > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Pendentes — Aguardando Revisão</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {(pendingPosts ?? []).map((post: any) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    isApproved={false}
                    account={getAccount(post.accountId)}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    onPublishNow={handlePublishNow}
                    isPendingApprove={approve.isPending && approve.variables?.id === post.id}
                    isPendingReject={reject.isPending && reject.variables?.id === post.id}
                    isPendingPublish={publishNow.isPending && publishNow.variables?.postId === post.id}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
