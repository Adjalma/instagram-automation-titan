import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Upload, Trash2, Image, FileImage } from "lucide-react";

export default function Assets() {
  const utils = trpc.useUtils();
  const { data: assets, isLoading } = trpc.assets.list.useQuery();
  const uploadAsset = trpc.assets.upload.useMutation({
    onSuccess: () => { utils.assets.list.invalidate(); toast.success("Asset enviado!"); },
    onError: () => toast.error("Erro ao enviar asset"),
  });
  const deleteAsset = trpc.assets.delete.useMutation({
    onSuccess: () => { utils.assets.list.invalidate(); toast.success("Asset removido"); },
    onError: () => toast.error("Erro ao remover"),
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Arquivo muito grande (máx. 5MB)");
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(",")[1];
      await uploadAsset.mutateAsync({
        name: file.name,
        base64,
        mimeType: file.type,
      });
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Assets</h1>
          <p className="label-mono mt-1">Biblioteca de mídia // {assets?.length ?? 0} arquivo(s)</p>
        </div>
        <div>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
          <Button onClick={() => fileInputRef.current?.click()} disabled={uploadAsset.isPending} className="gap-2">
            {uploadAsset.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Upload
          </Button>
        </div>
      </div>

      {!assets || assets.length === 0 ? (
        <Card className="card-blueprint">
          <CardContent className="py-12 text-center">
            <FileImage className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-30" />
            <p className="text-lg font-semibold text-muted-foreground">Nenhum asset</p>
            <p className="label-mono mt-1">Faça upload do logo, prints e imagens do Titan App</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {assets.map(asset => (
            <Card key={asset.id} className="card-blueprint group overflow-hidden">
              <div className="aspect-square relative bg-muted/30">
                <img src={asset.url} alt={asset.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                  <Button
                    variant="destructive"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                    onClick={() => deleteAsset.mutate({ id: asset.id })}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardContent className="p-2">
                <p className="text-xs font-medium truncate">{asset.name}</p>
                <p className="label-mono">{asset.mimeType ?? "image"}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
