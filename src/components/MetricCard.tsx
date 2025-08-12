import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Goal, HealthMetric } from "@/types/health";

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
  const getTrend = () => {
    if (!lastMetric || !previousMetric || !value) return null;
    
    const current = value;
    const previous = getPreviousValue();
    
    if (!previous) return null;
    
    if (current > previous) return { direction: 'up', percentage: ((current - previous) / previous * 100).toFixed(1) };
    if (current < previous) return { direction: 'down', percentage: ((previous - current) / previous * 100).toFixed(1) };
    return { direction: 'same', percentage: '0' };
  };

  const getPreviousValue = (): number | undefined => {
    if (!previousMetric) return undefined;
    
    switch (goal?.type) {
      case 'weight': return previousMetric.weight;
      case 'muscleMass': return previousMetric.muscleMass;
      case 'fatMass': return previousMetric.fatMass;
      case 'bmi': return previousMetric.bmi;
      case 'fatPercentage': return previousMetric.fatPercentage;
      default: return undefined;
    }
  };

  const getProgress = () => {
    if (!goal || !value) return 0;
    
    const start = goal.currentValue || 0;
    const target = goal.targetValue;
    const current = value;
    
    if (start === target) return 100;
    
    const progress = ((current - start) / (target - start)) * 100;
    return Math.max(0, Math.min(100, progress));
  };

  const trend = getTrend();
  const progress = getProgress();

  return (
    <Card className="shadow-soft hover:shadow-glow transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={`p-2 rounded-lg bg-gradient-to-br ${color}`}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {value ? `${value.toFixed(1)} ${unit}` : `-- ${unit}`}
        </div>
        
        {trend && (
          <div className="flex items-center text-xs text-muted-foreground mt-1">
            {trend.direction === 'up' && <TrendingUp className="h-3 w-3 text-success mr-1" />}
            {trend.direction === 'down' && <TrendingDown className="h-3 w-3 text-destructive mr-1" />}
            {trend.direction === 'same' && <Minus className="h-3 w-3 text-muted-foreground mr-1" />}
            {trend.percentage}% desde última medição
          </div>
        )}
        
        {goal && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Meta: {goal.targetValue.toFixed(1)} {unit}</span>
              <span>{progress.toFixed(0)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="text-xs text-muted-foreground mt-1">
              até {goal.targetDate.toLocaleDateString('pt-BR')}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}