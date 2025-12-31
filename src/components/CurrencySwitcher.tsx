import { useCurrency } from "@/hooks/useCurrency";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DollarSign } from "lucide-react";

export const CurrencySwitcher = () => {
  const { currency, setCurrency, formatPrice } = useCurrency();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <DollarSign className="w-4 h-4" />
          <span className="font-medium">{currency.toUpperCase()}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => setCurrency('usd')}
          className={currency === 'usd' ? 'bg-accent' : ''}
        >
          <div className="flex items-center justify-between w-full">
            <span>USD ($)</span>
            {currency === 'usd' && <span className="text-xs">✓</span>}
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setCurrency('cad')}
          className={currency === 'cad' ? 'bg-accent' : ''}
        >
          <div className="flex items-center justify-between w-full">
            <span>CAD ($)</span>
            {currency === 'cad' && <span className="text-xs">✓</span>}
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

