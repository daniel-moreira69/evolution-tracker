import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { HealthMetric, MetricType } from '@/types/health';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

interface MetricChartProps {
  metrics: HealthMetric[];
  type: MetricType;
  title: string;
  unit: string;
  color: string;
}

const chartConfig = {
  value: {
    label: "Valor",
    color: "hsl(var(--primary))",
  },
}

export function MetricChart({ metrics, type, title, unit, color }: MetricChartProps) {
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
    <Card className="bg-gradient-dark border-border/50 shadow-intense">
      <CardHeader className="pb-2">
        <CardTitle className="text-primary font-oswald text-lg">{title}</CardTitle>
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
                    formatter={(value) => [`${Number(value).toFixed(1)}${unit}`, title]}
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
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}