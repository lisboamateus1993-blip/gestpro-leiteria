import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon, TrendingUp, TrendingDown, DollarSign, ChevronDown } from "lucide-react";
import { MultiSelectFilter } from "@/components/MultiSelectFilter";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export default function Reports() {
  const [startDate, setStartDate] = useState<Date>(() => {
    const date = new Date();
    const currentMonth = date.getMonth();
    // Se estamos entre janeiro e maio, o ano fiscal começou em junho do ano passado
    // Se estamos entre junho e dezembro, o ano fiscal começou em junho deste ano
    if (currentMonth < 5) {
      date.setFullYear(date.getFullYear() - 1);
    }
    date.setMonth(5); // Junho
    date.setDate(1);
    date.setHours(0, 0, 0, 0); // Meia-noite
    return date;
  });
  
  const [endDate, setEndDate] = useState<Date>(() => {
    const date = new Date();
    const currentMonth = date.getMonth();
    // Se estamos entre janeiro e maio, o ano fiscal termina em maio deste ano
    // Se estamos entre junho e dezembro, o ano fiscal termina em maio do próximo ano
    if (currentMonth >= 5) {
      date.setFullYear(date.getFullYear() + 1);
    }
    date.setMonth(4); // Maio
    date.setDate(31);
    date.setHours(23, 59, 59, 999); // Fim do dia
    return date;
  });

  const [selectedAccountIds, setSelectedAccountIds] = useState<number[]>([]);
  const [selectedSubAccountIds, setSelectedSubAccountIds] = useState<number[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>("all");

  // Buscar dados
  const { data: summary } = trpc.reports.financialSummary.useQuery({
    startDate,
    endDate,
  });

  const { data: revenues } = trpc.revenues.listByDateRange.useQuery({
    startDate,
    endDate,
  });

  const { data: expenses } = trpc.expenses.listByDateRange.useQuery({
    startDate,
    endDate,
  });

  const { data: accounts } = trpc.accounts.list.useQuery();
  const { data: safras } = trpc.safras.list.useQuery();

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(cents / 100);
  };

  // Filtrar receitas e despesas por centro/subcentro e mês
  const filteredRevenues = useMemo(() => {
    if (!revenues) return [];
    return revenues.filter(rev => {
      // Filtro por centro
      if (selectedAccountIds.length > 0 && !selectedAccountIds.includes(rev.accountId)) return false;
      // Filtro por subcentro
      if (selectedSubAccountIds.length > 0 && rev.subAccountId && !selectedSubAccountIds.includes(rev.subAccountId)) return false;
      // Filtro por mês
      if (selectedMonth !== "all") {
        const revMonth = format(new Date(rev.date), 'yyyy-MM');
        if (revMonth !== selectedMonth) return false;
      }
      return true;
    });
  }, [revenues, selectedAccountIds, selectedSubAccountIds, selectedMonth]);

  const filteredExpenses = useMemo(() => {
    if (!expenses) return [];
    return expenses.filter(exp => {
      // Filtro por centro
      if (selectedAccountIds.length > 0 && !selectedAccountIds.includes(exp.accountId)) return false;
      // Filtro por subcentro
      if (selectedSubAccountIds.length > 0 && exp.subAccountId && !selectedSubAccountIds.includes(exp.subAccountId)) return false;
      // Filtro por mês
      if (selectedMonth !== "all") {
        const expMonth = format(new Date(exp.date), 'yyyy-MM');
        if (expMonth !== selectedMonth) return false;
      }
      return true;
    });
  }, [expenses, selectedAccountIds, selectedSubAccountIds, selectedMonth]);

  // Filtrar subcontas com base nos centros selecionados
  const availableSubAccounts = useMemo(() => {
    if (!accounts || selectedAccountIds.length === 0) return [];
    return accounts.filter(a => a.parentId && selectedAccountIds.includes(a.parentId));
  }, [accounts, selectedAccountIds]);

  // Gerar lista de meses no período
  const availableMonths = useMemo(() => {
    const months: { value: string; label: string }[] = [];
    const current = new Date(startDate);
    const end = new Date(endDate);
    
    while (current <= end) {
      months.push({
        value: format(current, 'yyyy-MM'),
        label: format(current, 'MMMM/yyyy', { locale: ptBR }),
      });
      current.setMonth(current.getMonth() + 1);
    }
    
    return months;
  }, [startDate, endDate]);

  // Calcular totais de litros (dividir por 100 pois está em centésimos)
  const totalLitros = useMemo(() => {
    if (!filteredRevenues) return 0;
    return filteredRevenues.reduce((sum, rev) => sum + (rev.quantity || 0), 0) / 100;
  }, [filteredRevenues]);

  const receitaTotal = useMemo(() => {
    return filteredRevenues.reduce((sum, rev) => sum + rev.totalAmount, 0);
  }, [filteredRevenues]);

  const custoTotal = useMemo(() => {
    return filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  }, [filteredExpenses]);
  const resultadoTotal = receitaTotal - custoTotal;
  
  const receitaPorLitro = totalLitros > 0 ? receitaTotal / totalLitros : 0;
  const custoPorLitro = totalLitros > 0 ? custoTotal / totalLitros : 0;
  const resultadoPorLitro = totalLitros > 0 ? resultadoTotal / totalLitros : 0;
  const margemPercentual = receitaTotal > 0 ? (resultadoTotal / receitaTotal) * 100 : 0;

  // 1. Evolução Mensal - Receitas vs Despesas
  const evolutionData = useMemo(() => {
    if (!filteredRevenues || !filteredExpenses) return [];

    const monthlyData = new Map<string, { receitas: number; despesas: number; litros: number }>();

    filteredRevenues.forEach(rev => {
      const date = new Date(rev.date);
      const monthKey = format(date, 'yyyy-MM');
      const monthLabel = format(date, 'MMM/yy', { locale: ptBR });
      const current = monthlyData.get(monthKey) || { receitas: 0, despesas: 0, litros: 0 };
      current.receitas += rev.totalAmount;
      current.litros += rev.quantity || 0;
      monthlyData.set(monthKey, current);
    });

    filteredExpenses.forEach(exp => {
      const date = new Date(exp.date);
      const monthKey = format(date, 'yyyy-MM');
      const current = monthlyData.get(monthKey) || { receitas: 0, despesas: 0, litros: 0 };
      current.despesas += exp.amount;
      monthlyData.set(monthKey, current);
    });

    return Array.from(monthlyData.entries())
      .map(([monthKey, data]) => ({
        monthKey,
        mes: format(new Date(monthKey + '-01'), 'MMM/yy', { locale: ptBR }),
        receitas: data.receitas / 100,
        despesas: data.despesas / 100,
        resultado: (data.receitas - data.despesas) / 100,
        litros: data.litros / 100,
        receitaPorLitro: data.litros > 0 ? (data.receitas / 100) / (data.litros / 100) : 0,
        custoPorLitro: data.litros > 0 ? (data.despesas / 100) / (data.litros / 100) : 0,
        resultadoPorLitro: data.litros > 0 ? ((data.receitas - data.despesas) / 100) / (data.litros / 100) : 0,
        margem: data.receitas > 0 ? ((data.receitas - data.despesas) / data.receitas) * 100 : 0,
      }))
      .sort((a, b) => a.monthKey.localeCompare(b.monthKey));
  }, [filteredRevenues, filteredExpenses]);

  // 2. Distribuição de Despesas por Centro de Custo
  const expensesByAccount = useMemo(() => {
    if (!filteredExpenses || !accounts) return [];

    const distribution = new Map<number, number>();
    
    filteredExpenses.forEach(exp => {
      const current = distribution.get(exp.accountId) || 0;
      distribution.set(exp.accountId, current + exp.amount);
    });

    return Array.from(distribution.entries())
      .map(([accountId, total]) => {
        const account = accounts.find(a => a.id === accountId);
        return {
          name: account ? `${account.code} - ${account.name}` : 'Desconhecido',
          value: total / 100,
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 8); // Top 8
  }, [filteredExpenses, accounts]);

  // 3. Distribuição de Receitas por Centro de Custo
  const revenuesByAccount = useMemo(() => {
    if (!filteredRevenues || !accounts) return [];

    const distribution = new Map<number, number>();
    
    filteredRevenues.forEach(rev => {
      const current = distribution.get(rev.accountId) || 0;
      distribution.set(rev.accountId, current + rev.totalAmount);
    });

    return Array.from(distribution.entries())
      .map(([accountId, total]) => {
        const account = accounts.find(a => a.id === accountId);
        return {
          name: account ? `${account.code} - ${account.name}` : 'Desconhecido',
          value: total / 100,
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 8); // Top 8
  }, [filteredRevenues, accounts]);

  // 4. Distribuição de Despesas por Subcentro
  const expensesBySubAccount = useMemo(() => {
    if (!filteredExpenses || !accounts) return [];

    const distribution = new Map<number, number>();
    
    filteredExpenses.forEach(exp => {
      if (!exp.subAccountId) return; // Apenas subcontas
      const current = distribution.get(exp.subAccountId) || 0;
      distribution.set(exp.subAccountId, current + exp.amount);
    });

    return Array.from(distribution.entries())
      .map(([subAccountId, total]) => {
        const subAccount = accounts.find(a => a.id === subAccountId);
        const parentAccount = subAccount?.parentId ? accounts.find(a => a.id === subAccount.parentId) : null;
        return {
          name: subAccount ? `${subAccount.code} - ${subAccount.name}` : 'Desconhecido',
          parent: parentAccount ? `${parentAccount.code} - ${parentAccount.name}` : '',
          value: total / 100,
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Top 10
  }, [filteredExpenses, accounts]);

  // 5. Distribuição de Receitas por Subcentro
  const revenuesBySubAccount = useMemo(() => {
    if (!filteredRevenues || !accounts) return [];

    const distribution = new Map<number, number>();
    
    filteredRevenues.forEach(rev => {
      if (!rev.subAccountId) return; // Apenas subcontas
      const current = distribution.get(rev.subAccountId) || 0;
      distribution.set(rev.subAccountId, current + rev.totalAmount);
    });

    return Array.from(distribution.entries())
      .map(([subAccountId, total]) => {
        const subAccount = accounts.find(a => a.id === subAccountId);
        const parentAccount = subAccount?.parentId ? accounts.find(a => a.id === subAccount.parentId) : null;
        return {
          name: subAccount ? `${subAccount.code} - ${subAccount.name}` : 'Desconhecido',
          parent: parentAccount ? `${parentAccount.code} - ${parentAccount.name}` : '',
          value: total / 100,
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Top 10
  }, [filteredRevenues, accounts]);

  // 6. Comparativo por Safra
  const safraComparison = useMemo(() => {
    if (!filteredRevenues || !filteredExpenses || !safras) return [];

    const safraData = new Map<number, { receitas: number; despesas: number; litros: number }>();

    filteredRevenues.forEach(rev => {
      if (!rev.safraId) return;
      const current = safraData.get(rev.safraId) || { receitas: 0, despesas: 0, litros: 0 };
      current.receitas += rev.totalAmount;
      current.litros += rev.quantity || 0;
      safraData.set(rev.safraId, current);
    });

    filteredExpenses.forEach(exp => {
      if (!exp.safraId) return;
      const current = safraData.get(exp.safraId) || { receitas: 0, despesas: 0, litros: 0 };
      current.despesas += exp.amount;
      safraData.set(exp.safraId, current);
    });

    return Array.from(safraData.entries())
      .map(([safraId, data]) => {
        const safra = safras.find(s => s.id === safraId);
        return {
          safra: safra?.name || 'Desconhecida',
          receitas: data.receitas / 100,
          despesas: data.despesas / 100,
          resultado: (data.receitas - data.despesas) / 100,
        };
      })
      .sort((a, b) => b.resultado - a.resultado);
  }, [filteredRevenues, filteredExpenses, safras]);

  // 5. Tendência Acumulada
  const cumulativeData = useMemo(() => {
    let accumulated = 0;
    return evolutionData.map(item => {
      accumulated += item.resultado;
      return {
        mes: item.mes,
        acumulado: accumulated,
      };
    });
  }, [evolutionData]);

  return (
    <div className="space-y-6">
      {/* Seletor de Período */}
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            Período de Análise
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4 items-center flex-wrap">
              <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "dd/MM/yyyy", { locale: ptBR }) : "Data inicial"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => date && setStartDate(date)}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>

            <span>até</span>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "dd/MM/yyyy", { locale: ptBR }) : "Data final"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={(date) => date && setEndDate(date)}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
            </div>

            <div className="flex gap-4 items-center flex-wrap">
              <MultiSelectFilter
                label="Centros de Custo"
                options={accounts?.filter(a => !a.parentId).map(a => ({
                  id: a.id,
                  label: `${a.code} - ${a.name}`,
                })) || []}
                selectedIds={selectedAccountIds}
                onChange={(ids) => {
                  setSelectedAccountIds(ids);
                  // Limpar subcentros se não houver centros selecionados
                  if (ids.length === 0) {
                    setSelectedSubAccountIds([]);
                  } else {
                    // Remover subcentros que não pertencem aos centros selecionados
                    setSelectedSubAccountIds(prev => 
                      prev.filter(subId => {
                        const sub = accounts?.find(a => a.id === subId);
                        return sub?.parentId && ids.includes(sub.parentId);
                      })
                    );
                  }
                }}
              />

              {availableSubAccounts.length > 0 && (
                <MultiSelectFilter
                  label="Subcentros"
                  options={availableSubAccounts.map(a => ({
                    id: a.id,
                    label: `${a.code} - ${a.name}`,
                  }))}
                  selectedIds={selectedSubAccountIds}
                  onChange={setSelectedSubAccountIds}
                />
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Mês</label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Todos os meses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os meses</SelectItem>
                    {availableMonths.map(month => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-green-500/30 bg-gradient-to-br from-green-900/20 to-green-800/10">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-green-400">
                <TrendingUp className="w-5 h-5" />
                <span className="text-sm font-medium">Receita Total</span>
              </div>
              <div className="text-3xl font-bold text-green-300">
                {formatCurrency(receitaTotal)}
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-green-400/70">Por Litro</span>
                <span className="text-sm font-semibold text-green-300">
                  {formatCurrency(receitaPorLitro)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-green-400/70">Total Litros</span>
                <span className="text-sm font-semibold text-green-300">
                  {totalLitros.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} L
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-500/30 bg-gradient-to-br from-red-900/20 to-red-800/10">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-red-400">
                <TrendingDown className="w-5 h-5" />
                <span className="text-sm font-medium">Custo Total</span>
              </div>
              <div className="text-3xl font-bold text-red-300">
                {formatCurrency(custoTotal)}
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-red-400/70">Por Litro</span>
                <span className="text-sm font-semibold text-red-300">
                  {formatCurrency(custoPorLitro)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-red-400/70">Total Despesas</span>
                <span className="text-sm font-semibold text-red-300">
                  {summary?.totalDespesas ? (expenses?.length || 0) : 0} lançamentos
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={cn(
          "border-blue-500/30 bg-gradient-to-br",
          resultadoTotal >= 0 
            ? "from-blue-900/20 to-blue-800/10" 
            : "from-orange-900/20 to-orange-800/10"
        )}>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className={cn(
                "flex items-center gap-2",
                resultadoTotal >= 0 ? "text-blue-400" : "text-orange-400"
              )}>
                <DollarSign className="w-5 h-5" />
                <span className="text-sm font-medium">Resultado</span>
              </div>
              <div className={cn(
                "text-3xl font-bold",
                resultadoTotal >= 0 ? "text-blue-300" : "text-orange-300"
              )}>
                {formatCurrency(resultadoTotal)}
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className={resultadoTotal >= 0 ? "text-blue-400/70" : "text-orange-400/70"}>
                  Por Litro
                </span>
                <span className={cn(
                  "text-sm font-semibold",
                  resultadoTotal >= 0 ? "text-blue-300" : "text-orange-300"
                )}>
                  {formatCurrency(resultadoPorLitro)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className={cn(
                  "text-xs",
                  resultadoTotal >= 0 ? "text-blue-400/70" : "text-orange-400/70"
                )}>
                  Margem %
                </span>
                <span className={cn(
                  "text-sm font-semibold",
                  resultadoTotal >= 0 ? "text-blue-300" : "text-orange-300"
                )}>
                  {margemPercentual.toFixed(2)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-500/30 bg-gradient-to-br from-purple-900/20 to-purple-800/10">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-purple-400">
                <TrendingUp className="w-5 h-5" />
                <span className="text-sm font-medium">Ponto de Equilíbrio</span>
              </div>
              <div className="text-3xl font-bold text-purple-300">
                {(() => {
                  const pontoEquilibrio = receitaPorLitro > 0 ? custoTotal / receitaPorLitro : 0;
                  return pontoEquilibrio.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                })()} L
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-purple-400/70">Litros necessários</span>
                <span className="text-sm font-semibold text-purple-300">
                  para cobrir custos
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-purple-400/70">Produzido</span>
                <span className={cn(
                  "text-sm font-semibold",
                  totalLitros >= (receitaPorLitro > 0 ? custoTotal / receitaPorLitro : 0) ? "text-green-400" : "text-orange-400"
                )}>
                  {totalLitros.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} L
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Evolução Mensal - Receitas vs Despesas */}
        <Card className="border-primary/20 bg-card/50">
          <CardHeader>
            <CardTitle className="text-base">Evolução Mensal - Receitas vs Despesas</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={evolutionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="mes" stroke="#9ca3af" style={{ fontSize: '12px' }} />
                <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                  formatter={(value: number) => formatCurrency(value * 100)}
                />
                <Legend />
                <Bar dataKey="receitas" name="Receitas" fill="#10b981" />
                <Bar dataKey="despesas" name="Despesas" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 2. Produção Mensal (Litros) */}
        <Card className="border-primary/20 bg-card/50">
          <CardHeader>
            <CardTitle className="text-base">Produção Mensal (Litros)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={evolutionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="mes" stroke="#9ca3af" style={{ fontSize: '12px' }} />
                <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                  formatter={(value: number) => `${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} L`}
                />
                <Legend />
                <Line type="monotone" dataKey="litros" name="Litros" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 3. Análise por Litro (Receita, Custo e Resultado) */}
        <Card className="border-primary/20 bg-card/50">
          <CardHeader>
            <CardTitle className="text-base">Análise por Litro - Receita, Custo e Resultado</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={evolutionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="mes" stroke="#9ca3af" style={{ fontSize: '12px' }} />
                <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                  formatter={(value: number) => formatCurrency(value * 100)}
                />
                <Legend />
                <Line type="monotone" dataKey="receitaPorLitro" name="Receita/L" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981' }} />
                <Line type="monotone" dataKey="custoPorLitro" name="Custo/L" stroke="#ef4444" strokeWidth={2} dot={{ fill: '#ef4444' }} />
                <Line type="monotone" dataKey="resultadoPorLitro" name="Resultado/L" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: '#8b5cf6' }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 4. Margem Percentual */}
        <Card className="border-primary/20 bg-card/50">
          <CardHeader>
            <CardTitle className="text-base">Margem Percentual (%)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={evolutionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="mes" stroke="#9ca3af" style={{ fontSize: '12px' }} />
                <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                  formatter={(value: number) => `${value.toFixed(2)}%`}
                />
                <Legend />
                <Area type="monotone" dataKey="margem" name="Margem %" fill="#14b8a6" stroke="#14b8a6" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 7. Distribuição de Despesas */}
        <Card className="border-primary/20 bg-card/50">
          <CardHeader>
            <CardTitle className="text-base">Distribuição de Despesas por Centro</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={expensesByAccount}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name.split('-')[0].trim()}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {expensesByAccount.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                  formatter={(value: number) => {
                    const custoLitro = totalLitros > 0 ? (value * 100) / totalLitros : 0;
                    return [
                      `${formatCurrency(value * 100)} (${formatCurrency(custoLitro)}/L)`,
                      'Custo'
                    ];
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 8. Distribuição de Receitas */}
        <Card className="border-primary/20 bg-card/50">
          <CardHeader>
            <CardTitle className="text-base">Distribuição de Receitas por Centro</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={revenuesByAccount}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name.split('-')[0].trim()}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {revenuesByAccount.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                  formatter={(value: number) => {
                    const percentual = receitaTotal > 0 ? ((value * 100) / receitaTotal) * 100 : 0;
                    return [
                      `${formatCurrency(value * 100)} (${percentual.toFixed(2)}%)`,
                      'Receita'
                    ];
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 9. Despesas por Subcentro */}
        {expensesBySubAccount.length > 0 && (
          <Card className="border-primary/20 bg-card/50">
            <CardHeader>
              <CardTitle className="text-base">Despesas por Subcentro (Top 10)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={expensesBySubAccount} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis type="number" stroke="#9ca3af" style={{ fontSize: '12px' }} />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    stroke="#9ca3af" 
                    style={{ fontSize: '10px' }} 
                    width={150}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                    formatter={(value: number) => {
                      const custoLitro = totalLitros > 0 ? (value * 100) / totalLitros : 0;
                      return [
                        `${formatCurrency(value * 100)} (${formatCurrency(custoLitro)}/L)`,
                        'Custo'
                      ];
                    }}
                  />
                  <Bar dataKey="value" name="Despesa" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* 10. Receitas por Subcentro */}
        {revenuesBySubAccount.length > 0 && (
          <Card className="border-primary/20 bg-card/50">
            <CardHeader>
              <CardTitle className="text-base">Receitas por Subcentro (Top 10)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={revenuesBySubAccount} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis type="number" stroke="#9ca3af" style={{ fontSize: '12px' }} />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    stroke="#9ca3af" 
                    style={{ fontSize: '10px' }} 
                    width={150}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                    formatter={(value: number) => {
                      const percentual = receitaTotal > 0 ? ((value * 100) / receitaTotal) * 100 : 0;
                      return [
                        `${formatCurrency(value * 100)} (${percentual.toFixed(2)}%)`,
                        'Receita'
                      ];
                    }}
                  />
                  <Bar dataKey="value" name="Receita" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* 11. Comparativo por Safra */}
        {safraComparison.length > 0 && (
          <Card className="border-primary/20 bg-card/50">
            <CardHeader>
              <CardTitle className="text-base">Comparativo por Safra</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={safraComparison} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis type="number" stroke="#9ca3af" style={{ fontSize: '12px' }} />
                  <YAxis type="category" dataKey="safra" stroke="#9ca3af" style={{ fontSize: '12px' }} width={100} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                    formatter={(value: number) => formatCurrency(value * 100)}
                  />
                  <Legend />
                  <Bar dataKey="resultado" name="Resultado" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* 12. Tendência Acumulada */}
        <Card className="border-primary/20 bg-card/50">
          <CardHeader>
            <CardTitle className="text-base">Resultado Acumulado</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={cumulativeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="mes" stroke="#9ca3af" style={{ fontSize: '12px' }} />
                <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                  formatter={(value: number) => formatCurrency(value * 100)}
                />
                <Legend />
                <Area type="monotone" dataKey="acumulado" name="Acumulado" fill="#f59e0b" stroke="#f59e0b" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

