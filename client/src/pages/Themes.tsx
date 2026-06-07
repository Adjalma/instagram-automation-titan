import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Hammer, Zap, Camera, Shield, Users, Package } from "lucide-react";
import QueryError from "@/components/QueryError";

const iconMap: Record<string, any> = {
  Hammer, Zap, Camera, Shield, Users,
};

export default function Themes() {
  const { data: themes, isLoading, isError, error, refetch } = trpc.themes.list.useQuery();
  const {
    data: catalog,
    isLoading: loadingCatalog,
    isError: catalogError,
    error: catalogErr,
    refetch: refetchCatalog,
  } = trpc.triacContent.list.useQuery({ socialOnly: true });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return <QueryError message={error?.message} onRetry={() => refetch()} />;
  }

  const servicos = catalog?.filter((i: any) => i.type === "servico") ?? [];
  const projetos = catalog?.filter((i: any) => i.type === "projeto") ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Cronograma de Conteúdo</h1>
        <p className="label-mono mt-1">Pilares editoriais (formato do post) + catálogo Triarc (sobre o quê falar)</p>
      </div>

      <div>
        <h2 className="text-lg font-bold mb-3">Pilares editoriais — 5 temas fixos</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Use em <strong>Criar Post</strong> ou <strong>Gerar Lote</strong>. Definem o <em>formato</em> (bastidores, dicas, etc.), não o app.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {themes?.map((theme) => {
            const Icon = iconMap[theme.icon ?? ""] ?? Zap;
            return (
              <Card key={theme.id} className="card-blueprint group hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${theme.color}20` }}>
                      <Icon className="h-5 w-5" style={{ color: theme.color ?? undefined }} />
                    </div>
                    <div>
                      <CardTitle className="text-base font-bold">{theme.name}</CardTitle>
                      <p className="label-mono">{theme.slug}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">{theme.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <Card className="card-blueprint">
        <CardHeader>
          <CardTitle className="text-base font-bold">Sugestão de Rotação Semanal (pilares)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-2">
            {["Seg", "Ter", "Qua", "Qui", "Sex"].map((day, i) => {
              const theme = themes?.[i];
              return (
                <div key={day} className="text-center p-3 rounded-lg bg-muted/30">
                  <p className="label-mono mb-1">{day}</p>
                  <p className="text-xs font-semibold">{theme?.name ?? "-"}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <Package className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold">Catálogo Triarc — apps e serviços</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Usado em <strong>Gerar Semana</strong> e ao escolher app em <strong>Criar Post</strong>.
          Apps pessoais/religiosos (Legendários, Mir Macaé, Rede Sião, etc.) estão <strong>excluídos</strong> do Instagram corporativo.
        </p>

        {loadingCatalog ? (
          <div className="flex items-center gap-2 text-muted-foreground py-8">
            <Loader2 className="h-5 w-5 animate-spin" /> Carregando catálogo…
          </div>
        ) : catalogError ? (
          <QueryError message={catalogErr?.message} onRetry={() => refetchCatalog()} />
        ) : (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Serviços ({servicos.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {servicos.map((item: any) => (
                  <Badge key={item.id} variant="secondary" className="text-xs py-1 px-2">
                    {item.name}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Projetos ativos ({projetos.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {projetos.map((item: any) => (
                  <Card key={item.id} className="border-muted">
                    <CardContent className="p-3">
                      <p className="font-semibold text-sm">{item.name}</p>
                      {item.subtitle && (
                        <p className="text-xs text-muted-foreground mt-0.5">{item.subtitle}</p>
                      )}
                      <Badge variant="outline" className="text-[10px] mt-2">{item.category}</Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
            {(catalog?.length ?? 0) === 0 && (
              <p className="text-sm text-amber-600">
                Catálogo vazio — aguarde o deploy (seed automático) ou verifique conexão com o banco.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
