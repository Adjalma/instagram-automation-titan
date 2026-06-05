import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Hammer, Zap, Camera, Shield, Users } from "lucide-react";
import QueryError from "@/components/QueryError";

const iconMap: Record<string, any> = {
  Hammer, Zap, Camera, Shield, Users,
};

export default function Themes() {
  const { data: themes, isLoading, isError, error, refetch } = trpc.themes.list.useQuery();

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Cronograma de Conteúdo</h1>
        <p className="label-mono mt-1">5 temas fixos // Estratégia de publicação</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {themes?.map(theme => {
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
                <div className="mt-3 flex gap-2">
                  <Badge variant="outline" className="text-[10px]">@aguiaroriginal</Badge>
                  <Badge variant="outline" className="text-[10px]">@triarcsolutions</Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="card-blueprint">
        <CardHeader>
          <CardTitle className="text-base font-bold">Sugestão de Rotação Semanal</CardTitle>
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
    </div>
  );
}
