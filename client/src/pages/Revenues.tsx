import { useState, useMemo } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Upload, Trash2, Edit } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

type Revenue = {
  id: number;
  accountId: number;
  subAccountId?: number | null;
  safraId?: number | null;
  description: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  date: Date;
  received: boolean;
};

export default function Revenues() {
  const [open, setOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editingRevenue, setEditingRevenue] = useState<Revenue | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [selectedSubAccountId, setSelectedSubAccountId] = useState<string>("");
  const utils = trpc.useUtils();

  const { data: revenues, isLoading } = trpc.revenues.list.useQuery();
  const { data: accounts } = trpc.accounts.listByType.useQuery({ type: "receita" });
  const { data: safras } = trpc.safras.listActive.useQuery();

  const createRevenue = trpc.revenues.create.useMutation({
    onSuccess: async () => {
      await utils.revenues.list.invalidate();
      await utils.revenues.listByDateRange.invalidate();
      await utils.reports.financialSummary.invalidate();
      setOpen(false);
      setSelectedAccountId("");
      setSelectedSubAccountId("");
      toast.success("Receita cadastrada com sucesso!");
    },
    onError: (error) => {
      toast.error(`Erro ao cadastrar receita: ${error.message}`);
    },
  });

  const updateRevenue = trpc.revenues.update.useMutation({
    onSuccess: async () => {
      await utils.revenues.list.invalidate();
      await utils.revenues.listByDateRange.invalidate();
      await utils.reports.financialSummary.invalidate();
      setEditingRevenue(null);
      setSelectedAccountId("");
      toast.success("Receita atualizada com sucesso!");
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar receita: ${error.message}`);
    },
  });

  const deleteRevenue = trpc.revenues.delete.useMutation({
    onSuccess: async () => {
      await utils.revenues.list.invalidate();
      await utils.revenues.listByDateRange.invalidate();
      await utils.reports.financialSummary.invalidate();
      toast.success("Receita excluída com sucesso!");
    },
  });

  const importRevenues = trpc.revenues.importBatch.useMutation({
    onSuccess: (data) => {
      utils.revenues.list.invalidate();
      utils.reports.financialSummary.invalidate();
      setImportOpen(false);
      toast.success(`${data.successCount} receitas importadas com sucesso!`);
      if (data.errorCount > 0) {
        toast.error(`${data.errorCount} erros encontrados`);
      }
    },
    onError: (error) => {
      toast.error(`Erro ao importar: ${error.message}`);
    },
  });

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(cents / 100);
  };

  // Filtrar contas principais e subcontas
  const mainAccounts = useMemo(() => {
    return accounts?.filter(a => !a.parentId) || [];
  }, [accounts]);

  const subAccounts = useMemo(() => {
    if (!selectedAccountId) return [];
    return accounts?.filter(a => a.parentId === parseInt(selectedAccountId)) || [];
  }, [accounts, selectedAccountId]);

  // Verificar se a subconta selecionada é "Bovinos" (venda de animais)
  const isBovinos = useMemo(() => {
    if (!selectedSubAccountId) return false;
    const subAccount = accounts?.find(a => a.id === parseInt(selectedSubAccountId));
    return subAccount?.name.toLowerCase().includes('bovino') || false;
  }, [accounts, selectedSubAccountId]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const monthYear = formData.get('monthYear') as string;
    const [year, month] = monthYear.split('-').map(Number);
    
    // Converter do padrão brasileiro (vírgula) para ponto
    const totalAmountStr = (formData.get('totalAmount') as string).replace(/\./g, '').replace(',', '.');
    const totalAmount = Math.round(parseFloat(totalAmountStr) * 100);
    
    // Se for bovinos, quantidade = 0, senão pega do formulário
    let quantityInCents = 0;
    let unitPrice = 0;
    
    if (!isBovinos) {
      const quantityStr = (formData.get('quantity') as string).replace(/\./g, '').replace(',', '.');
      // Armazenar litros em centésimos (ex: 1234.56 L = 123456)
      quantityInCents = Math.round(parseFloat(quantityStr) * 100);
      // Calcular valor unitário: (valor total em centavos * 100) / litros em centésimos
      unitPrice = quantityInCents > 0 ? Math.round((totalAmount * 100) / quantityInCents) : 0;
    }
    const subAccountId = formData.get('subAccountId') as string;

    // Data será o primeiro dia do mês selecionado
    const date = new Date(year, month - 1, 1);
    const safraIdValue = formData.get('safraId') as string;

    if (editingRevenue) {
      updateRevenue.mutate({
        id: editingRevenue.id,
        accountId: parseInt(formData.get('accountId') as string),
        subAccountId: subAccountId ? parseInt(subAccountId) : undefined,
        safraId: safraIdValue ? parseInt(safraIdValue) : undefined,
        description: `Receita ${format(date, 'MMMM/yyyy', { locale: ptBR })}`,
        quantity: quantityInCents,
        unitPrice,
        totalAmount,
        date,
      });
    } else {
      createRevenue.mutate({
        accountId: parseInt(formData.get('accountId') as string),
        subAccountId: subAccountId ? parseInt(subAccountId) : undefined,
        safraId: safraIdValue ? parseInt(safraIdValue) : undefined,
        description: `Receita ${format(date, 'MMMM/yyyy', { locale: ptBR })}`,
        quantity: quantityInCents,
        unitPrice,
        totalAmount,
        date,
        received: false,
      });
    }
  };

  const getAccountName = (accountId: number) => {
    const account = accounts?.find(a => a.id === accountId);
    return account ? `${account.code} - ${account.name}` : 'Conta não encontrada';
  };

  const handleEdit = (revenue: any) => {
    setEditingRevenue(revenue);
    setSelectedAccountId(revenue.accountId.toString());
    setSelectedSubAccountId(revenue.subAccountId?.toString() || "");
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setEditingRevenue(null);
    setSelectedAccountId("");
    setSelectedSubAccountId("");
  };

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Receitas</CardTitle>
            <div className="flex gap-2">
              <Dialog open={open || !!editingRevenue} onOpenChange={(isOpen) => {
                if (!isOpen) handleCloseDialog();
                else setOpen(true);
              }}>
                <DialogTrigger asChild>
                  <Button className="bg-primary hover:bg-primary/90">
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Receita
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card border-primary/20">
                  <DialogHeader>
                    <DialogTitle>{editingRevenue ? 'Editar Receita' : 'Cadastrar Receita'}</DialogTitle>
                    <DialogDescription>
                      Preencha os dados da receita
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="monthYear">Mês/Ano</Label>
                      <Input
                        id="monthYear"
                        name="monthYear"
                        type="month"
                        defaultValue={editingRevenue ? format(new Date(editingRevenue.date), 'yyyy-MM') : format(new Date(), 'yyyy-MM')}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="safraId">Safra (opcional)</Label>
                      <Select name="safraId" defaultValue={editingRevenue?.safraId?.toString()}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a safra" />
                        </SelectTrigger>
                        <SelectContent>
                          {safras?.map((safra) => (
                            <SelectItem key={safra.id} value={safra.id.toString()}>
                              {safra.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="accountId">Centro de Custo</Label>
                      <Select 
                        name="accountId" 
                        required
                        defaultValue={editingRevenue?.accountId.toString()}
                        onValueChange={(value) => setSelectedAccountId(value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a conta" />
                        </SelectTrigger>
                        <SelectContent>
                          {mainAccounts.map((account) => (
                            <SelectItem key={account.id} value={account.id.toString()}>
                              {account.code} - {account.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                      {subAccounts.length > 0 && (
                      <div className="space-y-2">
                        <Label htmlFor="subAccountId">Subcentro (opcional)</Label>
                        <Select 
                          name="subAccountId" 
                          defaultValue={editingRevenue?.subAccountId?.toString()}
                          onValueChange={(value) => setSelectedSubAccountId(value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a subconta" />
                          </SelectTrigger>
                          <SelectContent>
                            {subAccounts.map((account) => (
                              <SelectItem key={account.id} value={account.id.toString()}>
                                {account.code} - {account.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {isBovinos ? (
                      <div className="space-y-2">
                        <Label htmlFor="totalAmount">Valor Total (R$)</Label>
                        <Input
                          id="totalAmount"
                          name="totalAmount"
                          type="text"
                          placeholder="0,00"
                          defaultValue={editingRevenue ? (editingRevenue.totalAmount / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''}
                          required
                        />
                        <p className="text-xs text-muted-foreground">Venda de animais - sem contagem de litros</p>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="quantity">Quantidade (Litros)</Label>
                            <Input
                              id="quantity"
                              name="quantity"
                              type="text"
                              placeholder="0,00"
                              defaultValue={editingRevenue?.quantity ? (editingRevenue.quantity / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''}
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="totalAmount">Valor Total (R$)</Label>
                            <Input
                              id="totalAmount"
                              name="totalAmount"
                              type="text"
                              placeholder="0,00"
                              defaultValue={editingRevenue ? (editingRevenue.totalAmount / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''}
                              required
                            />
                          </div>
                        </div>

                        <div className="text-sm text-muted-foreground">
                          Valor unitário será calculado automaticamente
                        </div>
                      </>
                    )}

                    <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
                      {editingRevenue ? 'Atualizar' : 'Cadastrar'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>

              <Dialog open={importOpen} onOpenChange={setImportOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="border-primary/20">
                    <Upload className="w-4 h-4 mr-2" />
                    Importar
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card border-primary/20">
                  <DialogHeader>
                    <DialogTitle>Importar Receitas</DialogTitle>
                    <DialogDescription>
                      Faça upload de um arquivo CSV com as colunas: conta_id, descricao, quantidade, valor_unitario, data, recebido (opcional)
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="importFile">Arquivo CSV</Label>
                      <Input
                        id="importFile"
                        type="file"
                        accept=".csv"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              const text = event.target?.result as string;
                              const lines = text.split('\n').filter(line => line.trim());
                              const revenues = lines.slice(1).map(line => {
                                const [conta_id, descricao, quantidade, valor_unitario, data, recebido] = line.split(',');
                                const quantity = parseInt(quantidade.trim());
                                const unitPrice = Math.round(parseFloat(valor_unitario.trim()) * 100);
                                return {
                                  accountId: parseInt(conta_id.trim()),
                                  description: descricao.trim(),
                                  quantity,
                                  unitPrice,
                                  totalAmount: quantity * unitPrice,
                                  date: new Date(data.trim()),
                                  received: recebido?.trim().toLowerCase() === 'true' || recebido?.trim() === '1',
                                };
                              });
                              importRevenues.mutate({
                                revenues,
                                batchId: `import-${Date.now()}`,
                                fileName: file.name,
                              });
                            };
                            reader.readAsText(file);
                          }
                        }}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p><strong>Formato esperado:</strong></p>
                      <p>conta_id,descricao,quantidade,valor_unitario,data,recebido</p>
                      <p>1,Venda de leite,1000,2.50,2025-10-15,true</p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : revenues && revenues.length > 0 ? (
            <div className="space-y-2">
              {revenues.map((revenue) => (
                <div
                  key={revenue.id}
                  className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg border border-primary/10 hover:border-primary/30 transition-colors"
                >
                  <div className="flex-1">
                    <div className="font-medium text-foreground">
                      {getAccountName(revenue.accountId)}
                      {revenue.subAccountId && (
                        <span className="text-muted-foreground"> → {getAccountName(revenue.subAccountId)}</span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(revenue.date), "MMMM/yyyy", { locale: ptBR })} {revenue.quantity > 0 && `• ${(revenue.quantity / 100).toFixed(2)} L`}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-bold text-green-400">{formatCurrency(revenue.totalAmount)}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatCurrency(revenue.unitPrice)}/L
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(revenue)}
                        className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteRevenue.mutate({ id: revenue.id })}
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma receita cadastrada
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

