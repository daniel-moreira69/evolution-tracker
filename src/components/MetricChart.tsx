import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { HealthMetric, MetricType, Goal } from '@/types/health';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { MonthlyProgressChart } from './MonthlyProgressChart';

interface MetricChartProps {
  metrics: HealthMetric[];
  goals: Goal[];
  type: MetricType;
  title: string;
  unit: string;
  color: string;
  goal?: Goal;
}

const chartConfig = {
  value: {
    label: "Valor Real",
    color: "hsl(var(--primary))",
  },
  goal: {
    label: "Meta",
    color: "hsl(var(--warning))",
  },
}

export function MetricChart({ metrics, goals, type, title, unit, color, goal }: MetricChartProps) {
  const data = metrics
    .filter(metric => metric[type] !== undefined)
    .slice(-10) // Last 10 measurements
    .reverse() // Show chronologically
    .map((metric, index) => ({
      date: metric.date.toLocaleDateString('pt-BR', { 
        day: '2-digit',
        month: '2-digit'
      }),
      value: metric[type],
      goal: goal?.targetValue || null,
      fullDate: metric.date.toLocaleDateString('pt-BR')
    }));

  if (data.length < 2) {
    return (
      <Card className="bg-gradient-dark border-border/50 shadow-intense">
        <CardHeader className="pb-2">
          <CardTitle className="text-primary font-oswald text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            <p className="text-sm">Adicione mais medições para ver o gráfico</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Historical Data Chart */}
      <Card className="bg-gradient-dark border-border/50 shadow-intense">
        <CardHeader className="pb-2">
          <CardTitle className="text-primary font-oswald text-lg">{title} - Histórico</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="hsl(var(--border))" 
                  strokeOpacity={0.3}
                />
                <XAxis 
                  dataKey="date" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  domain={['dataMin - 2', 'dataMax + 2']}
                />
                <ChartTooltip 
                  content={
                    <ChartTooltipContent 
                      labelFormatter={(label, payload) => payload?.[0]?.payload?.fullDate}
                      formatter={(value, name) => [
                        `${Number(value).toFixed(1)}${unit}`, 
                        name === 'value' ? 'Valor Real' : 'Meta'
                      ]}
                    />
                  }
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
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
                />
                {goal && (
                  <Line 
                    type="monotone" 
                    dataKey="goal" 
                    stroke="hsl(var(--warning))"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    activeDot={{ 
                      r: 4, 
                      fill: 'hsl(var(--warning))',
                      stroke: 'hsl(var(--background))',
                      strokeWidth: 2
                    }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Monthly Progress Chart */}
      <MonthlyProgressChart 
        metrics={metrics}
        goals={goals}
        type={type}
        title={title}
        unit={unit}
      />
    </div>
  );
}