import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Edit, Trash2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Safras() {
  const [open, setOpen] = useState(false);
  const [editingSafra, setEditingSafra] = useState<any>(null);
  const utils = trpc.useUtils();

  const { data: safrasSummary, isLoading } = trpc.safras.summary.useQuery();

  const createSafra = trpc.safras.create.useMutation({
    onSuccess: () => {
      utils.safras.summary.invalidate();
      utils.safras.list.invalidate();
      utils.safras.listActive.invalidate();
      setOpen(false);
      toast.success("Safra cadastrada com sucesso!");
    },
    onError: (error) => {
      toast.error(`Erro ao cadastrar safra: ${error.message}`);
    },
  });

  const updateSafra = trpc.safras.update.useMutation({
    onSuccess: () => {
      utils.safras.summary.invalidate();
      utils.safras.list.invalidate();
      utils.safras.listActive.invalidate();
      setEditingSafra(null);
      toast.success("Safra atualizada com sucesso!");
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar safra: ${error.message}`);
    },
  });

  const finalizeSafra = trpc.safras.finalize.useMutation({
    onSuccess: () => {
      utils.safras.summary.invalidate();
      utils.safras.list.invalidate();
      utils.safras.listActive.invalidate();
      toast.success("Safra finalizada com sucesso!");
    },
  });

  const deleteSafra = trpc.safras.delete.useMutation({
    onSuccess: () => {
      utils.safras.summary.invalidate();
      utils.safras.list.invalidate();
      utils.safras.listActive.invalidate();
      toast.success("Safra excluída com sucesso!");
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const startDate = new Date(formData.get('startDate') as string);
    const endDateValue = formData.get('endDate') as string;
    const endDate = endDateValue ? new Date(endDateValue) : undefined;

    if (editingSafra) {
      updateSafra.mutate({
        id: editingSafra.id,
        name: formData.get('name') as string,
        startDate,
        endDate,
        notes: formData.get('notes') as string || undefined,
      });
    } else {
      createSafra.mutate({
        name: formData.get('name') as string,
        startDate,
        endDate,
        notes: formData.get('notes') as string || undefined,
      });
    }
  };

  const handleEdit = (safra: any) => {
    setEditingSafra(safra);
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setEditingSafra(null);
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(cents / 100);
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return '-';
    return format(new Date(date), 'dd/MM/yyyy', { locale: ptBR });
  };

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Gerenciamento de Safras</CardTitle>
            <Dialog open={open || !!editingSafra} onOpenChange={(isOpen) => {
              if (!isOpen) handleCloseDialog();
              else setOpen(true);
            }}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Safra
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-primary/20">
                <DialogHeader>
                  <DialogTitle>{editingSafra ? 'Editar Safra' : 'Cadastrar Safra'}</DialogTitle>
                  <DialogDescription>
                    {editingSafra ? 'Atualize os dados da safra' : 'Adicione uma nova safra ao sistema'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome da Safra</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="Ex: Safra 2025/2026"
                      defaultValue={editingSafra?.name}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="startDate">Data de Início</Label>
                    <Input
                      id="startDate"
                      name="startDate"
                      type="date"
                      defaultValue={editingSafra?.startDate ? format(new Date(editingSafra.startDate), 'yyyy-MM-dd') : ''}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endDate">Data de Término (opcional)</Label>
                    <Input
                      id="endDate"
                      name="endDate"
                      type="date"
                      defaultValue={editingSafra?.endDate ? format(new Date(editingSafra.endDate), 'yyyy-MM-dd') : ''}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Observações (opcional)</Label>
                    <Input
                      id="notes"
                      name="notes"
                      placeholder="Observações sobre a safra"
                      defaultValue={editingSafra?.notes || ''}
                    />
                  </div>

                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
                    {editingSafra ? 'Atualizar' : 'Cadastrar'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : !safrasSummary || safrasSummary.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma safra cadastrada
            </div>
          ) : (
            <div className="rounded-lg border border-border/50 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Safra</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead className="text-right">Receita Total</TableHead>
                    <TableHead className="text-right">Custo Total</TableHead>
                    <TableHead className="text-right">Resultado</TableHead>
                    <TableHead className="text-right">Litros</TableHead>
                    <TableHead className="text-right">R$/Litro</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {safrasSummary.map((safra) => (
                    <TableRow key={safra.id}>
                      <TableCell className="font-medium">{safra.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(safra.startDate)} - {formatDate(safra.endDate)}
                      </TableCell>
                      <TableCell className="text-right text-green-400">
                        {formatCurrency(safra.totalReceitas)}
                      </TableCell>
                      <TableCell className="text-right text-red-400">
                        {formatCurrency(safra.totalDespesas)}
                      </TableCell>
                      <TableCell className={`text-right font-semibold ${safra.resultado >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {formatCurrency(safra.resultado)}
                      </TableCell>
                      <TableCell className="text-right">
                        {(safra.totalLitros / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} L
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(safra.resultadoPorLitro)}
                      </TableCell>
                      <TableCell className="text-center">
                        {safra.finalized ? (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <CheckCircle2 className="w-3 h-3" />
                            Finalizada
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-green-400">
                            <XCircle className="w-3 h-3" />
                            Ativa
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 justify-center">
                          {!safra.finalized && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(safra)}
                                className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  if (confirm(`Deseja finalizar a safra "${safra.name}"? Ela não aparecerá mais nos lançamentos.`)) {
                                    finalizeSafra.mutate({ id: safra.id });
                                  }
                                }}
                                className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-900/20"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm(`Deseja excluir a safra "${safra.name}"?`)) {
                                deleteSafra.mutate({ id: safra.id });
                              }
                            }}
                            className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

