import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Goal, HealthMetric } from '@/types/health';
import { calcularMetasMensais } from '@/utils/monthlyGoalCalculator';

interface GoalProgressLineChartProps {
  goals: Goal[];
  metrics: HealthMetric[];
}

const chartConfig = {
  meta: {
    label: "Meta",
    color: "hsl(var(--warning))",
  },
  realizado: {
    label: "Realizado",
    color: "hsl(var(--primary))",
  },
}

export function GoalProgressLineChart({ goals, metrics }: GoalProgressLineChartProps) {
  if (goals.length === 0) {
    return (
      <Card className="bg-gradient-dark border-border/50 shadow-intense">
        <CardHeader>
          <CardTitle className="text-primary font-oswald">Progresso das Metas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48 text-muted-foreground">
            <p className="text-sm">Nenhuma meta definida ainda</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData: any[] = [];

  goals.forEach(goal => {
    let monthlyTargets: any[] = [];

    if (goal.type === 'weight') {
      // Use the advanced calculation for weight goals
      const latestMetric = metrics
        .filter(m => m.weight && m.muscleMass && m.fatMass && m.fatPercentage)
        .sort((a, b) => b.date.getTime() - a.date.getTime())[0];

      if (latestMetric) {
        try {
          const metas = calcularMetasMensais({
            pesoAtual: latestMetric.weight!,
            pesoMeta: goal.targetValue,
            dataAlvo: goal.targetDate.toISOString().split('T')[0],
            altura: 175, // Default height - ideally should come from user profile
            massaMuscular: latestMetric.muscleMass!,
            massaGordura: latestMetric.fatMass!,
            percentualGordura: latestMetric.fatPercentage!
          });

          monthlyTargets = metas.slice(1).map(meta => ({
            mes: meta.mes,
            meta: meta.peso,
            tipo: 'weight'
          }));
        } catch (error) {
          console.warn('Error calculating monthly goals for weight:', error);
        }
      }
    } else {
      // Simple linear calculation for other metrics
      const hoje = new Date();
      const endDate = new Date(goal.targetDate);
      const currentValue = goal.currentValue || 0;
      
      const totalMonths = Math.max(1, (endDate.getFullYear() - hoje.getFullYear()) * 12 + (endDate.getMonth() - hoje.getMonth()));
      const totalChange = goal.targetValue - currentValue;
      const changePerMonth = totalChange / totalMonths;

      for (let i = 1; i <= totalMonths; i++) {
        const monthlyTargetValue = currentValue + (changePerMonth * i);
        monthlyTargets.push({
          mes: i,
          meta: parseFloat(monthlyTargetValue.toFixed(1)),
          tipo: goal.type
        });
      }
    }

    // Get actual values for each month
    const actualValues = getActualValuesByMonth(metrics, goal.type);

    // Combine meta and actual values
    monthlyTargets.forEach(target => {
      const monthKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + target.mes).padStart(2, '0')}`;
      const actual = actualValues[monthKey];
      
      chartData.push({
        mes: `Mês ${target.mes}`,
        meta: target.meta,
        realizado: actual || null,
        tipo: getMetricLabel(goal.type)
      });
    });
  });

  // Group data by month and metric type
  const groupedData = chartData.reduce((acc, item) => {
    const key = `${item.mes}-${item.tipo}`;
    if (!acc[key]) {
      acc[key] = item;
    }
    return acc;
  }, {} as Record<string, any>);

  const finalData = Object.values(groupedData);

  if (finalData.length === 0) {
    return (
      <Card className="bg-gradient-dark border-border/50 shadow-intense">
        <CardHeader>
          <CardTitle className="text-primary font-oswald">Progresso das Metas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48 text-muted-foreground">
            <p className="text-sm">Dados insuficientes para gerar o gráfico</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-dark border-border/50 shadow-intense">
      <CardHeader>
        <CardTitle className="text-primary font-oswald">Progresso das Metas - Linha do Tempo</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={finalData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="hsl(var(--border))" 
                strokeOpacity={0.3}
              />
              <XAxis 
                dataKey="mes" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              />
              <ChartTooltip 
                content={
                  <ChartTooltipContent 
                    formatter={(value, name) => [
                      `${Number(value).toFixed(1)}`, 
                      name === 'meta' ? 'Meta' : 'Realizado'
                    ]}
                  />
                }
              />
              <Line 
                type="monotone" 
                dataKey="meta" 
                stroke="hsl(var(--warning))"
                strokeWidth={3}
                strokeDasharray="5 5"
                dot={{ 
                  fill: 'hsl(var(--warning))', 
                  strokeWidth: 2, 
                  stroke: 'hsl(var(--background))',
                  r: 4
                }}
                activeDot={{ 
                  r: 6, 
                  fill: 'hsl(var(--warning))',
                  stroke: 'hsl(var(--background))',
                  strokeWidth: 2
                }}
              />
              <Line 
                type="monotone" 
                dataKey="realizado" 
                stroke="hsl(var(--primary))"
                strokeWidth={3}
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
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

function getActualValuesByMonth(metrics: HealthMetric[], type: string): Record<string, number> {
  const valuesByMonth: Record<string, number[]> = {};

  metrics.forEach(metric => {
    const value = metric[type as keyof HealthMetric] as number;
    if (value !== undefined) {
      const monthKey = `${metric.date.getFullYear()}-${String(metric.date.getMonth() + 1).padStart(2, '0')}`;
      if (!valuesByMonth[monthKey]) {
        valuesByMonth[monthKey] = [];
      }
      valuesByMonth[monthKey].push(value);
    }
  });

  // Use the most recent value for each month
  const result: Record<string, number> = {};
  Object.keys(valuesByMonth).forEach(monthKey => {
    const values = valuesByMonth[monthKey];
    result[monthKey] = values[values.length - 1]; // Most recent value
  });

  return result;
}

function getMetricLabel(type: string): string {
  const labels: Record<string, string> = {
    weight: 'Peso',
    muscleMass: 'Massa Muscular',
    fatMass: 'Massa de Gordura',
    bmi: 'IMC',
    fatPercentage: '% de Gordura'
  };
  return labels[type] || type;
}