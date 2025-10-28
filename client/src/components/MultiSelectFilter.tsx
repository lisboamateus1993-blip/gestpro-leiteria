import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

interface MultiSelectFilterProps {
  label: string;
  options: { id: number; label: string }[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
}

export function MultiSelectFilter({ label, options, selectedIds, onChange }: MultiSelectFilterProps) {
  const handleToggle = (id: number) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(selectedId => selectedId !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.length === options.length) {
      onChange([]);
    } else {
      onChange(options.map(opt => opt.id));
    }
  };

  const selectedCount = selectedIds.length;
  const buttonText = selectedCount === 0 
    ? `Todos ${label.toLowerCase()}` 
    : `${selectedCount} ${label.toLowerCase()} selecionado${selectedCount > 1 ? 's' : ''}`;

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-[250px] justify-between">
            {buttonText}
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[250px] p-0" align="start">
          <div className="max-h-[300px] overflow-y-auto">
            <div className="border-b p-2">
              <button
                onClick={handleSelectAll}
                className="w-full text-left text-sm hover:bg-accent p-2 rounded"
              >
                {selectedIds.length === options.length ? 'Desmarcar todos' : 'Selecionar todos'}
              </button>
            </div>
            <div className="p-2 space-y-2">
              {options.map(option => (
                <div key={option.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`option-${option.id}`}
                    checked={selectedIds.includes(option.id)}
                    onCheckedChange={() => handleToggle(option.id)}
                  />
                  <label
                    htmlFor={`option-${option.id}`}
                    className="text-sm cursor-pointer flex-1"
                  >
                    {option.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

