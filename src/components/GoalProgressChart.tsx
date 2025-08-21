import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Goal } from '@/types/health';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Target, TrendingUp } from 'lucide-react';
import { calcularMetasMensais } from '@/utils/monthlyGoalCalculator';

interface GoalProgressChartProps {
  goals: Goal[];
  currentMetrics?: any;
}

const chartConfig = {
  realizado: {
    label: "Realizado",
    color: "hsl(var(--primary))",
  },
  meta: {
    label: "Meta",
    color: "hsl(var(--accent))",
  },
}

export function GoalProgressChart({ goals, currentMetrics }: GoalProgressChartProps) {
  const activeGoals = goals.filter(goal => goal.currentValue !== undefined && goal.targetValue !== undefined);

  if (activeGoals.length === 0) {
    return (
      <Card className="bg-gradient-dark border-border/50 shadow-intense">
        <CardHeader className="pb-2">
          <CardTitle className="text-primary font-oswald text-lg flex items-center gap-2">
            <Target className="h-5 w-5" />
            Progresso das Metas Mensais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48 text-muted-foreground">
            <p className="text-sm">Defina suas metas para ver o progresso mensal</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Generate monthly breakdown for weight goals
  const weightGoal = activeGoals.find(goal => goal.type === 'weight');
  let monthlyData: any[] = [];

  if (weightGoal && currentMetrics) {
    try {
      const monthlyBreakdown = calcularMetasMensais({
        pesoAtual: currentMetrics.weight || weightGoal.currentValue,
        pesoMeta: weightGoal.targetValue,
        dataAlvo: typeof weightGoal.targetDate === 'string' 
          ? weightGoal.targetDate 
          : weightGoal.targetDate?.toISOString().split('T')[0] || new Date(Date.now() + 12 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        altura: currentMetrics.height || 175,
        massaMuscular: currentMetrics.muscleMass || 45,
        massaGordura: currentMetrics.fatMass || 30,
        percentualGordura: currentMetrics.fatPercentage || 25
      });

      monthlyData = monthlyBreakdown.map((breakdown, index) => ({
        mes: `Mês ${index}`,
        meta: breakdown.peso,
        realizado: index === 0 ? (currentMetrics.weight || weightGoal.currentValue) : null, // Only show current for month 0
        unit: 'kg'
      }));
    } catch (error) {
      console.warn('Erro ao calcular metas mensais:', error);
    }
  }

  // Fallback to simple data if monthly calculation fails
  const data = monthlyData.length > 0 ? monthlyData : activeGoals.map(goal => ({
    mes: getMetricLabel(goal.type),
    meta: goal.targetValue,
    realizado: goal.currentValue,
    unit: getMetricUnit(goal.type)
  }));

  return (
    <Card className="bg-gradient-dark border-border/50 shadow-intense">
      <CardHeader className="pb-2">
        <CardTitle className="text-primary font-oswald text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Progresso das Metas Mensais
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="hsl(var(--border))" 
                strokeOpacity={0.3}
              />
              <XAxis 
                dataKey="mes" 
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
                      if (name === 'realizado' && value !== null) {
                        return [`${Number(value).toFixed(1)}${unit}`, 'Realizado'];
                      }
                      if (name === 'meta') {
                        return [`${Number(value).toFixed(1)}${unit}`, 'Meta'];
                      }
                      return [value, name];
                    }}
                  />
                }
              />
              <Line 
                type="monotone"
                dataKey="realizado" 
                stroke="hsl(var(--primary))"
                strokeWidth={3}
                connectNulls={false}
                dot={{ 
                  fill: 'hsl(var(--primary))', 
                  strokeWidth: 2, 
                  stroke: 'hsl(var(--background))',
                  r: 4
                }}
                activeDot={{ 
                  r: 6, 
                  fill: 'hsl(var(--primary-glow))',
                  stroke: 'hsl(var(--background))',
                  strokeWidth: 2
                }}
              />
              <Line 
                type="monotone"
                dataKey="meta" 
                stroke="hsl(var(--accent))"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ 
                  fill: 'hsl(var(--accent))', 
                  strokeWidth: 2, 
                  stroke: 'hsl(var(--background))',
                  r: 3
                }}
                activeDot={{ 
                  r: 4, 
                  fill: 'hsl(var(--accent))',
                  stroke: 'hsl(var(--background))',
                  strokeWidth: 2
                }}
              />
            </LineChart>
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