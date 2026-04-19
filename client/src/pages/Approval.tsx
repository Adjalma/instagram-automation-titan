import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, CheckCircle, XCircle, Clock, Instagram } from "lucide-react";

export default function Approval() {
  const utils = trpc.useUtils();
  const { data: pendingPosts, isLoading } = trpc.posts.list.useQuery({ status: "pending" });
  const { data: accounts } = trpc.accounts.list.useQuery();
  const approve = trpc.posts.approve.useMutation({
    onSuccess: () => { utils.posts.list.invalidate(); toast.success("Post aprovado!"); },
    onError: () => toast.error("Erro ao aprovar"),
  });
  const reject = trpc.posts.reject.useMutation({
    onSuccess: () => { utils.posts.list.invalidate(); toast.success("Post rejeitado"); },
    onError: () => toast.error("Erro ao rejeitar"),
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
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Aprovação</h1>
        <p className="label-mono mt-1">Fluxo de revisão // {pendingPosts?.length ?? 0} pendente(s)</p>
      </div>

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
                    {post.scheduledAt && (
                      <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {new Date(post.scheduledAt).toLocaleString("pt-BR")}
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="bg-muted/30 rounded-lg p-4">
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{post.caption ?? "Sem legenda"}</p>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" size="sm" onClick={() => reject.mutate({ id: post.id })} disabled={reject.isPending} className="gap-1.5 text-destructive hover:text-destructive">
                      <XCircle className="h-3.5 w-3.5" />
                      Rejeitar
                    </Button>
                    <Button size="sm" onClick={() => approve.mutate({ id: post.id })} disabled={approve.isPending} className="gap-1.5">
                      {approve.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
                      Aprovar
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
