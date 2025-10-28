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

type Expense = {
  id: number;
  accountId: number;
  subAccountId?: number | null;
  safraId?: number | null;
  description: string;
  amount: number;
  month: number;
  year: number;
  date: Date;
  paid: boolean;
};

export default function Expenses() {
  const [open, setOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const utils = trpc.useUtils();

  const { data: expenses, isLoading } = trpc.expenses.list.useQuery();
  const { data: accounts } = trpc.accounts.listByType.useQuery({ type: "despesa" });
  const { data: safras } = trpc.safras.listActive.useQuery();

  const createExpense = trpc.expenses.create.useMutation({
    onSuccess: async () => {
      await utils.expenses.list.invalidate();
      await utils.expenses.listByDateRange.invalidate();
      await utils.reports.financialSummary.invalidate();
      setOpen(false);
      setSelectedAccountId("");
      toast.success("Despesa cadastrada com sucesso!");
    },
    onError: (error) => {
      toast.error(`Erro ao cadastrar despesa: ${error.message}`);
    },
  });

  const updateExpense = trpc.expenses.update.useMutation({
    onSuccess: async () => {
      await utils.expenses.list.invalidate();
      await utils.expenses.listByDateRange.invalidate();
      await utils.reports.financialSummary.invalidate();
      setEditingExpense(null);
      setSelectedAccountId("");
      toast.success("Despesa atualizada com sucesso!");
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar despesa: ${error.message}`);
    },
  });

  const deleteExpense = trpc.expenses.delete.useMutation({
    onSuccess: async () => {
      await utils.expenses.list.invalidate();
      await utils.expenses.listByDateRange.invalidate();
      await utils.reports.financialSummary.invalidate();
      toast.success("Despesa excluída com sucesso!");
    },
  });

  const importExpenses = trpc.expenses.importBatch.useMutation({
    onSuccess: (data) => {
      utils.expenses.list.invalidate();
      utils.reports.financialSummary.invalidate();
      setImportOpen(false);
      toast.success(`${data.successCount} despesas importadas com sucesso!`);
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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const monthYear = formData.get('monthYear') as string;
    const [year, month] = monthYear.split('-').map(Number);
    
    // Converter do padrão brasileiro (vírgula) para ponto
    const amountStr = (formData.get('amount') as string).replace(/\./g, '').replace(',', '.');
    const amount = Math.round(parseFloat(amountStr) * 100);
    const subAccountId = formData.get('subAccountId') as string;

    // Data será o primeiro dia do mês selecionado
    const date = new Date(year, month - 1, 1);

    const safraIdValue = formData.get('safraId') as string;

    if (editingExpense) {
      updateExpense.mutate({
        id: editingExpense.id,
        accountId: parseInt(formData.get('accountId') as string),
        subAccountId: subAccountId ? parseInt(subAccountId) : undefined,
        safraId: safraIdValue ? parseInt(safraIdValue) : undefined,
        description: `Despesa ${format(date, 'MMMM/yyyy', { locale: ptBR })}`,
        amount,
        month,
        year,
        date,
      });
    } else {
      createExpense.mutate({
        accountId: parseInt(formData.get('accountId') as string),
        subAccountId: subAccountId ? parseInt(subAccountId) : undefined,
        safraId: safraIdValue ? parseInt(safraIdValue) : undefined,
        description: `Despesa ${format(date, 'MMMM/yyyy', { locale: ptBR })}`,
        amount,
        month,
        year,
        date,
        paid: false,
      });
    }
  };

  // Agrupar despesas por conta
  const getAccountName = (accountId: number) => {
    const account = accounts?.find(a => a.id === accountId);
    return account ? `${account.code} - ${account.name}` : 'Conta não encontrada';
  };

  const handleEdit = (expense: any) => {
    setEditingExpense(expense);
    setSelectedAccountId(expense.accountId.toString());
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setEditingExpense(null);
    setSelectedAccountId("");
  };

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Despesas/Custos</CardTitle>
            <div className="flex gap-2">
              <Dialog open={open || !!editingExpense} onOpenChange={(isOpen) => {
                if (!isOpen) handleCloseDialog();
                else setOpen(true);
              }}>
                <DialogTrigger asChild>
                  <Button className="bg-primary hover:bg-primary/90">
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Despesa
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card border-primary/20">
                  <DialogHeader>
                    <DialogTitle>{editingExpense ? 'Editar Despesa' : 'Cadastrar Despesa'}</DialogTitle>
                    <DialogDescription>
                      Preencha os dados da despesa/custo
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="monthYear">Mês/Ano</Label>
                      <Input
                        id="monthYear"
                        name="monthYear"
                        type="month"
                        defaultValue={editingExpense ? `${editingExpense.year}-${String(editingExpense.month).padStart(2, '0')}` : format(new Date(), 'yyyy-MM')}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="safraId">Safra (opcional)</Label>
                      <Select name="safraId" defaultValue={editingExpense?.safraId?.toString()}>
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
                        defaultValue={editingExpense?.accountId.toString()}
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
                        <Select name="subAccountId" defaultValue={editingExpense?.subAccountId?.toString()}>
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

                    <div className="space-y-2">
                      <Label htmlFor="amount">Valor (R$)</Label>
                      <Input
                        id="amount"
                        name="amount"
                        type="text"
                        placeholder="0,00"
                        defaultValue={editingExpense ? (editingExpense.amount / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''}
                        required
                      />
                    </div>

                    <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
                      {editingExpense ? 'Atualizar' : 'Cadastrar'}
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
                    <DialogTitle>Importar Despesas</DialogTitle>
                    <DialogDescription>
                      Faça upload de um arquivo CSV com as colunas: conta_id, descricao, valor, data, pago (opcional)
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
                              const expenses = lines.slice(1).map(line => {
                                const [conta_id, descricao, valor, data, pago] = line.split(',');
                                const dateObj = new Date(data.trim());
                                return {
                                  accountId: parseInt(conta_id.trim()),
                                  description: descricao.trim(),
                                  amount: Math.round(parseFloat(valor.trim()) * 100),
                                  month: dateObj.getMonth() + 1,
                                  year: dateObj.getFullYear(),
                                  date: dateObj,
                                  paid: pago?.trim().toLowerCase() === 'true' || pago?.trim() === '1',
                                };
                              });
                              importExpenses.mutate({
                                expenses,
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
                      <p>conta_id,descricao,valor,data,pago</p>
                      <p>1,Ração,150.50,2025-10-15,true</p>
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
          ) : expenses && expenses.length > 0 ? (
            <div className="space-y-2">
              {expenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg border border-primary/10 hover:border-primary/30 transition-colors"
                >
                  <div className="flex-1">
                    <div className="font-medium text-foreground">
                      {getAccountName(expense.accountId)}
                      {expense.subAccountId && (
                        <span className="text-muted-foreground"> → {getAccountName(expense.subAccountId)}</span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(expense.date), "MMMM/yyyy", { locale: ptBR })}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-bold text-red-400">{formatCurrency(expense.amount)}</div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(expense)}
                        className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteExpense.mutate({ id: expense.id })}
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
              Nenhuma despesa cadastrada
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

