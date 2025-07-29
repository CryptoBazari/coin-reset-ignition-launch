import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface CategoryAllocationDisplayProps {
  allocations?: {
    bitcoin?: number;
    bluechip?: number;
    smallcap?: number;
  };
  totalValue: number;
}

export const CategoryAllocationDisplay = ({ allocations, totalValue }: CategoryAllocationDisplayProps) => {
  // Provide default values if allocations is undefined
  const safeAllocations = {
    bitcoin: allocations?.bitcoin || 0,
    bluechip: allocations?.bluechip || 0,
    smallcap: allocations?.smallcap || 0
  };
  const categories = [
    {
      name: "Bitcoin",
      percentage: safeAllocations.bitcoin,
      value: (totalValue * safeAllocations.bitcoin) / 100,
      color: "hsl(var(--warning))",
      bgColor: "bg-warning/10"
    },
    {
      name: "Blue Chip",
      percentage: safeAllocations.bluechip,
      value: (totalValue * safeAllocations.bluechip) / 100,
      color: "hsl(var(--primary))",
      bgColor: "bg-primary/10"
    },
    {
      name: "Small-Cap",
      percentage: safeAllocations.smallcap,
      value: (totalValue * safeAllocations.smallcap) / 100,
      color: "hsl(var(--accent))",
      bgColor: "bg-accent/10"
    }
  ];

  return (
    <div className="space-y-4">
      {categories.map((category) => (
        <div key={category.name} className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: category.color }}
              />
              <span className="font-medium text-sm">{category.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className={category.bgColor}>
                {category.percentage.toFixed(1)}%
              </Badge>
              <span className="text-sm text-muted-foreground">
                ${category.value.toLocaleString()}
              </span>
            </div>
          </div>
          <Progress 
            value={category.percentage} 
            className="h-2"
            style={{
              "--progress-background": category.color
            } as React.CSSProperties}
          />
        </div>
      ))}
      
      {/* Total Portfolio Value */}
      <div className="pt-2 border-t border-border">
        <div className="flex justify-between items-center">
          <span className="font-medium text-sm">Total Portfolio</span>
          <span className="font-bold">${totalValue.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};