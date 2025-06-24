
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  progress: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function ProgressBar({ 
  progress, 
  className, 
  size = 'md', 
  showLabel = false 
}: ProgressBarProps) {
  const heightClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  };

  return (
    <div className={cn("w-full", className)}>
      <div className={cn(
        "bg-gray-200 rounded-full overflow-hidden",
        heightClasses[size]
      )}>
        <div 
          className="bg-blue-600 h-full rounded-full transition-all duration-300"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-sm text-gray-600 mt-1 block">
          {Math.round(progress)}% Complete
        </span>
      )}
    </div>
  );
}
