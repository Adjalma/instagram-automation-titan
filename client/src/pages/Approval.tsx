import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Loader2, CheckCircle, XCircle, Clock, Instagram,
  Send, Zap, CalendarCheck, Rocket, RefreshCw, Linkedin, Facebook, Music, Globe,
} from "lucide-react";

const PLATFORM_ICONS: Record<string, any> = {
  instagram: Instagram, linkedin: Linkedin, facebook: Facebook, tiktok: Music,
};
const PLATFORM_NEON: Record<string, string> = {
  instagram: "oklch(0.75 0.22 340)", linkedin: "oklch(0.65 0.18 240)",
  facebook: "oklch(0.65 0.18 255)", tiktok: "oklch(0.82 0.18 195)",
};

export default function Approval() {
  const utils = trpc.useUtils();
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
        const results = (data as any).publishResults as Record<string, string> | undefined;
        if (results) {
          const lines = Object.entries(results).map(([k, v]) => `${k}: ${v}`).join(" | ");
          toast.success("✅ Post publicado!", { description: lines });
        } else {
          toast.success("✅ Post aprovado e publicado!");
        }
      }
    },
    onError: (err) => toast.error("Erro ao aprovar", { description: err.message }),
  });

  const reject = trpc.posts.reject.useMutation({
    onSuccess: () => { invalidateAll(); toast.success("Post rejeitado"); },
    onError: () => toast.error("Erro ao rejeitar"),
  });

  const approveAll = trpc.automation.approveAll.useMutation({
    onSuccess: (data) => { invalidateAll(); toast.success(`${data.approved} posts aprovados, ${data.scheduled} agendados.`); },
    onError: (err) => toast.error("Erro", { description: err.message }),
  });

  const publishNow = trpc.automation.publishNow.useMutation({
    onSuccess: () => { invalidateAll(); toast.info("🚀 Publicando..."); },
    onError: (err) => toast.error("Erro ao publicar", { description: err.message }),
  });

  const getAccount = (accountId: number) => accounts?.find((a: any) => a.id === accountId);
  const pendingCount = pendingPosts?.length ?? 0;
  const approvedCount = approvedPosts?.length ?? 0;
  const totalCount = pendingCount + approvedCount;

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-8 w-8 animate-spin" style={{ color: "oklch(0.82 0.18 195)" }} />
    </div>
  );

  function PostCard({ post, isApproved }: { post: any; isApproved: boolean }) {
    const account = getAccount(post.accountId);
    const platform = account?.platform ?? "instagram";
    const Icon = PLATFORM_ICONS[platform] ?? Globe;
    const neon = PLATFORM_NEON[platform] ?? "oklch(0.82 0.18 195)";
    const isFuture = post.scheduledAt && new Date(post.scheduledAt) > new Date();

    const borderNeon = isApproved ? "oklch(0.80 0.18 145)" : neon;

    return (
      <div className="rounded-xl p-4 space-y-3 transition-all"
        style={{ background: "oklch(0.12 0.025 240 / 80%)", border: `1px solid ${borderNeon.replace(")", " / 20%)")}`, backdropFilter: "blur(12px)" }}
      >
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
            style={{ background: `${neon.replace(")", " / 12%)")}`, border: `1px solid ${neon.replace(")", " / 30%)")}` }}
          >
            <Icon className="h-4 w-4" style={{ color: neon }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate" style={{ color: "oklch(0.92 0.01 220)" }}>@{account?.handle ?? "?"}</p>
            <p className="text-xs truncate" style={{ color: "oklch(0.55 0.02 240)" }}>{post.theme ?? "Sem tema"}</p>
          </div>
          <div className="shrink-0">
            {isApproved ? (
              <span className="text-xs px-2 py-0.5 rounded-full font-mono" style={{ background: "oklch(0.80 0.18 145 / 12%)", color: "oklch(0.80 0.18 145)", border: "1px solid oklch(0.80 0.18 145 / 30%)" }}>
                ✓ Na fila
              </span>
            ) : isFuture ? (
              <span className="text-xs px-2 py-0.5 rounded-full font-mono flex items-center gap-1" style={{ background: "oklch(0.82 0.18 80 / 12%)", color: "oklch(0.82 0.18 80)", border: "1px solid oklch(0.82 0.18 80 / 30%)" }}>
                <Clock className="h-3 w-3" />
                {new Date(post.scheduledAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
              </span>
            ) : (
              <span className="text-xs px-2 py-0.5 rounded-full font-mono flex items-center gap-1" style={{ background: `${neon.replace(")", " / 10%)")}`, color: neon, border: `1px solid ${neon.replace(")", " / 25%)")}` }}>
                <Send className="h-3 w-3" />
                Pendente
              </span>
            )}
          </div>
        </div>

        {/* Imagem */}
        {post.mediaUrl && (
          <div className="rounded-lg overflow-hidden" style={{ border: "1px solid oklch(0.22 0.04 240)" }}>
            <img src={post.mediaUrl} alt={post.theme ?? "Post"} className="w-full h-48 object-cover"
              onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
          </div>
        )}

        {/* Legenda */}
        <div className="rounded-lg p-3 max-h-32 overflow-y-auto" style={{ background: "oklch(0.09 0.02 240)", border: "1px solid oklch(0.22 0.04 240)" }}>
          <p className="text-xs leading-relaxed whitespace-pre-wrap" style={{ color: "oklch(0.75 0.01 220)" }}>{post.caption ?? "Sem legenda"}</p>
        </div>

        {/* Ações */}
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => reject.mutate({ id: post.id })}
            disabled={reject.isPending || approve.isPending || publishNow.isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{ background: "oklch(0.65 0.25 25 / 10%)", color: "oklch(0.75 0.22 25)", border: "1px solid oklch(0.65 0.25 25 / 30%)" }}
          >
            <XCircle className="h-3.5 w-3.5" /> Rejeitar
          </button>

          {!isFuture && (
            <button
              onClick={() => {
                if (isApproved) publishNow.mutate({ postId: post.id });
                else approve.mutate({ id: post.id }, { onSuccess: () => publishNow.mutate({ postId: post.id }) });
              }}
              disabled={publishNow.isPending || approve.isPending || reject.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{ background: "linear-gradient(135deg, oklch(0.72 0.22 290), oklch(0.75 0.22 340))", color: "oklch(0.98 0 0)", boxShadow: "0 0 15px oklch(0.72 0.22 290 / 25%)" }}
            >
              {publishNow.isPending || approve.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Rocket className="h-3.5 w-3.5" />}
              Publicar Agora
            </button>
          )}

          {!isApproved && (
            <button
              onClick={() => approve.mutate({ id: post.id })}
              disabled={approve.isPending || reject.isPending || publishNow.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{ background: "oklch(0.82 0.18 195 / 12%)", color: "oklch(0.82 0.18 195)", border: "1px solid oklch(0.82 0.18 195 / 30%)" }}
            >
              {approve.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : isFuture ? <CalendarCheck className="h-3.5 w-3.5" /> : <CheckCircle className="h-3.5 w-3.5" />}
              {isFuture ? "Agendar" : "Só Aprovar"}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "'Orbitron', sans-serif", background: "linear-gradient(135deg, oklch(0.92 0.01 220), oklch(0.82 0.18 195))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Aprovação
          </h1>
          <p className="text-xs mt-1 font-mono uppercase tracking-widest" style={{ color: "oklch(0.82 0.18 195 / 60%)" }}>
            {pendingCount} pendente(s) · {approvedCount} aprovado(s) na fila
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => invalidateAll()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{ background: "oklch(0.12 0.025 240)", color: "oklch(0.65 0.02 240)", border: "1px solid oklch(0.22 0.04 240)" }}
          >
            <RefreshCw className="h-3.5 w-3.5" /> Atualizar
          </button>
          {pendingCount > 0 && (
            <button onClick={() => approveAll.mutate()} disabled={approveAll.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{ background: "linear-gradient(135deg, oklch(0.82 0.18 195), oklch(0.72 0.22 290))", color: "oklch(0.08 0.02 220)", boxShadow: "0 0 15px oklch(0.82 0.18 195 / 25%)" }}
            >
              {approveAll.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
              Aprovar Todos ({pendingCount})
            </button>
          )}
        </div>
      </div>

      {totalCount === 0 ? (
        <div className="rounded-xl py-16 text-center" style={{ background: "oklch(0.12 0.025 240 / 80%)", border: "1px solid oklch(0.22 0.04 240)" }}>
          <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-30" style={{ color: "oklch(0.80 0.18 145)" }} />
          <p className="font-semibold" style={{ color: "oklch(0.65 0.02 240)" }}>Nenhum post pendente</p>
          <p className="text-xs mt-1" style={{ color: "oklch(0.45 0.02 240)" }}>Todos os posts foram revisados</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingPosts && pendingPosts.length > 0 && (
            <>
              <div className="flex items-center gap-2">
                <p className="label-mono">Aguardando aprovação ({pendingCount})</p>
                <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, oklch(0.82 0.18 195 / 20%), transparent)" }} />
              </div>
              {pendingPosts.map((post: any) => <PostCard key={post.id} post={post} isApproved={false} />)}
            </>
          )}
          {approvedPosts && approvedPosts.length > 0 && (
            <>
              <div className="flex items-center gap-2 mt-4">
                <p className="label-mono" style={{ color: "oklch(0.80 0.18 145 / 70%)" }}>Aprovados — aguardando publicação ({approvedCount})</p>
                <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, oklch(0.80 0.18 145 / 20%), transparent)" }} />
              </div>
              {approvedPosts.map((post: any) => <PostCard key={post.id} post={post} isApproved={true} />)}
            </>
          )}
        </div>
      )}
    </div>
  );
}
