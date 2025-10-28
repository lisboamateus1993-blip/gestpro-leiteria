// Componente auxiliar para tabela editável de projeção
import { Input } from "@/components/ui/input";

interface YearDataEditable {
  year: number;
  numeroAnimais: number;
  producaoPorAnimalDia: number;
  producao: number;
  quebraProd: number;
  precoVenda: number;
  custoProducao: number;
  receitasExtras: number;
}

interface EditableProjectionTableProps {
  years: YearDataEditable[];
  onUpdateYear: (index: number, field: keyof YearDataEditable, value: number) => void;
}

export function EditableProjectionTable({ years, onUpdateYear }: EditableProjectionTableProps) {
  const formatNumber = (value: number, decimals: number = 0) => {
    return value.toLocaleString('pt-BR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b-2 border-border">
            <th className="text-left p-2 font-medium sticky left-0 bg-background">Descrição</th>
            <th className="text-center p-2 font-medium">Unidade</th>
            {years.map((y) => (
              <th key={y.year} className="text-center p-2 font-medium min-w-[120px]">{y.year}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-border/50 bg-blue-900/10">
            <td className="p-2 sticky left-0 bg-background font-medium">Número de Animais</td>
            <td className="text-center p-2">un</td>
            {years.map((y, i) => (
              <td key={y.year} className="p-2">
                <Input
                  type="number"
                  value={y.numeroAnimais}
                  onChange={(e) => onUpdateYear(i, 'numeroAnimais', parseInt(e.target.value) || 0)}
                  className="h-8 text-right"
                />
              </td>
            ))}
          </tr>
          <tr className="border-b border-border/50 bg-blue-900/10">
            <td className="p-2 sticky left-0 bg-background font-medium">Produção/Animal/Dia</td>
            <td className="text-center p-2">L/dia</td>
            {years.map((y, i) => (
              <td key={y.year} className="p-2">
                <Input
                  type="text"
                  value={y.producaoPorAnimalDia.toString().replace('.', ',')}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value.replace(',', '.')) || 0;
                    onUpdateYear(i, 'producaoPorAnimalDia', value);
                  }}
                  className="h-8 text-right"
                />
              </td>
            ))}
          </tr>
          <tr className="border-b border-border/50">
            <td className="p-2 sticky left-0 bg-background">Produção Ano</td>
            <td className="text-center p-2">L</td>
            {years.map((y) => (
              <td key={y.year} className="text-right p-2">{formatNumber(y.producao, 0)}</td>
            ))}
          </tr>
          <tr className="border-b border-border/50 bg-yellow-900/10">
            <td className="p-2 sticky left-0 bg-background font-medium">Quebra Produção</td>
            <td className="text-center p-2">%</td>
            {years.map((y, i) => (
              <td key={y.year} className="p-2">
                <Input
                  type="text"
                  value={y.quebraProd.toString().replace('.', ',')}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value.replace(',', '.')) || 0;
                    onUpdateYear(i, 'quebraProd', value);
                  }}
                  className="h-8 text-right"
                />
              </td>
            ))}
          </tr>
          <tr className="border-b border-border/50 bg-green-900/10">
            <td className="p-2 sticky left-0 bg-background font-medium">Preço Venda</td>
            <td className="text-center p-2">R$/L</td>
            {years.map((y, i) => (
              <td key={y.year} className="p-2">
                <Input
                  type="text"
                  value={y.precoVenda.toString().replace('.', ',')}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value.replace(',', '.')) || 0;
                    onUpdateYear(i, 'precoVenda', value);
                  }}
                  className="h-8 text-right"
                />
              </td>
            ))}
          </tr>
          <tr className="border-b border-border/50 bg-red-900/10">
            <td className="p-2 sticky left-0 bg-background font-medium">Custo Produção</td>
            <td className="text-center p-2">R$/L</td>
            {years.map((y, i) => (
              <td key={y.year} className="p-2">
                <Input
                  type="text"
                  value={y.custoProducao.toString().replace('.', ',')}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value.replace(',', '.')) || 0;
                    onUpdateYear(i, 'custoProducao', value);
                  }}
                  className="h-8 text-right"
                />
              </td>
            ))}
          </tr>
          <tr className="border-b border-border/50 bg-purple-900/10">
            <td className="p-2 sticky left-0 bg-background font-medium">Receitas Extras</td>
            <td className="text-center p-2">R$</td>
            {years.map((y, i) => (
              <td key={y.year} className="p-2">
                <Input
                  type="text"
                  value={y.receitasExtras.toLocaleString('pt-BR')}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value.replace(/\./g, '').replace(',', '.')) || 0;
                    onUpdateYear(i, 'receitasExtras', value);
                  }}
                  className="h-8 text-right"
                />
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

