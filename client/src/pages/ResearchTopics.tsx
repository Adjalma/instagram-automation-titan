import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Edit2, Trash2, Plus, Clock, Zap } from "lucide-react";

const NEON = {
  cyan: "oklch(0.82 0.18 195)",
  purple: "oklch(0.72 0.22 290)",
  pink: "oklch(0.75 0.22 340)",
  green: "oklch(0.80 0.18 145)",
  gold: "oklch(0.82 0.18 80)",
};

export default function ResearchTopics() {
  const topics = trpc.researchTopics.list.useQuery();
  const createTopic = trpc.researchTopics.create.useMutation({
    onSuccess: () => {
      topics.refetch();
      toast.success("Tópico criado");
      setNewTopic({ name: "", query: "", publishHour: 8, autoPublish: false });
    },
    onError: (e) => toast.error(`Erro: ${e.message}`),
  });
  const updateTopic = trpc.researchTopics.update.useMutation({
    onSuccess: () => {
      topics.refetch();
      toast.success("Tópico atualizado");
      setEditingId(null);
    },
    onError: (e) => toast.error(`Erro: ${e.message}`),
  });
  const deleteTopic = trpc.researchTopics.delete.useMutation({
    onSuccess: () => {
      topics.refetch();
      toast.success("Tópico deletado");
    },
    onError: (e) => toast.error(`Erro: ${e.message}`),
  });

  const [newTopic, setNewTopic] = useState({ name: "", query: "", publishHour: 8, autoPublish: false });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<any>({});

  const handleCreate = () => {
    if (!newTopic.name || !newTopic.query) {
      toast.error("Preencha nome e query");
      return;
    }
    createTopic.mutate(newTopic);
  };

  const handleUpdate = (id: number) => {
    updateTopic.mutate({ id, ...editData });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "'Orbitron', sans-serif", background: `linear-gradient(135deg, oklch(0.92 0.01 220), ${NEON.cyan})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          Pesquisa Diária
        </h1>
        <p className="text-xs mt-1 font-mono uppercase tracking-widest" style={{ color: `${NEON.cyan.replace(")", " / 60%)")}` }}>
          Gerencie os tópicos de pesquisa automática
        </p>
      </div>

      {/* Criar novo tópico */}
      <div className="rounded-xl p-5" style={{ background: "oklch(0.17 0.03 240 / 90%)", border: `1px solid ${NEON.purple.replace(")", " / 25%)")}` }}>
        <div className="flex items-center gap-2 mb-4">
          <Plus className="h-4 w-4" style={{ color: NEON.purple }} />
          <p className="label-mono" style={{ color: `${NEON.purple.replace(")", " / 80%)")}` }}>Novo Tópico</p>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input
              placeholder="Nome do tópico"
              value={newTopic.name}
              onChange={(e) => setNewTopic({ ...newTopic, name: e.target.value })}
              className="text-xs"
            />
            <Input
              placeholder="Query para NewsAPI"
              value={newTopic.query}
              onChange={(e) => setNewTopic({ ...newTopic, query: e.target.value })}
              className="text-xs"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="flex items-center gap-2">
              <Clock size={14} style={{ color: NEON.gold }} />
              <Input
                type="number"
                min="0"
                max="23"
                value={newTopic.publishHour}
                onChange={(e) => setNewTopic({ ...newTopic, publishHour: parseInt(e.target.value) })}
                className="text-xs"
              />
              <span className="text-xs" style={{ color: "oklch(0.50 0.02 240)" }}>h Brasília</span>
            </div>
            <label className="flex items-center gap-2 text-xs" style={{ color: "oklch(0.70 0.02 240)" }}>
              <input
                type="checkbox"
                checked={newTopic.autoPublish}
                onChange={(e) => setNewTopic({ ...newTopic, autoPublish: e.target.checked })}
              />
              Auto-publicar
            </label>
            <Button
              onClick={handleCreate}
              disabled={createTopic.isPending}
              className="text-xs"
              style={{ background: `${NEON.purple.replace(")", " / 20%)")}`, color: NEON.purple, border: `1px solid ${NEON.purple.replace(")", " / 25%)")}` }}
            >
              Criar
            </Button>
          </div>
        </div>
      </div>

      {/* Lista de tópicos */}
      <div className="rounded-xl overflow-hidden" style={{ background: "oklch(0.17 0.03 240 / 90%)", border: "1px solid oklch(0.28 0.04 240)" }}>
        <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: "1px solid oklch(0.22 0.04 240)" }}>
          <Zap className="h-4 w-4" style={{ color: NEON.cyan }} />
          <p className="label-mono" style={{ color: `${NEON.cyan.replace(")", " / 80%)")}` }}>Tópicos Ativos ({topics.data?.length ?? 0})</p>
        </div>
        {topics.isLoading ? (
          <div className="p-8 text-center text-xs font-mono" style={{ color: "oklch(0.45 0.02 240)" }}>
            Carregando...
          </div>
        ) : (topics.data ?? []).length === 0 ? (
          <div className="p-8 text-center text-xs font-mono" style={{ color: "oklch(0.45 0.02 240)" }}>
            Nenhum tópico cadastrado.
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "oklch(0.18 0.04 240)" }}>
            {(topics.data ?? []).map((topic: any) => (
              <div key={topic.id} className="px-4 py-3 flex items-start gap-3 transition-all"
                onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = "oklch(0.14 0.025 240 / 50%)"}
                onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = "transparent"}
              >
                <div className="flex-1 min-w-0">
                  {editingId === topic.id ? (
                    <div className="space-y-2">
                      <Input
                        value={editData.name ?? topic.name}
                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                        className="text-xs"
                        placeholder="Nome"
                      />
                      <Input
                        value={editData.query ?? topic.query}
                        onChange={(e) => setEditData({ ...editData, query: e.target.value })}
                        className="text-xs"
                        placeholder="Query"
                      />
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          max="23"
                          value={editData.publishHour ?? topic.publishHour}
                          onChange={(e) => setEditData({ ...editData, publishHour: parseInt(e.target.value) })}
                          className="text-xs w-16"
                        />
                        <span className="text-xs" style={{ color: "oklch(0.50 0.02 240)" }}>h</span>
                        <label className="flex items-center gap-1 text-xs" style={{ color: "oklch(0.70 0.02 240)" }}>
                          <input
                            type="checkbox"
                            checked={editData.autoPublish ?? topic.autoPublish === 1}
                            onChange={(e) => setEditData({ ...editData, autoPublish: e.target.checked })}
                          />
                          Auto
                        </label>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleUpdate(topic.id)}
                          disabled={updateTopic.isPending}
                          className="text-xs"
                          style={{ background: `${NEON.green.replace(")", " / 20%)")}`, color: NEON.green }}
                        >
                          Salvar
                        </Button>
                        <Button
                          onClick={() => setEditingId(null)}
                          className="text-xs"
                          style={{ background: "oklch(0.12 0.025 240)", color: "oklch(0.65 0.02 240)" }}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-xs font-bold" style={{ color: "oklch(0.78 0.01 220)" }}>{topic.name}</p>
                      <p className="text-xs mt-1 font-mono" style={{ color: "oklch(0.50 0.02 240)" }}>Query: {topic.query}</p>
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-mono" style={{ background: "oklch(0.82 0.18 80 / 8%)", color: "oklch(0.82 0.18 80 / 70%)", border: "1px solid oklch(0.82 0.18 80 / 15%)" }}>
                          ⏰ {topic.publishHour}h Brasília
                        </span>
                        {topic.autoPublish === 1 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-mono" style={{ background: "oklch(0.80 0.18 145 / 8%)", color: "oklch(0.80 0.18 145 / 70%)", border: "1px solid oklch(0.80 0.18 145 / 15%)" }}>
                            ✓ Auto-publicar
                          </span>
                        )}
                        {topic.active === 0 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-mono" style={{ background: "oklch(0.50 0.02 240 / 8%)", color: "oklch(0.50 0.02 240 / 70%)" }}>
                            ⊘ Inativo
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>
                {editingId !== topic.id && (
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => {
                        setEditingId(topic.id);
                        setEditData({ name: topic.name, query: topic.query, publishHour: topic.publishHour, autoPublish: topic.autoPublish === 1 });
                      }}
                      className="p-1.5 rounded transition-colors"
                      style={{ color: NEON.cyan }}
                      title="Editar"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => deleteTopic.mutate({ id: topic.id })}
                      disabled={deleteTopic.isPending}
                      className="p-1.5 rounded transition-colors"
                      style={{ color: NEON.pink }}
                      title="Deletar"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-[10px] text-center font-mono pb-2" style={{ color: "oklch(0.35 0.02 240)" }}>
        Tópicos ativos disparam automaticamente nos horários configurados. Edite queries para mudar os termos de busca na NewsAPI.
      </p>
    </div>
  );
}
