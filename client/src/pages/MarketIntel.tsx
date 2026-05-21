import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Search, TrendingUp, Users, Target, Lightbulb, RefreshCw } from "lucide-react";

export default function MarketIntel() {
  const [competitor, setCompetitor] = useState("");
  const [niche, setNiche] = useState("tecnologia e automação");
  const [report, setReport] = useState<null | {
    summary: string;
    strengths: string[];
    opportunities: string[];
    contentPillars: string[];
    hashtags: string[];
    postingStrategy: string;
  }>(null);
  const [loading, setLoading] = useState(false);

  const generateReport = trpc.marketIntel.analyze.useMutation({
    onSuccess: (data) => {
      setReport(data);
      setLoading(false);
    },
    onError: (e) => {
      toast.error(`Erro: ${e.message}`);
      setLoading(false);
    },
  });

  const handleAnalyze = () => {
    if (!niche.trim()) { toast.error("Informe o nicho"); return; }
    setLoading(true);
    setReport(null);
    generateReport.mutate({ niche, competitor: competitor.trim() || undefined });
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Inteligência de Mercado</h1>
        <p className="text-muted-foreground text-sm mt-1">Análise de nicho, concorrentes e estratégia de conteúdo com IA</p>
      </div>

      {/* Formulário de análise */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><Search className="w-4 h-4" /> Configurar Análise</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label>Nicho / Segmento</Label>
            <Input
              placeholder="ex: tecnologia e automação para empresas"
              value={niche}
              onChange={e => setNiche(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>Concorrente para analisar (opcional)</Label>
            <Input
              placeholder="ex: @empresa_concorrente ou nome da empresa"
              value={competitor}
              onChange={e => setCompetitor(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Deixe em branco para análise geral do nicho</p>
          </div>
          <Button onClick={handleAnalyze} disabled={loading} className="w-full gap-2">
            {loading ? <><RefreshCw className="w-4 h-4 animate-spin" /> Analisando com IA...</> : <><TrendingUp className="w-4 h-4" /> Gerar Análise</>}
          </Button>
        </CardContent>
      </Card>

      {/* Resultado */}
      {report && (
        <div className="space-y-4">
          {/* Resumo */}
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2"><Target className="w-4 h-4 text-primary" /> Diagnóstico do Nicho</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">{report.summary}</p>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Pontos fortes */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="w-4 h-4 text-green-500" /> Diferenciais da Triarc</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {report.strengths.map((s, i) => (
                    <li key={i} className="text-sm flex gap-2"><span className="text-green-500 shrink-0">✓</span>{s}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Oportunidades */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><Lightbulb className="w-4 h-4 text-yellow-500" /> Oportunidades</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {report.opportunities.map((o, i) => (
                    <li key={i} className="text-sm flex gap-2"><span className="text-yellow-500 shrink-0">→</span>{o}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Pilares de conteúdo */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><Users className="w-4 h-4 text-blue-500" /> Pilares de Conteúdo Recomendados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-2">
                {report.contentPillars.map((p, i) => (
                  <div key={i} className="bg-muted rounded-lg p-3 text-sm">{p}</div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Estratégia de postagem */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">📅 Estratégia de Postagem</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed whitespace-pre-line">{report.postingStrategy}</p>
            </CardContent>
          </Card>

          {/* Hashtags */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm"># Hashtags Estratégicas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {report.hashtags.map((h, i) => (
                  <Badge key={i} variant="secondary" className="cursor-pointer" onClick={() => { navigator.clipboard.writeText(h); toast.success("Copiado!"); }}>
                    {h}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Clique para copiar</p>
            </CardContent>
          </Card>

          <Button variant="outline" onClick={handleAnalyze} className="w-full gap-2">
            <RefreshCw className="w-4 h-4" /> Gerar Nova Análise
          </Button>
        </div>
      )}
    </div>
  );
}
