import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Goal } from '@/types/health';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Target, TrendingUp } from 'lucide-react';

interface GoalProgressChartProps {
  goals: Goal[];
}

const chartConfig = {
  current: {
    label: "Atual",
    color: "hsl(var(--primary))",
  },
  target: {
    label: "Meta",
    color: "hsl(var(--accent))",
  },
}

export function GoalProgressChart({ goals }: GoalProgressChartProps) {
  const activeGoals = goals.filter(goal => goal.currentValue !== undefined && goal.targetValue !== undefined);

  if (activeGoals.length === 0) {
    return (
      <Card className="bg-gradient-dark border-border/50 shadow-intense">
        <CardHeader className="pb-2">
          <CardTitle className="text-primary font-oswald text-lg flex items-center gap-2">
            <Target className="h-5 w-5" />
            Progresso das Metas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48 text-muted-foreground">
            <p className="text-sm">Defina suas metas para ver o progresso</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const data = activeGoals.map(goal => {
    // Simple progress calculation based on current value and target
    const progress = goal.currentValue !== undefined ? 
      (goal.currentValue / goal.targetValue) * 100 : 0;
    
    return {
      name: getMetricLabel(goal.type),
      current: goal.currentValue,
      target: goal.targetValue,
      progress: Math.min(Math.max(progress, 0), 100),
      unit: getMetricUnit(goal.type)
    };
  });

  return (
    <Card className="bg-gradient-dark border-border/50 shadow-intense">
      <CardHeader className="pb-2">
        <CardTitle className="text-primary font-oswald text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Progresso das Metas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="hsl(var(--border))" 
                strokeOpacity={0.3}
              />
              <XAxis 
                dataKey="name" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              />
              <ChartTooltip 
                content={
                  <ChartTooltipContent 
                    formatter={(value, name, props) => {
                      const unit = props.payload?.unit || '';
                      if (name === 'current') {
                        return [`${Number(value).toFixed(1)}${unit}`, 'Atual'];
                      }
                      if (name === 'target') {
                        return [`${Number(value).toFixed(1)}${unit}`, 'Meta'];
                      }
                      return [value, name];
                    }}
                  />
                }
              />
              <Bar 
                dataKey="current" 
                fill="hsl(var(--primary))"
                radius={[2, 2, 0, 0]}
                opacity={0.8}
              />
              <Bar 
                dataKey="target" 
                fill="hsl(var(--accent))"
                radius={[2, 2, 0, 0]}
                opacity={0.6}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

function getMetricLabel(type: string): string {
  const labels: Record<string, string> = {
    weight: 'Peso',
    muscleMass: 'Músculo',
    fatMass: 'Gordura',
    bmi: 'IMC',
    fatPercentage: '% Gordura'
  };
  return labels[type] || type;
}

function getMetricUnit(type: string): string {
  const units: Record<string, string> = {
    weight: 'kg',
    muscleMass: 'kg',
    fatMass: 'kg',
    bmi: '',
    fatPercentage: '%'
  };
  return units[type] || '';
}