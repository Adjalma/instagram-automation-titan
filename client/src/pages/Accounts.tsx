import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Trash2, Instagram, Linkedin, Facebook, Youtube, Music } from "lucide-react";

const PLATFORM_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; placeholder: string; urlPrefix: string }> = {
  instagram: { label: "Instagram", icon: Instagram, color: "bg-pink-500", placeholder: "@triarcsolutions", urlPrefix: "https://instagram.com/" },
  linkedin: { label: "LinkedIn", icon: Linkedin, color: "bg-blue-700", placeholder: "triarc-solutions", urlPrefix: "https://linkedin.com/company/" },
  facebook: { label: "Facebook", icon: Facebook, color: "bg-blue-600", placeholder: "triarcsolutions", urlPrefix: "https://facebook.com/" },
  tiktok: { label: "TikTok", icon: Music, color: "bg-black", placeholder: "@triarcsolutions", urlPrefix: "https://tiktok.com/@" },
  youtube: { label: "YouTube", icon: Youtube, color: "bg-red-600", placeholder: "TriarcSolutions", urlPrefix: "https://youtube.com/@" },
};

export default function Accounts() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    handle: "",
    displayName: "",
    platform: "instagram" as "instagram" | "linkedin" | "facebook" | "tiktok" | "youtube",
    accountType: "business" as "personal" | "business",
    tone: "corporate" as "personal" | "corporate",
    bio: "",
    profileUrl: "",
  });

  const { data: accounts = [], refetch } = trpc.accounts.list.useQuery();
  const createAccount = trpc.accounts.create.useMutation({
    onSuccess: () => {
      toast.success("Conta adicionada com sucesso!");
      setOpen(false);
      setForm({ handle: "", displayName: "", platform: "instagram", accountType: "business", tone: "corporate", bio: "", profileUrl: "" });
      refetch();
    },
    onError: (e) => toast.error(`Erro ao adicionar conta: ${e.message}`),
  });
  const deleteAccount = trpc.accounts.delete.useMutation({
    onSuccess: () => { toast.success("Conta removida"); refetch(); },
    onError: (e) => toast.error(`Erro ao remover conta: ${e.message}`),
  });

  const cfg = PLATFORM_CONFIG[form.platform];

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Contas</h1>
          <p className="text-muted-foreground text-sm mt-1">Gerencie suas redes sociais conectadas</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2"><Plus className="w-4 h-4" /> Nova Conta</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Adicionar Conta</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-1">
                <Label>Rede Social</Label>
                <Select value={form.platform} onValueChange={(v: any) => setForm(f => ({ ...f, platform: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(PLATFORM_CONFIG).map(([key, c]) => (
                      <SelectItem key={key} value={key}>
                        <span className="flex items-center gap-2"><c.icon className="w-4 h-4" />{c.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Handle / Username</Label>
                <Input placeholder={cfg.placeholder} value={form.handle} onChange={e => setForm(f => ({ ...f, handle: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Nome de Exibição</Label>
                <Input placeholder="Triarc Solutions" value={form.displayName} onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Tipo</Label>
                  <Select value={form.accountType} onValueChange={(v: any) => setForm(f => ({ ...f, accountType: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="business">Empresa</SelectItem>
                      <SelectItem value="personal">Pessoal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Tom</Label>
                  <Select value={form.tone} onValueChange={(v: any) => setForm(f => ({ ...f, tone: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="corporate">Corporativo</SelectItem>
                      <SelectItem value="personal">Pessoal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <Label>URL do Perfil</Label>
                <Input placeholder={cfg.urlPrefix + form.handle} value={form.profileUrl} onChange={e => setForm(f => ({ ...f, profileUrl: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Bio (opcional)</Label>
                <Textarea placeholder="Descrição da conta..." rows={2} value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} />
              </div>
              <Button className="w-full" disabled={!form.handle || !form.displayName || createAccount.isPending}
                onClick={() => createAccount.mutate(form)}>
                {createAccount.isPending ? "Adicionando..." : "Adicionar Conta"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Grid de redes disponíveis */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {Object.entries(PLATFORM_CONFIG).map(([key, c]) => {
          const count = accounts.filter((a: any) => (a.platform ?? "instagram") === key).length;
          const Icon = c.icon;
          return (
            <Card key={key} className={`text-center p-3 ${count > 0 ? "border-primary" : "opacity-60"}`}>
              <div className={`w-10 h-10 rounded-full ${c.color} flex items-center justify-center mx-auto mb-2`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-xs font-medium">{c.label}</p>
              <p className="text-xs text-muted-foreground">{count} conta{count !== 1 ? "s" : ""}</p>
            </Card>
          );
        })}
      </div>

      {/* Lista de contas */}
      <div className="space-y-3">
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Contas Conectadas</h2>
        {accounts.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            <p>Nenhuma conta adicionada ainda.</p>
            <p className="text-sm mt-1">Clique em "Nova Conta" para começar.</p>
          </Card>
        ) : (
          accounts.map((account: any) => {
            const platform = account.platform ?? "instagram";
            const cfg = PLATFORM_CONFIG[platform] ?? PLATFORM_CONFIG.instagram;
            const Icon = cfg.icon;
            return (
              <Card key={account.id}>
                <CardContent className="flex items-center gap-4 p-4">
                  <div className={`w-10 h-10 rounded-full ${cfg.color} flex items-center justify-center shrink-0`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{account.displayName}</span>
                      <Badge variant="outline" className="text-xs">{cfg.label}</Badge>
                      <Badge variant="secondary" className="text-xs capitalize">{account.accountType}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">@{account.handle}</p>
                    {account.bio && <p className="text-xs text-muted-foreground mt-1 truncate">{account.bio}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                    {platform === "facebook" && (
                      account.accessToken && account.linkedinUrn?.startsWith("fb:page:") ? (
                        <div className="flex items-center gap-1 flex-wrap justify-end">
                          <Badge className="bg-blue-600 text-white text-xs">📰 Page Conectada</Badge>
                          <Button variant="ghost" size="sm" className="text-xs text-blue-700 h-6 px-2"
                            onClick={() => {
                              window.location.href = `/api/facebook/auth?origin=${encodeURIComponent(window.location.origin)}&accountId=${account.id}`;
                            }}>
                            Reconectar
                          </Button>
                        </div>
                      ) : (
                        <Button variant="outline" size="sm" className="text-blue-600 border-blue-600 hover:bg-blue-50"
                          onClick={() => {
                            window.location.href = `/api/facebook/auth?origin=${encodeURIComponent(window.location.origin)}&accountId=${account.id}`;
                          }}>
                          <Facebook className="w-3 h-3 mr-1" /> Conectar
                        </Button>
                      )
                    )}
                    {platform === "linkedin" && (
                      account.accessToken ? (
                        <div className="flex items-center gap-1 flex-wrap justify-end">
                          <Badge className="bg-green-600 text-white text-xs">
                            {account.linkedinUrn?.startsWith("urn:li:organization:") ? "🏢 Company Page" : "👤 Perfil Pessoal"}
                          </Badge>
                          <Button variant="ghost" size="sm" className="text-xs text-blue-700 h-6 px-2"
                            onClick={() => {
                              window.location.href = `/api/linkedin/auth?origin=${encodeURIComponent(window.location.origin)}&accountId=${account.id}`;
                            }}>
                            Reconectar
                          </Button>
                        </div>
                      ) : (
                        <Button variant="outline" size="sm" className="text-blue-700 border-blue-700 hover:bg-blue-50"
                          onClick={() => {
                            window.location.href = `/api/linkedin/auth?origin=${encodeURIComponent(window.location.origin)}&accountId=${account.id}`;
                          }}>
                          <Linkedin className="w-3 h-3 mr-1" /> Conectar
                        </Button>
                      )
                    )}
                    {account.profileUrl && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={account.profileUrl} target="_blank" rel="noopener noreferrer">Ver Perfil</a>
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"
                      onClick={() => { if (confirm("Remover esta conta?")) deleteAccount.mutate({ id: account.id }); }}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Redes não suportadas ainda */}
      <Card className="border-dashed">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Publicação Automática</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground space-y-1">
          <p>✅ <strong>Instagram</strong> — publicação automática via MCP ativa</p>
          <p>🔄 <strong>LinkedIn</strong> — OAuth configurado. Ao conectar, publica automaticamente na Company Page <em>triarc-solutions-brasil</em></p>
          <p>🔄 <strong>Facebook</strong> — OAuth configurado. Ao conectar, publica automaticamente na Página da empresa</p>
          <p>🔜 <strong>TikTok</strong> — em desenvolvimento (TikTok Content Posting API)</p>
          <p>🔜 <strong>YouTube</strong> — em desenvolvimento (YouTube Data API v3)</p>
        </CardContent>
      </Card>
    </div>
  );
}
