import React, { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface YearData {
  year: number;
  numeroAnimais: number;
  producaoPorAnimalDia: number;
  diasAno: number;
  producao: number; // Calculado automaticamente
  quebraProd: number;
  precoVenda: number;
  custoProducao: number;
  receitasExtras: number;
}

interface AmortizacaoRow {
  mes: number;
  dataVencto: string;
  juros: number;
  principal: number;
  valorParcela: number;
  saldoDevedor: number;
  custoEfetivo: number;
}

interface Investment {
  id: string;
  nome: string;
  valorInvestimento: number;
  taxaJuros: number;
  prazo: number;
  anosCarencia: number;
  anosProjecao: number;
  anoEstudo: number;
  frequenciaPagamento: 'mensal' | 'anual';
  years: YearData[];
  amortizacao: AmortizacaoRow[];
}

export default function Investments() {
  const [investments, setInvestments] = useState<Investment[]>([
    {
      id: '1',
      nome: 'Cenário Base',
      valorInvestimento: 6000000,
      taxaJuros: 16.5,
      prazo: 5,
      anosCarencia: 0,
      anosProjecao: 9,
      anoEstudo: 2025,
      frequenciaPagamento: 'anual',
      years: [
        { year: 2025, numeroAnimais: 215, producaoPorAnimalDia: 33, diasAno: 90, producao: 638550, quebraProd: 0, precoVenda: 3.05, custoProducao: 1.98, receitasExtras: 0 },
        { year: 2026, numeroAnimais: 265, producaoPorAnimalDia: 35, diasAno: 365, producao: 3385375, quebraProd: 0, precoVenda: 3.05, custoProducao: 1.98, receitasExtras: 0 },
        { year: 2027, numeroAnimais: 338, producaoPorAnimalDia: 36, diasAno: 365, producao: 4441320, quebraProd: 0, precoVenda: 3.05, custoProducao: 1.98, receitasExtras: 0 },
        { year: 2028, numeroAnimais: 425, producaoPorAnimalDia: 37, diasAno: 365, producao: 5739625, quebraProd: 0, precoVenda: 3.05, custoProducao: 1.98, receitasExtras: 0 },
        { year: 2029, numeroAnimais: 500, producaoPorAnimalDia: 38, diasAno: 365, producao: 6935000, quebraProd: 0, precoVenda: 3.05, custoProducao: 1.98, receitasExtras: 720000 },
        { year: 2030, numeroAnimais: 500, producaoPorAnimalDia: 39, diasAno: 365, producao: 7117500, quebraProd: 0, precoVenda: 3.05, custoProducao: 1.98, receitasExtras: 2400000 },
        { year: 2031, numeroAnimais: 500, producaoPorAnimalDia: 40, diasAno: 365, producao: 7300000, quebraProd: 0, precoVenda: 3.05, custoProducao: 1.98, receitasExtras: 1995000 },
        { year: 2032, numeroAnimais: 500, producaoPorAnimalDia: 44, diasAno: 365, producao: 8030000, quebraProd: 0, precoVenda: 3.05, custoProducao: 1.98, receitasExtras: 2295000 },
        { year: 2033, numeroAnimais: 500, producaoPorAnimalDia: 45, diasAno: 365, producao: 8212500, quebraProd: 0, precoVenda: 3.05, custoProducao: 1.98, receitasExtras: 2250000 },
      ],
      amortizacao: [],
    }
  ]);

  const [selectedInvestment, setSelectedInvestment] = useState<string>('1');
  const [editMode, setEditMode] = useState<boolean>(true); // Começa em modo de edição
  
  const currentInvestment = investments.find(inv => inv.id === selectedInvestment)!;
  
  // Buscar dados reais do ano de estudo
  const { data: yearData } = trpc.reports.dataByYear.useQuery(
    { year: currentInvestment?.anoEstudo || new Date().getFullYear() },
    { enabled: !!currentInvestment }
  );
  
  // Inicializar anos quando anosProjecao mudar
  useEffect(() => {
    if (currentInvestment && currentInvestment.years.length !== currentInvestment.anosProjecao) {
      initializeYears(currentInvestment.id);
    }
  }, [currentInvestment?.anosProjecao]);

  // Atualizar primeiro ano com dados reais quando chegarem
  useEffect(() => {
    if (yearData && currentInvestment && currentInvestment.years.length > 0) {
      updateYearData(currentInvestment.id, 0, 'precoVenda', yearData.precoVendaMedio || 3.05);
      updateYearData(currentInvestment.id, 0, 'custoProducao', yearData.custoMedioPorLitro || 1.98);
    }
  }, [yearData]);

  const initializeYears = (investmentId: string) => {
    setInvestments(investments.map(inv => {
      if (inv.id !== investmentId) return inv;
      
      const years: YearData[] = [];
      for (let i = 0; i < inv.anosProjecao; i++) {
        years.push({
          year: inv.anoEstudo + i,
          numeroAnimais: 200,
          producaoPorAnimalDia: 8.75,
          diasAno: 365,
          producao: 200 * 8.75 * 365,
          quebraProd: 0,
          precoVenda: 3.05,
          custoProducao: 1.98,
          receitasExtras: 0,
        });
      }
      
      return { ...inv, years };
    }));
  };

  const addInvestment = () => {
    const newId = Date.now().toString();
    setInvestments([...investments, {
      id: newId,
      nome: `Cenário ${investments.length + 1}`,
      valorInvestimento: 6000000,
      taxaJuros: 16.5,
      prazo: 5,
      anosCarencia: 0,
      anosProjecao: 9,
      anoEstudo: new Date().getFullYear(),
      frequenciaPagamento: 'anual',
      years: [],
      amortizacao: [],
    }]);
    setSelectedInvestment(newId);
  };

  const removeInvestment = (id: string) => {
    if (investments.length === 1) return;
    setInvestments(investments.filter(inv => inv.id !== id));
    if (selectedInvestment === id) {
      setSelectedInvestment(investments[0].id);
    }
  };

  const updateInvestment = (id: string, field: keyof Investment, value: any) => {
    setInvestments(investments.map(inv =>
      inv.id === id ? { ...inv, [field]: value } : inv
    ));
  };

  const updateYearData = (investmentId: string, yearIndex: number, field: keyof YearData, value: number) => {
    setInvestments(investments.map(inv => {
      if (inv.id !== investmentId) return inv;
      
      const updatedYears = [...inv.years];
      updatedYears[yearIndex] = {
        ...updatedYears[yearIndex],
        [field]: value,
        // Recalcular produção se mudar animais, produção/dia ou dias do ano
        producao: ['numeroAnimais', 'producaoPorAnimalDia', 'diasAno'].includes(field)
          ? (field === 'numeroAnimais' ? value : updatedYears[yearIndex].numeroAnimais) *
            (field === 'producaoPorAnimalDia' ? value : updatedYears[yearIndex].producaoPorAnimalDia) *
            (field === 'diasAno' ? value : updatedYears[yearIndex].diasAno)
          : updatedYears[yearIndex].producao
      };
      
      return { ...inv, years: updatedYears };
    }));
  };

  // Calcular tabela de amortização (Sistema Price)
  const calculateAmortizacao = (inv: Investment): AmortizacaoRow[] => {
    const amortizacao: AmortizacaoRow[] = [];
    let saldoDevedor = inv.valorInvestimento;
    const dataInicio = new Date(inv.anoEstudo, 0, 1);
    
    if (inv.frequenciaPagamento === 'mensal') {
      // Pagamento mensal
      const taxaMensal = inv.taxaJuros / 100 / 12;
      const numParcelas = inv.prazo * 12;
      const parcela = inv.valorInvestimento * (taxaMensal * Math.pow(1 + taxaMensal, numParcelas)) / (Math.pow(1 + taxaMensal, numParcelas) - 1);
      
      for (let mes = 1; mes <= numParcelas; mes++) {
        const juros = saldoDevedor * taxaMensal;
        const principal = parcela - juros;
        saldoDevedor -= principal;
        
        const dataVencto = new Date(dataInicio);
        dataVencto.setMonth(dataInicio.getMonth() + mes);
        
        const custoEfetivo = parcela * mes;
        
        amortizacao.push({
          mes,
          dataVencto: dataVencto.toLocaleDateString('pt-BR'),
          juros,
          principal,
          valorParcela: parcela,
          saldoDevedor: Math.max(0, saldoDevedor),
          custoEfetivo: custoEfetivo,
        });
      }
    } else {
      // Pagamento anual - Sistema SAC (parcela principal fixa)
      const taxaAnual = inv.taxaJuros / 100;
      const numParcelas = inv.prazo;
      const principal = inv.valorInvestimento / numParcelas; // Parcela principal fixa
      let saldoDevedor = inv.valorInvestimento;
      let custoAcumulado = 0;
      
      for (let ano = 1; ano <= numParcelas; ano++) {
        const juros = saldoDevedor * taxaAnual;
        const valorParcela = principal + juros;
        saldoDevedor -= principal;
        custoAcumulado += valorParcela;
        
        const dataVencto = new Date(dataInicio);
        dataVencto.setFullYear(dataInicio.getFullYear() + ano);
        
        amortizacao.push({
          mes: ano,
          dataVencto: dataVencto.toLocaleDateString('pt-BR'),
          juros,
          principal,
          valorParcela,
          saldoDevedor: Math.max(0, saldoDevedor),
          custoEfetivo: custoAcumulado,
        });
      }
    }
    
    return amortizacao;
  };

  // Calcular TIR (Taxa Interna de Retorno) usando método de Newton-Raphson
  const calculateTIR = (inv: Investment, years: YearData[]): number => {
    const fluxos = years.map((year, index) => {
      const margem = year.precoVenda - year.custoProducao;
      const producaoEfetiva = year.producao * (1 - year.quebraProd / 100);
      const geracaoCaixaBruta = producaoEfetiva * margem;
      
      // Calcular parcela do investimento
      // Pagamento começa após a carência e dura apenas o prazo definido
      const anoInicialPagamento = inv.anosCarencia + 1;
      const anoFinalPagamento = anoInicialPagamento + inv.prazo - 1;
      const estaPagando = index >= anoInicialPagamento && index <= anoFinalPagamento;
      
      // Calcular saldo devedor para juros (Sistema SAC)
      const valorPrincipal = inv.valorInvestimento / inv.prazo;
      const anosPagos = Math.max(0, index - anoInicialPagamento);
      const saldoDevedor = inv.valorInvestimento - (valorPrincipal * anosPagos);
      const juros = estaPagando ? saldoDevedor * (inv.taxaJuros / 100) : 0;
      
      const pagamentoEfetivo = estaPagando ? valorPrincipal : 0;
      
      // FCFE Líquido = Geração - Principal - Juros + Receitas
      return geracaoCaixaBruta - pagamentoEfetivo - juros + year.receitasExtras;
    });
    
    // Fluxo inicial é o investimento negativo
    const fluxosCaixa = [-inv.valorInvestimento, ...fluxos];
    
    // Método de Newton-Raphson para encontrar TIR
    let tir = 0.1; // Chute inicial de 10%
    const maxIteracoes = 100;
    const tolerancia = 0.0001;
    
    for (let i = 0; i < maxIteracoes; i++) {
      let vpl = 0;
      let derivada = 0;
      
      for (let t = 0; t < fluxosCaixa.length; t++) {
        vpl += fluxosCaixa[t] / Math.pow(1 + tir, t);
        if (t > 0) {
          derivada -= t * fluxosCaixa[t] / Math.pow(1 + tir, t + 1);
        }
      }
      
      if (Math.abs(vpl) < tolerancia) {
        return tir * 100; // Retorna em percentual
      }
      
      if (derivada === 0) break;
      tir = tir - vpl / derivada;
      
      // Evitar valores negativos ou muito altos
      if (tir < -0.99) tir = -0.99;
      if (tir > 10) tir = 10;
    }
    
    return tir * 100; // Retorna em percentual
  };

  const calculateFinancials = (inv: Investment, years: YearData[]) => {
    const results = years.map((year, index) => {
      const margem = year.precoVenda - year.custoProducao;
      const producaoEfetiva = year.producao * (1 - year.quebraProd / 100);
      const geracaoCaixaBruta = producaoEfetiva * margem;
      
      // Calcular parcela do investimento
      // Pagamento começa após a carência e dura apenas o prazo definido
      const anoInicialPagamento = inv.anosCarencia + 1; // Ano 1 se carência = 0
      const anoFinalPagamento = anoInicialPagamento + inv.prazo - 1;
      const estaPagando = index >= anoInicialPagamento && index <= anoFinalPagamento;
      
      // Calcular saldo devedor para juros (Sistema SAC)
      const valorPrincipal = inv.valorInvestimento / inv.prazo;
      const anosPagos = Math.max(0, index - anoInicialPagamento);
      const saldoDevedor = inv.valorInvestimento - (valorPrincipal * anosPagos);
      const juros = estaPagando ? saldoDevedor * (inv.taxaJuros / 100) : 0;
      
      const pagamentoEfetivo = estaPagando ? valorPrincipal : 0;
      
      // FCFE Líquido = Geração - Principal - Juros + Receitas
      const geracaoCaixaLiquida = geracaoCaixaBruta - pagamentoEfetivo - juros + year.receitasExtras;
      
      return {
        ...year,
        producaoEfetiva,
        margem,
        geracaoCaixaBruta,
        pagamentoInvestimento: pagamentoEfetivo,
        juros,
        geracaoCaixaLiquida,
      };
    });
    
    // Calcular VPL
    const vpl = results.reduce((sum, r, i) => {
      return sum + r.geracaoCaixaLiquida / Math.pow(1 + inv.taxaJuros / 100, i);
    }, -inv.valorInvestimento);
    
    // Calcular Payback detalhado (com VPL)
    let vplAcumulado = -inv.valorInvestimento;
    let payback = 0;
    let paybackDetalhado = 0;
    for (let i = 0; i < results.length; i++) {
      const vplPeriodo = results[i].geracaoCaixaLiquida / Math.pow(1 + inv.taxaJuros / 100, i);
      const vplAnterior = vplAcumulado;
      vplAcumulado += vplPeriodo;
      if (vplAcumulado >= 0 && payback === 0) {
        payback = i + 1;
        paybackDetalhado = i + Math.abs(vplAnterior) / vplPeriodo;
        break;
      }
    }
    
    // Calcular TIR
    const tir = calculateTIR(inv, years);
    
    return { results, vpl, payback, paybackDetalhado, tir };
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number, decimals = 0) => {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  };

  const financials = currentInvestment && currentInvestment.years.length > 0 
    ? calculateFinancials(currentInvestment, currentInvestment.years) 
    : null;

  const amortizacao = currentInvestment ? calculateAmortizacao(currentInvestment) : [];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Análise de Investimentos</h1>
        <Button onClick={addInvestment} className="gap-2">
          <Plus className="w-4 h-4" />
          Novo Cenário
        </Button>
      </div>

      {/* Abas de cenários */}
      <div className="flex gap-2 flex-wrap">
        {investments.map(inv => (
          <div key={inv.id} className="relative">
            <Button
              variant={selectedInvestment === inv.id ? "default" : "outline"}
              onClick={() => setSelectedInvestment(inv.id)}
              className="pr-8"
            >
              {inv.nome}
            </Button>
            {investments.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeInvestment(inv.id);
                }}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-600"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
      </div>

      {currentInvestment && (
        <>
          {/* Parâmetros Gerais */}
          <Card>
            <CardHeader>
              <CardTitle>Parâmetros Gerais do Investimento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Nome do Cenário</Label>
                  <Input
                    value={currentInvestment.nome}
                    onChange={(e) => updateInvestment(currentInvestment.id, 'nome', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Valor do Investimento (R$)</Label>
                  <Input
                    type="text"
                    value={currentInvestment.valorInvestimento.toLocaleString('pt-BR')}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value.replace(/\./g, '').replace(',', '.')) || 0;
                      updateInvestment(currentInvestment.id, 'valorInvestimento', value);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Taxa de Juros (% a.a.)</Label>
                  <Input
                    type="text"
                    value={currentInvestment.taxaJuros.toString().replace('.', ',')}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value.replace(',', '.')) || 0;
                      updateInvestment(currentInvestment.id, 'taxaJuros', value);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Prazo (anos)</Label>
                  <Input
                    type="number"
                    value={currentInvestment.prazo}
                    onChange={(e) => updateInvestment(currentInvestment.id, 'prazo', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ano de Início do Estudo</Label>
                  <Input
                    type="number"
                    value={currentInvestment.anoEstudo}
                    onChange={(e) => updateInvestment(currentInvestment.id, 'anoEstudo', parseInt(e.target.value) || new Date().getFullYear())}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Anos de Carência</Label>
                  <Input
                    type="number"
                    value={currentInvestment.anosCarencia}
                    onChange={(e) => updateInvestment(currentInvestment.id, 'anosCarencia', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Anos de Projeção</Label>
                  <Input
                    type="number"
                    value={currentInvestment.anosProjecao}
                    onChange={(e) => updateInvestment(currentInvestment.id, 'anosProjecao', parseInt(e.target.value) || 5)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Frequência de Pagamento</Label>
                  <select
                    value={currentInvestment.frequenciaPagamento}
                    onChange={(e) => updateInvestment(currentInvestment.id, 'frequenciaPagamento', e.target.value as 'mensal' | 'anual')}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="mensal">Mensal</option>
                    <option value="anual">Anual</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Valor da Parcela Principal (R$)</Label>
                  <Input
                    type="text"
                    value={(currentInvestment.valorInvestimento / currentInvestment.prazo).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    disabled
                    className="bg-muted/50 cursor-not-allowed"
                  />
                  <p className="text-xs text-muted-foreground">Calculado automaticamente: Investimento ÷ Prazo</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabela Editável de Parâmetros por Ano */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Parâmetros por Ano {editMode ? '(Modo Edição)' : '(Somente Leitura)'}</CardTitle>
                <Button
                  onClick={() => setEditMode(!editMode)}
                  variant={editMode ? "default" : "outline"}
                  className="gap-2"
                >
                  {editMode ? (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Salvar e Bloquear
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                      Editar Parâmetros
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {currentInvestment.years.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b-2 border-border">
                        <th className="text-left p-2 font-medium sticky left-0 bg-background z-10">Descrição</th>
                        <th className="text-center p-2 font-medium">Unidade</th>
                        {currentInvestment.years.map((y) => (
                          <th key={y.year} className="text-center p-2 font-medium min-w-[120px]">{y.year}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-border/50 bg-blue-900/10">
                        <td className="p-2 sticky left-0 bg-background z-10 font-medium">Número de Animais</td>
                        <td className="text-center p-2">un</td>
                        {currentInvestment.years.map((y, i) => (
                          <td key={y.year} className="p-2">
                            <Input
                              type="number"
                              value={y.numeroAnimais}
                              onChange={(e) => updateYearData(currentInvestment.id, i, 'numeroAnimais', parseInt(e.target.value) || 0)}
                              className="h-8 text-right"
                              disabled={!editMode}
                            />
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b border-border/50 bg-blue-900/10">
                        <td className="p-2 sticky left-0 bg-background z-10 font-medium">Produção/Animal/Dia</td>
                        <td className="text-center p-2">L/dia</td>
                        {currentInvestment.years.map((y, i) => (
                          <td key={y.year} className="p-2">
                            <Input
                              type="text"
                              value={y.producaoPorAnimalDia.toString().replace('.', ',')}
                              onChange={(e) => {
                                const value = parseFloat(e.target.value.replace(',', '.')) || 0;
                                updateYearData(currentInvestment.id, i, 'producaoPorAnimalDia', value);
                              }}
                              className="h-8 text-right"
                              disabled={!editMode}
                            />
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b border-border/50 bg-blue-900/10">
                        <td className="p-2 sticky left-0 bg-background z-10 font-medium">Dias do Ano</td>
                        <td className="text-center p-2">dias</td>
                        {currentInvestment.years.map((y, i) => (
                          <td key={y.year} className="p-2">
                            <Input
                              type="number"
                              value={y.diasAno}
                              onChange={(e) => updateYearData(currentInvestment.id, i, 'diasAno', parseInt(e.target.value) || 365)}
                              className="h-8 text-right"
                              disabled={!editMode}
                            />
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="p-2 sticky left-0 bg-background z-10">Produção Ano</td>
                        <td className="text-center p-2">L</td>
                        {currentInvestment.years.map((y) => (
                          <td key={y.year} className="text-right p-2 font-semibold">{formatNumber(y.producao, 0)}</td>
                        ))}
                      </tr>
                      <tr className="border-b border-border/50 bg-yellow-900/10">
                        <td className="p-2 sticky left-0 bg-background z-10 font-medium">Quebra Produção</td>
                        <td className="text-center p-2">%</td>
                        {currentInvestment.years.map((y, i) => (
                          <td key={y.year} className="p-2">
                            <Input
                              type="text"
                              value={y.quebraProd.toString().replace('.', ',')}
                              onChange={(e) => {
                                const value = parseFloat(e.target.value.replace(',', '.')) || 0;
                                updateYearData(currentInvestment.id, i, 'quebraProd', value);
                              }}
                              className="h-8 text-right"
                              disabled={!editMode}
                            />
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b border-border/50 bg-green-900/10">
                        <td className="p-2 sticky left-0 bg-background z-10 font-medium">Preço Venda</td>
                        <td className="text-center p-2">R$/L</td>
                        {currentInvestment.years.map((y, i) => (
                          <td key={y.year} className="p-2">
                            <Input
                              type="text"
                              value={y.precoVenda.toString().replace('.', ',')}
                              onChange={(e) => {
                                const value = parseFloat(e.target.value.replace(',', '.')) || 0;
                                updateYearData(currentInvestment.id, i, 'precoVenda', value);
                              }}
                              className="h-8 text-right"
                              disabled={!editMode}
                            />
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b border-border/50 bg-red-900/10">
                        <td className="p-2 sticky left-0 bg-background z-10 font-medium">Custo Produção</td>
                        <td className="text-center p-2">R$/L</td>
                        {currentInvestment.years.map((y, i) => (
                          <td key={y.year} className="p-2">
                            <Input
                              type="text"
                              value={y.custoProducao.toString().replace('.', ',')}
                              onChange={(e) => {
                                const value = parseFloat(e.target.value.replace(',', '.')) || 0;
                                updateYearData(currentInvestment.id, i, 'custoProducao', value);
                              }}
                              className="h-8 text-right"
                              disabled={!editMode}
                            />
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b border-border/50 bg-purple-900/10">
                        <td className="p-2 sticky left-0 bg-background z-10 font-medium">Receitas Extras</td>
                        <td className="text-center p-2">R$</td>
                        {currentInvestment.years.map((y, i) => (
                          <td key={y.year} className="p-2">
                            <Input
                              type="text"
                              value={y.receitasExtras.toLocaleString('pt-BR')}
                              onChange={(e) => {
                                const value = parseFloat(e.target.value.replace(/\./g, '').replace(',', '.')) || 0;
                                updateYearData(currentInvestment.id, i, 'receitasExtras', value);
                              }}
                              className="h-8 text-right"
                              disabled={!editMode}
                            />
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Defina o número de "Anos de Projeção" acima para criar a tabela editável.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Indicadores */}
          {financials && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className={cn(
                "border-2",
                financials.vpl >= 0 ? "border-green-500/50 bg-green-900/10" : "border-red-500/50 bg-red-900/10"
              )}>
                <CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground">Valor Presente Líquido (VPL)</div>
                  <div className={cn(
                    "text-3xl font-bold mt-2",
                    financials.vpl >= 0 ? "text-green-400" : "text-red-400"
                  )}>
                    {formatCurrency(financials.vpl)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {financials.vpl >= 0 ? "Investimento viável" : "Investimento inviável"}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-blue-500/50 bg-blue-900/10">
                <CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground">Payback</div>
                  <div className="text-3xl font-bold text-blue-400 mt-2">
                    {financials.payback > 0 ? `${financials.payback} anos` : 'N/A'}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Retorno do investimento
                  </div>
                </CardContent>
              </Card>

              <Card className={cn(
                "border-2",
                financials.tir >= currentInvestment.taxaJuros ? "border-green-500/50 bg-green-900/10" : "border-orange-500/50 bg-orange-900/10"
              )}>
                <CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground">TIR - Taxa Interna de Retorno</div>
                  <div className={cn(
                    "text-3xl font-bold mt-2",
                    financials.tir >= currentInvestment.taxaJuros ? "text-green-400" : "text-orange-400"
                  )}>
                    {formatNumber(financials.tir, 2)}%
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {financials.tir >= currentInvestment.taxaJuros ? `TIR > Taxa (${formatNumber(currentInvestment.taxaJuros, 2)}%)` : `TIR < Taxa (${formatNumber(currentInvestment.taxaJuros, 2)}%)`}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-purple-500/50 bg-purple-900/10">
                <CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground">Margem Unitária Média</div>
                  <div className="text-3xl font-bold text-purple-400 mt-2">
                    {formatCurrency(
                      currentInvestment.years.reduce((sum, y) => sum + (y.precoVenda - y.custoProducao), 0) / currentInvestment.years.length
                    )}/L
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Lucro médio por litro
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Tabela de Amortização */}
          {amortizacao.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Tabela de Amortização (Sistema Price)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-background">
                      <tr className="border-b-2 border-border">
                        <th className="text-center p-2 font-medium">{currentInvestment.frequenciaPagamento === 'mensal' ? 'Mês' : 'Ano'}</th>
                        <th className="text-center p-2 font-medium">Data Vencto</th>
                        <th className="text-right p-2 font-medium">Juros</th>
                        <th className="text-right p-2 font-medium">Principal</th>
                        <th className="text-right p-2 font-medium">Valor Parcela</th>
                        <th className="text-right p-2 font-medium">Saldo Devedor</th>
                        <th className="text-right p-2 font-medium">Custo Efetivo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {amortizacao.map((row) => (
                        <tr key={row.mes} className="border-b border-border/50 hover:bg-muted/30">
                          <td className="text-center p-2">{row.mes}</td>
                          <td className="text-center p-2">{row.dataVencto}</td>
                          <td className="text-right p-2 text-red-400">{formatCurrency(row.juros)}</td>
                          <td className="text-right p-2 text-blue-400">{formatCurrency(row.principal)}</td>
                          <td className="text-right p-2 font-semibold">{formatCurrency(row.valorParcela)}</td>
                          <td className="text-right p-2">{formatCurrency(row.saldoDevedor)}</td>
                          <td className="text-right p-2 text-purple-400">{formatCurrency(row.custoEfetivo)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tabela de Detalhamento de Geração de Caixa */}
          {financials && (
            <Card>
              <CardHeader>
                <CardTitle>Detalhamento da Geração de Caixa por Ano</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b-2 border-border bg-muted/50">
                        <th className="text-left p-2 font-medium border-r border-border">Descrição</th>
                        <th className="text-center p-2 font-medium border-r border-border">Unidade</th>
                        {financials.results.map((r) => (
                          <th key={r.year} className="text-center p-2 font-medium border-r border-border">{r.year}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-border/50 bg-blue-900/10">
                        <td className="p-2 border-r border-border/50 font-medium">(-) Margem</td>
                        <td className="text-center p-2 border-r border-border/50">R$/lts</td>
                        {financials.results.map((r) => (
                          <td key={r.year} className="text-right p-2 border-r border-border/50 text-blue-400 font-semibold">
                            {formatNumber(r.margem, 2)}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b border-border/50 bg-green-900/10">
                        <td className="p-2 border-r border-border/50 font-bold">(=) Geração Caixa bruta</td>
                        <td className="text-center p-2 border-r border-border/50">(R$)</td>
                        {financials.results.map((r) => (
                          <td key={r.year} className="text-right p-2 border-r border-border/50 text-green-400 font-bold">
                            {formatCurrency(r.geracaoCaixaBruta)}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b border-border/50 bg-red-900/10">
                        <td className="p-2 border-r border-border/50 font-medium">(-) Pagto investimento (Principal)</td>
                        <td className="text-center p-2 border-r border-border/50">(R$)</td>
                        {financials.results.map((r) => (
                          <td key={r.year} className="text-right p-2 border-r border-border/50 text-red-400 font-semibold">
                            {r.pagamentoInvestimento > 0 ? `(${formatCurrency(r.pagamentoInvestimento)})` : '-'}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b border-border/50 bg-orange-900/10">
                        <td className="p-2 border-r border-border/50 font-medium">(-) Juros do financiamento</td>
                        <td className="text-center p-2 border-r border-border/50">(R$)</td>
                        {financials.results.map((r) => (
                          <td key={r.year} className="text-right p-2 border-r border-border/50 text-orange-400 font-semibold">
                            {r.juros > 0 ? `(${formatCurrency(r.juros)})` : '-'}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b border-border/50 bg-purple-900/10">
                        <td className="p-2 border-r border-border/50 font-medium">(+) Receitas venda animais</td>
                        <td className="text-center p-2 border-r border-border/50">(R$)</td>
                        {financials.results.map((r) => (
                          <td key={r.year} className="text-right p-2 border-r border-border/50 text-purple-400 font-semibold">
                            {r.receitasExtras > 0 ? formatCurrency(r.receitasExtras) : '-'}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b-2 border-border bg-yellow-900/10">
                        <td className="p-2 border-r border-border/50 font-bold">(=) Geração caixa líquida</td>
                        <td className="text-center p-2 border-r border-border/50">(R$)</td>
                        {financials.results.map((r) => (
                          <td key={r.year} className="text-right p-2 border-r border-border/50 text-yellow-400 font-bold">
                            {formatCurrency(r.geracaoCaixaLiquida)}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tabela de Análise FCFE Detalhada */}
          {financials && (
            <Card>
              <CardHeader>
                <CardTitle>Análise de Fluxo de Caixa (FCFE)</CardTitle>
                <div className="mt-4 p-4 bg-green-900/20 border-2 border-green-500/50 rounded-lg">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-sm text-muted-foreground">TIR (Taxa Interna de Retorno)</div>
                      <div className="text-2xl font-bold text-green-400">{formatNumber(financials.tir, 2)}% a.a.</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">VPL (Valor Presente Líquido)</div>
                      <div className="text-2xl font-bold text-green-400">{formatCurrency(financials.vpl)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Pay-back</div>
                      <div className="text-2xl font-bold text-green-400">{financials.payback > 0 ? `${formatNumber(financials.paybackDetalhado, 2)} anos` : 'N/A'}</div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b-2 border-border bg-muted/50">
                        <th className="text-center p-2 font-medium border-r border-border">Período</th>
                        <th className="text-center p-2 font-medium border-r border-border">Ano</th>
                        <th className="text-center p-2 font-medium border-r border-border">Fator<br/>Juros</th>
                        <th className="text-right p-2 font-medium border-r border-border">Investimento<br/>(R$)</th>
                        <th className="text-right p-2 font-medium border-r border-border">Geração<br/>FCFE (R$)</th>
                        <th className="text-right p-2 font-medium border-r border-border">Valor FCFE<br/>Líquido (R$)</th>
                        <th className="text-right p-2 font-medium border-r border-border">Valor FCFE<br/>Líquido Acumm. (R$)</th>
                        <th className="text-right p-2 font-medium border-r border-border">VPL FCFE<br/>Líquido (R$)</th>
                        <th className="text-right p-2 font-medium border-r border-border">Check<br/>TIR</th>
                        <th className="text-center p-2 font-medium border-r border-border">Pay-back<br/>Retorno Anos</th>
                        <th className="text-right p-2 font-medium">Check<br/>Pay-back</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        let fcfeAcumulado = 0;
                        let vplAcumulado = 0;
                        let paybackEncontrado = false;
                        let paybackValor = 0;
                        
                        return financials.results.map((r, index) => {
                          const periodo = index;
                          const fatorJuros = Math.pow(1 + currentInvestment.taxaJuros / 100, periodo);
                          const investimento = periodo === 0 ? -currentInvestment.valorInvestimento : 0;
                          const geracaoFCFE = r.geracaoCaixaBruta + r.receitasExtras;
                          const valorFCFELiquido = geracaoFCFE - r.pagamentoInvestimento + (periodo === 0 ? investimento : 0);
                          fcfeAcumulado += valorFCFELiquido;
                          const vplFCFELiquido = valorFCFELiquido / fatorJuros;
                          vplAcumulado += vplFCFELiquido;
                          
                          // Calcular check TIR
                          const fatorTIR = Math.pow(1 + financials.tir / 100, periodo);
                          const checkTIR = valorFCFELiquido / fatorTIR;
                          
                          // Calcular payback
                          let paybackRetorno = '';
                          let checkPayback = '';
                          if (!paybackEncontrado && vplAcumulado >= 0 && periodo > 0) {
                            paybackEncontrado = true;
                            const vplAnterior = vplAcumulado - vplFCFELiquido;
                            paybackValor = periodo - 1 + Math.abs(vplAnterior) / vplFCFELiquido;
                            paybackRetorno = formatNumber(paybackValor, 2);
                            checkPayback = formatCurrency(vplAcumulado - vplAnterior);
                          }
                          
                          return (
                            <tr key={r.year} className={cn(
                              "border-b border-border/50 hover:bg-muted/30",
                              periodo === 0 && "bg-red-900/10",
                              valorFCFELiquido < 0 && periodo > 0 && "bg-orange-900/10",
                              valorFCFELiquido >= 0 && periodo > 0 && "bg-green-900/10"
                            )}>
                              <td className="text-center p-2 border-r border-border/50 font-semibold">{periodo}</td>
                              <td className="text-center p-2 border-r border-border/50 font-semibold">{r.year}</td>
                              <td className="text-center p-2 border-r border-border/50">{formatNumber(fatorJuros, 6)}</td>
                              <td className="text-right p-2 border-r border-border/50 text-red-400 font-semibold">
                                {investimento !== 0 ? `(${formatCurrency(Math.abs(investimento))})` : '-'}
                              </td>
                              <td className="text-right p-2 border-r border-border/50 text-green-400">{formatCurrency(geracaoFCFE)}</td>
                              <td className={cn(
                                "text-right p-2 border-r border-border/50 font-semibold",
                                valorFCFELiquido < 0 ? "text-red-400" : "text-green-400"
                              )}>
                                {valorFCFELiquido < 0 ? `(${formatCurrency(Math.abs(valorFCFELiquido))})` : formatCurrency(valorFCFELiquido)}
                              </td>
                              <td className={cn(
                                "text-right p-2 border-r border-border/50 font-semibold",
                                fcfeAcumulado < 0 ? "text-red-400" : "text-green-400"
                              )}>
                                {fcfeAcumulado < 0 ? `(${formatCurrency(Math.abs(fcfeAcumulado))})` : formatCurrency(fcfeAcumulado)}
                              </td>
                              <td className="text-right p-2 border-r border-border/50 text-blue-400">{formatCurrency(vplFCFELiquido)}</td>
                              <td className="text-right p-2 border-r border-border/50 text-purple-400">
                                {checkTIR < 0 ? `(${formatCurrency(Math.abs(checkTIR))})` : formatCurrency(checkTIR)}
                              </td>
                              <td className="text-center p-2 border-r border-border/50 font-bold text-yellow-400">{paybackRetorno}</td>
                              <td className="text-right p-2 text-yellow-400">{checkPayback}</td>
                            </tr>
                          );
                        });
                      })()}
                      <tr className="border-t-2 border-border bg-muted/50 font-bold">
                        <td colSpan={3} className="text-center p-2 border-r border-border">Total</td>
                        <td className="text-right p-2 border-r border-border text-red-400">
                          ({formatCurrency(currentInvestment.valorInvestimento)})
                        </td>
                        <td className="text-right p-2 border-r border-border text-green-400">
                          {formatCurrency(financials.results.reduce((sum, r) => sum + r.geracaoCaixaBruta + r.receitasExtras, 0))}
                        </td>
                        <td className="text-right p-2 border-r border-border text-green-400">
                          {formatCurrency(financials.results.reduce((sum, r, i) => {
                            const investimento = i === 0 ? -currentInvestment.valorInvestimento : 0;
                            return sum + r.geracaoCaixaBruta + r.receitasExtras - r.pagamentoInvestimento + investimento;
                          }, 0))}
                        </td>
                        <td className="text-right p-2 border-r border-border"></td>
                        <td className="text-right p-2 border-r border-border text-blue-400">{formatCurrency(financials.vpl)}</td>
                        <td className="text-right p-2 border-r border-border">-</td>
                        <td className="text-center p-2 border-r border-border text-yellow-400">
                          {financials.payback > 0 ? formatNumber(financials.paybackDetalhado, 2) : '-'}
                        </td>
                        <td className="text-right p-2">-</td>
                      </tr>
                      <tr className="bg-green-900/20">
                        <td colSpan={11} className="text-center p-3 font-bold text-lg">
                          TIR (a.a.): <span className="text-green-400">{formatNumber(financials.tir, 2)}%</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

