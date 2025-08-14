import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Goal, HealthMetric } from "@/types/health";
import { GoalBreakdown } from "./GoalBreakdown";

interface MetricCardProps {
  title: string;
  value?: number;
  unit: string;
  goal?: Goal;
  lastMetric?: HealthMetric;
  previousMetric?: HealthMetric;
  icon: React.ReactNode;
  color: string;
}

export function MetricCard({ 
  title, 
  value, 
  unit, 
  goal, 
  lastMetric, 
  previousMetric, 
  icon, 
  color 
}: MetricCardProps) {
  const displayValue = value ? value.toFixed(1) : '--';
  
  // Calculate change from previous measurement
  const change = (() => {
    if (!value || !previousMetric) return null;
    
    const getValueFromMetric = (metric: HealthMetric, type?: string): number | undefined => {
      switch (type || goal?.type) {
        case 'weight': return metric.weight;
        case 'muscleMass': return metric.muscleMass;
        case 'fatMass': return metric.fatMass;
        case 'bmi': return metric.bmi;
        case 'fatPercentage': return metric.fatPercentage;
        default: return undefined;
      }
    };
    
    const previousValue = getValueFromMetric(previousMetric, goal?.type);
    return previousValue ? value - previousValue : null;
  })();

  const changeColor = change === null ? 'text-muted-foreground' : 
    change > 0 ? 'text-success' : 
    change < 0 ? 'text-destructive' : 'text-muted-foreground';

  return (
    <Card className="overflow-hidden bg-gradient-dark border-border/50 shadow-intense hover:shadow-glow transition-all duration-300 hover:scale-105">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-gold-light font-rajdhani font-semibold">
            {title}
          </CardTitle>
          <div className={`rounded-full p-2 bg-gradient-to-br ${color} glow`}>
            {icon}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-primary font-oswald">
              {displayValue}
            </span>
            <span className="text-sm text-gold-light font-rajdhani">{unit}</span>
            {change !== null && (
              <span className={`text-xs flex items-center gap-1 font-rajdhani font-medium ${changeColor}`}>
                {change > 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : change < 0 ? (
                  <TrendingDown className="h-3 w-3" />
                ) : (
                  <Minus className="h-3 w-3" />
                )}
                {Math.abs(change).toFixed(1)}{unit}
              </span>
            )}
          </div>
          
          {goal && (
            <GoalBreakdown goal={goal} onUpdate={() => {}} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}