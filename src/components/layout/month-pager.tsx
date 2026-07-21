import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMonthYear } from "@/lib/utils/dates";

interface MonthPagerProps {
  month: string;
  onChange: (delta: number) => void;
  className?: string;
}

export function MonthPager({ month, onChange, className }: MonthPagerProps) {
  return (
    <div className={`flex items-center gap-1 ${className ?? ""}`}>
      <Button
        variant="ghost"
        size="icon"
        className="relative before:absolute before:inset-[-6px] before:content-['']"
        onClick={() => onChange(-1)}
        aria-label="Mes anterior"
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>
      <span
        className="min-w-[8rem] text-center text-sm font-medium capitalize text-foreground whitespace-nowrap"
        aria-live="polite"
      >
        {formatMonthYear(`${month}-01`)}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="relative before:absolute before:inset-[-6px] before:content-['']"
        onClick={() => onChange(1)}
        aria-label="Mes siguiente"
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
    </div>
  );
}
