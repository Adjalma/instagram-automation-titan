import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, XCircle, Clock, ExternalLink, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PublicationLogs() {
  const { data: logs, isLoading, refetch } = trpc.automation.getLogs.useQuery();

  const statusIcon = (status: string) => {
    if (status === "success") return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    if (status === "failed") return <XCircle className="h-4 w-4 text-red-500" />;
    return <Clock className="h-4 w-4 text-amber-500" />;
  };

  const statusBadge = (status: string) => {
    if (status === "success") return "bg-emerald-100 text-emerald-700 border-emerald-300";
    if (status === "failed") return "bg-red-100 text-red-700 border-red-300";
    return "bg-amber-100 text-amber-700 border-amber-300";
  };

  const statusLabel = (status: string) => {
    if (status === "success") return "Publicado";
    if (status === "failed") return "Falhou";
    return "Pendente";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Logs de Publicação</h1>
          <p className="label-mono mt-1">Histórico de tentativas de publicação no Instagram</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Atualizar
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : !logs || logs.length === 0 ? (
        <Card className="card-blueprint">
          <CardContent className="py-16 text-center">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">Nenhum log de publicação ainda.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Os logs aparecerão aqui após o agente autônomo tentar publicar posts aprovados.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="card-blueprint">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold">
              {logs.length} registro{logs.length !== 1 ? "s" : ""}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {logs.map((log: any) => (
                <div key={log.id} className="flex items-start gap-4 px-6 py-4 hover:bg-muted/30 transition-colors">
                  <div className="mt-0.5 shrink-0">{statusIcon(log.status)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm font-semibold">Post #{log.postId}</span>
                      <Badge className={`text-xs border ${statusBadge(log.status)}`}>
                        {statusLabel(log.status)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Tentativa {log.attempt}
                      </span>
                    </div>
                    {log.instagramPostId && (
                      <p className="text-xs text-muted-foreground mt-1 font-mono">
                        ID: {log.instagramPostId}
                      </p>
                    )}
                    {log.permalink && (
                      <a
                        href={log.permalink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-cyan-600 hover:text-cyan-700 mt-1"
                      >
                        Ver no Instagram <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    {log.error && (
                      <p className="text-xs text-red-600 mt-1 bg-red-50 rounded px-2 py-1 font-mono">
                        {log.error}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 text-xs text-muted-foreground font-mono">
                    {new Date(log.createdAt).toLocaleString("pt-BR")}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
