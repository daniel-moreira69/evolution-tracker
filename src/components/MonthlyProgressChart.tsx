import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { HealthMetric, MetricType, Goal } from '@/types/health';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { calcularMetasMensais } from '@/utils/monthlyGoalCalculator';
import { TrendingUp } from 'lucide-react';

interface MonthlyProgressChartProps {
  metrics: HealthMetric[];
  goals: Goal[];
  type: MetricType;
  title: string;
  unit: string;
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

export function MonthlyProgressChart({ metrics, goals, type, title, unit }: MonthlyProgressChartProps) {
  const goal = goals.find(g => g.type === type);
  
  if (!goal) {
    return (
      <Card className="bg-gradient-dark border-border/50 shadow-intense">
        <CardHeader className="pb-2">
          <CardTitle className="text-primary font-oswald text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {title} - Progresso Mensal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48 text-muted-foreground">
            <p className="text-sm">Defina uma meta para {title.toLowerCase()} para ver o progresso</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get latest metric values for calculation
  const latestMetric = metrics.length > 0 ? metrics[metrics.length - 1] : null;
  
  // Get current values from latest metric or goal
  const currentValues = {
    weight: latestMetric?.weight || goal.currentValue,
    muscleMass: latestMetric?.muscleMass || 45,
    fatMass: latestMetric?.fatMass || 30,
    fatPercentage: latestMetric?.fatPercentage || 25,
    height: 175 // Default height, should be configurable
  };

  let monthlyData: any[] = [];

  try {
    if (type === 'weight' && currentValues.weight) {
      // Use advanced calculation for weight
      const monthlyBreakdown = calcularMetasMensais({
        pesoAtual: currentValues.weight,
        pesoMeta: goal.targetValue,
        dataAlvo: typeof goal.targetDate === 'string' 
          ? goal.targetDate 
          : goal.targetDate?.toISOString().split('T')[0] || new Date(Date.now() + 12 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        altura: currentValues.height,
        massaMuscular: currentValues.muscleMass || 45,
        massaGordura: currentValues.fatMass || 30,
        percentualGordura: currentValues.fatPercentage || 25
      });

      monthlyData = monthlyBreakdown.map((breakdown, index) => {
        const actualValue = getActualValueForMonth(metrics, type, index);
        
        return {
          mes: index === 0 ? 'Atual' : `Mês ${index}`,
          meta: breakdown.peso,
          realizado: actualValue,
          unit: unit
        };
      });
    } else {
      // Simple linear calculation for other metrics
      const hoje = new Date();
      const targetDate = typeof goal.targetDate === 'string' 
        ? new Date(goal.targetDate) 
        : goal.targetDate || new Date(Date.now() + 12 * 30 * 24 * 60 * 60 * 1000);
      
      const totalMonths = Math.max(1, (targetDate.getFullYear() - hoje.getFullYear()) * 12 + (targetDate.getMonth() - hoje.getMonth()));
      const currentValue = currentValues[type] || goal.currentValue || 0;
      const totalChange = goal.targetValue - currentValue;
      const changePerMonth = totalChange / totalMonths;

      monthlyData = [];
      for (let i = 0; i <= totalMonths; i++) {
        const monthlyTargetValue = currentValue + (changePerMonth * i);
        const actualValue = getActualValueForMonth(metrics, type, i);
        
        monthlyData.push({
          mes: i === 0 ? 'Atual' : `Mês ${i}`,
          meta: parseFloat(monthlyTargetValue.toFixed(1)),
          realizado: actualValue,
          unit: unit
        });
      }
    }
  } catch (error) {
    console.warn('Erro ao calcular metas mensais:', error);
    return (
      <Card className="bg-gradient-dark border-border/50 shadow-intense">
        <CardHeader className="pb-2">
          <CardTitle className="text-primary font-oswald text-lg">{title} - Progresso Mensal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48 text-muted-foreground">
            <p className="text-sm">Erro ao calcular metas mensais</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-dark border-border/50 shadow-intense">
      <CardHeader className="pb-2">
        <CardTitle className="text-primary font-oswald text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          {title} - Progresso Mensal
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="hsl(var(--border))" 
                strokeOpacity={0.3}
              />
              <XAxis 
                dataKey="mes" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                domain={['dataMin - 1', 'dataMax + 1']}
              />
              <ChartTooltip 
                content={
                  <ChartTooltipContent 
                    formatter={(value, name, props) => {
                      const unit = props.payload?.unit || '';
                      if (name === 'realizado' && value !== null && value !== undefined) {
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
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

// Helper function to get the most recent value for a specific month
function getActualValueForMonth(metrics: HealthMetric[], type: MetricType, monthIndex: number): number | null {
  if (monthIndex === 0) {
    // Current month - get latest value
    const latestMetric = metrics.length > 0 ? metrics[metrics.length - 1] : null;
    return latestMetric?.[type] || null;
  }

  // Future months - check if we have data for that time period
  const hoje = new Date();
  const targetMonth = new Date(hoje.getFullYear(), hoje.getMonth() + monthIndex, 1);
  const nextMonth = new Date(hoje.getFullYear(), hoje.getMonth() + monthIndex + 1, 1);

  // Find the most recent metric within this month
  const monthMetrics = metrics.filter(metric => {
    const metricDate = metric.date instanceof Date ? metric.date : new Date(metric.date);
    return metricDate >= targetMonth && metricDate < nextMonth;
  });

  if (monthMetrics.length === 0) return null;

  // Return the most recent value in that month
  const latestInMonth = monthMetrics.reduce((latest, current) => {
    const currentDate = current.date instanceof Date ? current.date : new Date(current.date);
    const latestDate = latest.date instanceof Date ? latest.date : new Date(latest.date);
    return currentDate > latestDate ? current : latest;
  });

  return latestInMonth[type] || null;
}