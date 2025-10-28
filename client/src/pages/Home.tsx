import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { APP_TITLE } from "@/const";
import { DollarSign, TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import ExpensesPage from "./Expenses";
import RevenuesPage from "./Revenues";
import AccountsPage from "./Accounts";
import ReportsPage from "./Reports";
import SafrasPage from "./Safras";
import InvestmentsPage from "./Investments";

export default function Home() {
  const [startDate] = useState(() => {
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
  
  const [endDate] = useState(() => {
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

  // Buscar resumo financeiro
  const { data: summary, isLoading } = trpc.reports.financialSummary.useQuery(
    {
      startDate,
      endDate,
    },
    {
      refetchInterval: 3000, // Atualiza a cada 3 segundos
      refetchOnWindowFocus: true,
    }
  );

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(cents / 100);
  };

  const saldo = summary?.saldo || 0;
  const saldoPositivo = saldo >= 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-primary/20 bg-card/50 backdrop-blur-sm shadow-lg">
        <div className="container py-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary/70 rounded-2xl flex items-center justify-center shadow-xl shadow-primary/20">
              <DollarSign className="w-8 h-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">{APP_TITLE}</h1>
              <p className="text-sm text-muted-foreground">Controle Financeiro Profissional</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-green-500/30 bg-gradient-to-br from-green-900/20 to-card shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-green-400 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Receitas do Mês
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-300">
                {isLoading ? "..." : formatCurrency(summary?.totalReceitas || 0)}
              </div>
              <p className="text-xs text-green-400/70 mt-2">
                {startDate.toLocaleDateString('pt-BR')} - {endDate.toLocaleDateString('pt-BR')}
              </p>
            </CardContent>
          </Card>

          <Card className="border-red-500/30 bg-gradient-to-br from-red-900/20 to-card shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-red-400 flex items-center gap-2">
                <TrendingDown className="w-4 h-4" />
                Despesas do Mês
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-300">
                {isLoading ? "..." : formatCurrency(summary?.totalDespesas || 0)}
              </div>
              <p className="text-xs text-red-400/70 mt-2">
                {startDate.toLocaleDateString('pt-BR')} - {endDate.toLocaleDateString('pt-BR')}
              </p>
            </CardContent>
          </Card>

          <Card className={`shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02] ${saldoPositivo ? 'border-blue-500/30 bg-gradient-to-br from-blue-900/20 to-card' : 'border-orange-500/30 bg-gradient-to-br from-orange-900/20 to-card'}`}>
            <CardHeader className="pb-3">
              <CardTitle className={`text-sm font-medium flex items-center gap-2 ${saldoPositivo ? 'text-blue-400' : 'text-orange-400'}`}>
                <DollarSign className="w-4 h-4" />
                Saldo do Mês
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${saldoPositivo ? 'text-blue-300' : 'text-orange-300'}`}>
                {isLoading ? "..." : formatCurrency(saldo)}
              </div>
              <p className={`text-xs mt-2 ${saldoPositivo ? 'text-blue-400/70' : 'text-orange-400/70'}`}>
                {saldoPositivo ? '✓ Positivo' : '⚠ Negativo'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs de Navegação */}
        <Tabs defaultValue="reports" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 bg-card/50 border border-primary/20 shadow-lg backdrop-blur-sm h-12">
            <TabsTrigger 
              value="reports" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Relatórios
            </TabsTrigger>
            <TabsTrigger 
              value="expenses" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all"
            >
              <TrendingDown className="w-4 h-4 mr-2" />
              Despesas
            </TabsTrigger>
            <TabsTrigger 
              value="revenues" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Receitas
            </TabsTrigger>
            <TabsTrigger 
              value="accounts" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all"
            >
              Centros de Custo
            </TabsTrigger>
            <TabsTrigger 
              value="safras" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all"
            >
              Safras
            </TabsTrigger>

          </TabsList>

          <TabsContent value="reports">
            <ReportsPage />
          </TabsContent>

          <TabsContent value="expenses">
            <ExpensesPage />
          </TabsContent>

          <TabsContent value="revenues">
            <RevenuesPage />
          </TabsContent>

          <TabsContent value="accounts">
            <AccountsPage />
          </TabsContent>

          <TabsContent value="safras">
            <SafrasPage />
          </TabsContent>


        </Tabs>
      </main>
    </div>
  );
}

