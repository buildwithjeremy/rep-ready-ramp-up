
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ComponentType<{ className?: string }>;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  onClick?: () => void;
  clickable?: boolean;
}

export function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  className,
  onClick,
  clickable = false
}: StatCardProps) {
  return (
    <Card 
      className={cn(
        clickable && "cursor-pointer hover:shadow-md transition-shadow",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-gray-600 truncate">{title}</p>
            <p className="text-xl font-bold text-gray-900 truncate">{value}</p>
            {trend && (
              <p className={cn(
                "text-xs font-medium",
                trend.isPositive ? "text-green-600" : "text-red-600"
              )}>
                {trend.isPositive ? "+" : ""}{trend.value}%
              </p>
            )}
          </div>
          {Icon && (
            <div className="p-2 bg-blue-100 rounded-lg ml-2 flex-shrink-0">
              <Icon className="w-5 h-5 text-blue-600" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
