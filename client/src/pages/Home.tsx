import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Instagram, FileText, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";

function AccountCard({ account, stats }: { account: any; stats: any }) {
  const [, setLocation] = useLocation();
  const isPersonal = account.tone === "personal";

  return (
    <Card className="card-blueprint overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isPersonal ? "bg-pink-pastel/30" : "bg-cyan-pastel/30"}`}>
            <Instagram className={`h-5 w-5 ${isPersonal ? "text-pink-500" : "text-cyan-600"}`} />
          </div>
          <div>
            <CardTitle className="text-lg font-extrabold tracking-tight">@{account.handle}</CardTitle>
            <p className="label-mono mt-0.5">{account.displayName}</p>
          </div>
          <Badge variant="outline" className={`ml-auto ${isPersonal ? "border-pink-300 text-pink-600" : "border-cyan-300 text-cyan-700"}`}>
            {isPersonal ? "Pessoal" : "Corporativo"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3">
          <button onClick={() => setLocation("/approval")} className="text-center p-3 rounded-lg bg-amber-50 hover:bg-amber-100 transition-colors">
            <div className="stat-value text-amber-600">{stats?.pending ?? 0}</div>
            <p className="label-mono mt-1">Pendentes</p>
          </button>
          <button onClick={() => setLocation("/calendar")} className="text-center p-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors">
            <div className="stat-value text-blue-600">{stats?.scheduled ?? 0}</div>
            <p className="label-mono mt-1">Agendados</p>
          </button>
          <button onClick={() => setLocation("/history")} className="text-center p-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 transition-colors">
            <div className="stat-value text-emerald-600">{stats?.published ?? 0}</div>
            <p className="label-mono mt-1">Publicados</p>
          </button>
        </div>
        <div className="flex gap-2 mt-3">
          <div className="flex-1 text-center p-2 rounded bg-muted/50">
            <span className="font-bold text-sm">{stats?.draft ?? 0}</span>
            <span className="label-mono ml-1">rascunhos</span>
          </div>
          <div className="flex-1 text-center p-2 rounded bg-muted/50">
            <span className="font-bold text-sm">{stats?.approved ?? 0}</span>
            <span className="label-mono ml-1">aprovados</span>
          </div>
          <div className="flex-1 text-center p-2 rounded bg-muted/50">
            <span className="font-bold text-sm">{stats?.rejected ?? 0}</span>
            <span className="label-mono ml-1">rejeitados</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Home() {
  const { data: accounts, isLoading: loadingAccounts } = trpc.accounts.list.useQuery();
  const aguiarStats = trpc.accounts.stats.useQuery({ accountId: 1 }, { enabled: !!accounts });
  const triacStats = trpc.accounts.stats.useQuery({ accountId: 2 }, { enabled: !!accounts });
  const { data: pendingPosts } = trpc.posts.list.useQuery({ status: "pending" });

  if (loadingAccounts) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const aguiar = accounts?.find(a => a.handle === "aguiaroriginal");
  const triarc = accounts?.find(a => a.handle === "triarcsolutions");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Dashboard</h1>
        <p className="label-mono mt-1">Titan Social Manager // Visão Geral</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {aguiar && <AccountCard account={aguiar} stats={aguiarStats.data} />}
        {triarc && <AccountCard account={triarc} stats={triacStats.data} />}
      </div>

      {pendingPosts && pendingPosts.length > 0 && (
        <Card className="card-blueprint border-amber-200">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              <CardTitle className="text-base font-bold">Aguardando Aprovação</CardTitle>
              <Badge variant="secondary" className="ml-auto bg-amber-100 text-amber-700">{pendingPosts.length}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingPosts.slice(0, 5).map(post => (
                <div key={post.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{post.caption?.substring(0, 80) ?? "Sem legenda"}</p>
                    <p className="label-mono">{post.theme ?? "Sem tema"}</p>
                  </div>
                  {post.scheduledAt && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {new Date(post.scheduledAt).toLocaleDateString("pt-BR")}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="card-blueprint">
          <CardContent className="pt-4 text-center">
            <div className="stat-value text-primary">{(aguiarStats.data?.published ?? 0) + (triacStats.data?.published ?? 0)}</div>
            <p className="label-mono mt-1">Total Publicados</p>
          </CardContent>
        </Card>
        <Card className="card-blueprint">
          <CardContent className="pt-4 text-center">
            <div className="stat-value text-amber-500">{(aguiarStats.data?.pending ?? 0) + (triacStats.data?.pending ?? 0)}</div>
            <p className="label-mono mt-1">Pendentes</p>
          </CardContent>
        </Card>
        <Card className="card-blueprint">
          <CardContent className="pt-4 text-center">
            <div className="stat-value text-blue-500">{(aguiarStats.data?.scheduled ?? 0) + (triacStats.data?.scheduled ?? 0)}</div>
            <p className="label-mono mt-1">Agendados</p>
          </CardContent>
        </Card>
        <Card className="card-blueprint">
          <CardContent className="pt-4 text-center">
            <div className="stat-value text-muted-foreground">{(aguiarStats.data?.draft ?? 0) + (triacStats.data?.draft ?? 0)}</div>
            <p className="label-mono mt-1">Rascunhos</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
