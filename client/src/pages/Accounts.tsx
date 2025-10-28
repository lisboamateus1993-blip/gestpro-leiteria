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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, ChevronRight, Edit } from "lucide-react";
import { toast } from "sonner";

type Account = {
  id: number;
  code: string;
  name: string;
  type: "receita" | "despesa";
  parentId?: number | null;
  active: boolean;
};

export default function Accounts() {
  const [open, setOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const utils = trpc.useUtils();

  const { data: accounts, isLoading } = trpc.accounts.list.useQuery();

  const createAccount = trpc.accounts.create.useMutation({
    onSuccess: () => {
      utils.accounts.list.invalidate();
      setOpen(false);
      toast.success("Conta cadastrada com sucesso!");
    },
    onError: (error) => {
      toast.error(`Erro ao cadastrar conta: ${error.message}`);
    },
  });

  const updateAccount = trpc.accounts.update.useMutation({
    onSuccess: () => {
      utils.accounts.list.invalidate();
      setEditingAccount(null);
      toast.success("Conta atualizada com sucesso!");
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar conta: ${error.message}`);
    },
  });

  const deleteAccount = trpc.accounts.delete.useMutation({
    onSuccess: () => {
      utils.accounts.list.invalidate();
      toast.success("Conta excluída com sucesso!");
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const parentIdValue = formData.get('parentId') as string;

    if (editingAccount) {
      updateAccount.mutate({
        id: editingAccount.id,
        code: formData.get('code') as string,
        name: formData.get('name') as string,
        type: formData.get('type') as "receita" | "despesa",
        parentId: parentIdValue && parentIdValue !== '' ? parseInt(parentIdValue) : undefined,
      });
    } else {
      createAccount.mutate({
        code: formData.get('code') as string,
        name: formData.get('name') as string,
        type: formData.get('type') as "receita" | "despesa",
        parentId: parentIdValue && parentIdValue !== '' ? parseInt(parentIdValue) : undefined,
        active: true,
      });
    }
  };

  const handleEdit = (account: any) => {
    setEditingAccount(account);
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setEditingAccount(null);
  };

  // Organizar contas em hierarquia
  const organizeHierarchy = (accountsList: typeof accounts) => {
    if (!accountsList) return { receitas: [], despesas: [] };

    const receitaAccounts = accountsList.filter(a => a.type === 'receita');
    const despesaAccounts = accountsList.filter(a => a.type === 'despesa');

    const buildTree = (accs: typeof accountsList) => {
      const parents = accs.filter(a => !a.parentId);
      return parents.map(parent => ({
        ...parent,
        children: accs.filter(a => a.parentId === parent.id),
      }));
    };

    return {
      receitas: buildTree(receitaAccounts),
      despesas: buildTree(despesaAccounts),
    };
  };

  const { receitas, despesas } = organizeHierarchy(accounts);

  const AccountItem = ({ account, isChild = false }: { account: any; isChild?: boolean }) => (
    <div className={isChild ? 'ml-6' : ''}>
      <div
        className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
          account.type === 'receita'
            ? 'bg-green-900/10 border-green-500/20 hover:border-green-500/40'
            : 'bg-red-900/10 border-red-500/20 hover:border-red-500/40'
        }`}
      >
        <div className="flex items-center gap-2">
          {isChild && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
          <div>
            <div className="font-medium text-foreground">
              {account.code} - {account.name}
            </div>
            {isChild && (
              <div className="text-xs text-muted-foreground">Subconta</div>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleEdit(account)}
            className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => deleteAccount.mutate({ id: account.id })}
            className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
      {account.children && account.children.length > 0 && (
        <div className="mt-2 space-y-2">
          {account.children.map((child: any) => (
            <AccountItem key={child.id} account={child} isChild={true} />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Plano de Contas</CardTitle>
            <Dialog open={open || !!editingAccount} onOpenChange={(isOpen) => {
              if (!isOpen) handleCloseDialog();
              else setOpen(true);
            }}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Conta
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-primary/20">
                <DialogHeader>
                  <DialogTitle>{editingAccount ? 'Editar Conta' : 'Cadastrar Conta'}</DialogTitle>
                  <DialogDescription>
                    {editingAccount ? 'Atualize os dados da conta' : 'Adicione uma nova conta ou subconta ao plano de contas'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Tipo</Label>
                    <Select name="type" required defaultValue={editingAccount?.type}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="receita">Receita</SelectItem>
                        <SelectItem value="despesa">Despesa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="parentId">Conta Pai (opcional)</Label>
                    <Select name="parentId" defaultValue={editingAccount?.parentId?.toString()}>
                      <SelectTrigger>
                        <SelectValue placeholder="Nenhuma (conta principal)" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts?.filter(a => !a.parentId).map((account) => (
                          <SelectItem key={account.id} value={account.id.toString()}>
                            {account.code} - {account.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Deixe vazio para criar uma conta principal, ou selecione uma conta para criar uma subconta
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="code">Código</Label>
                    <Input
                      id="code"
                      name="code"
                      placeholder="Ex: 1.1, 2.1.1, 3.2.1"
                      defaultValue={editingAccount?.code}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name">Nome</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="Nome da conta"
                      defaultValue={editingAccount?.name}
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
                    {editingAccount ? 'Atualizar' : 'Cadastrar'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Contas de Receita */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-green-400 uppercase tracking-wide">
                  Contas de Receita
                </h3>
                {receitas.length > 0 ? (
                  <div className="space-y-2">
                    {receitas.map((account) => (
                      <AccountItem key={account.id} account={account} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground text-sm">
                    Nenhuma conta de receita cadastrada
                  </div>
                )}
              </div>

              {/* Contas de Despesa */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-red-400 uppercase tracking-wide">
                  Contas de Despesa
                </h3>
                {despesas.length > 0 ? (
                  <div className="space-y-2">
                    {despesas.map((account) => (
                      <AccountItem key={account.id} account={account} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground text-sm">
                    Nenhuma conta de despesa cadastrada
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

