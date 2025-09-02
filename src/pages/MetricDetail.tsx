import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, TrendingUp, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { HealthMetric, Goal, MetricType } from "@/types/health";
import { calcularMetasMensais } from "@/utils/monthlyGoalCalculator";
import { useState, useEffect } from "react";

const metricLabels = {
  weight: { label: "Peso", unit: "kg" },
  muscleMass: { label: "Massa Muscular", unit: "kg" },
  fatMass: { label: "Massa de Gordura", unit: "kg" },
  bmi: { label: "IMC", unit: "" },
  fatPercentage: { label: "% de Gordura", unit: "%" }
};

const chartConfig = {
  measurement: {
    label: "Medição",
    color: "hsl(var(--primary))",
  },
  goal: {
    label: "Meta Mensal",
    color: "hsl(var(--warning))",
  },
};

export default function MetricDetail() {
  const { metricType } = useParams<{ metricType: string }>();
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<HealthMetric[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);

  const type = metricType as MetricType;
  const metric = metricLabels[type];
  const goal = goals.find(g => g.type === type);

  useEffect(() => {
    const savedMetrics = localStorage.getItem('healthMetrics');
    const savedGoals = localStorage.getItem('healthGoals');
    
    if (savedMetrics) {
      const parsedMetrics = JSON.parse(savedMetrics);
      setMetrics(parsedMetrics.map((m: any) => ({
        ...m,
        date: new Date(m.date)
      })));
    }
    
    if (savedGoals) {
      const parsedGoals = JSON.parse(savedGoals);
      setGoals(parsedGoals.map((g: any) => ({
        ...g,
        targetDate: new Date(g.targetDate),
        weeklyGoals: g.weeklyGoals?.map((w: any) => ({
          ...w,
          weekStart: new Date(w.weekStart),
          weekEnd: new Date(w.weekEnd)
        })) || [],
        monthlyGoals: g.monthlyGoals || []
      })));
    }
  }, []);

  // Calcular dados do gráfico
  const getChartData = () => {
    if (!goal || metrics.length === 0) return [];

    // Obter a medição mais recente para usar como base
    const latestMetric = metrics[metrics.length - 1];
    
    // Calcular metas mensais usando o script fornecido
    const monthlyGoals = calcularMetasMensais({
      pesoAtual: latestMetric.weight || 70,
      pesoMeta: goal.targetValue,
      dataAlvo: goal.targetDate.toISOString().split('T')[0],
      altura: 175, // Valor padrão, idealmente vem do perfil do usuário
      massaMuscular: latestMetric.muscleMass || 35,
      massaGordura: latestMetric.fatMass || 25,
      percentualGordura: latestMetric.fatPercentage || 20
    });

    // Agrupar medições por mês
    const measurementsByMonth = new Map<string, HealthMetric[]>();
    
    metrics.forEach(metric => {
      if (metric[type] !== undefined) {
        const monthKey = `${metric.date.getFullYear()}-${String(metric.date.getMonth() + 1).padStart(2, '0')}`;
        if (!measurementsByMonth.has(monthKey)) {
          measurementsByMonth.set(monthKey, []);
        }
        measurementsByMonth.get(monthKey)!.push(metric);
      }
    });

    // Preparar dados para o gráfico
    const chartData = [];
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth(), 1);

    for (let i = 0; i < monthlyGoals.length; i++) {
      const monthDate = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
      const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
      const monthName = monthDate.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      
      // Obter a medição mais recente do mês
      let latestMeasurement = null;
      const monthMeasurements = measurementsByMonth.get(monthKey) || [];
      if (monthMeasurements.length > 0) {
        latestMeasurement = monthMeasurements.reduce((latest, current) => 
          current.date > latest.date ? current : latest
        );
      }

      // Obter valor da meta mensal
      let goalValue = null;
      const monthlyGoal = monthlyGoals[i];
      if (monthlyGoal) {
        switch (type) {
          case 'weight':
            goalValue = monthlyGoal.peso;
            break;
          case 'muscleMass':
            goalValue = monthlyGoal.massaMuscular;
            break;
          case 'fatMass':
            goalValue = monthlyGoal.massaGordura;
            break;
          case 'bmi':
            goalValue = monthlyGoal.imc;
            break;
          case 'fatPercentage':
            goalValue = monthlyGoal.percentualGordura;
            break;
        }
      }

      chartData.push({
        month: monthName,
        measurement: latestMeasurement ? latestMeasurement[type] : null,
        goal: goalValue,
        fullDate: monthDate.toLocaleDateString('pt-BR')
      });
    }

    return chartData;
  };

  const chartData = getChartData();

  if (!metric) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Métrica não encontrada</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-oswald font-bold text-primary">
              {metric.label}
            </h1>
            <p className="text-muted-foreground font-rajdhani">
              Progresso mensal vs metas calculadas
            </p>
          </div>
        </div>

        {/* Main Chart */}
        <Card className="bg-gradient-dark border-border/50 shadow-intense">
          <CardHeader className="pb-2">
            <CardTitle className="text-primary font-oswald text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Evolução Mensal - {metric.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid 
                      strokeDasharray="3 3" 
                      stroke="hsl(var(--border))" 
                      strokeOpacity={0.3}
                    />
                    <XAxis 
                      dataKey="month" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                      domain={['dataMin - 2', 'dataMax + 2']}
                    />
                    <ChartTooltip 
                      content={
                        <ChartTooltipContent 
                          labelFormatter={(label, payload) => payload?.[0]?.payload?.fullDate}
                          formatter={(value, name) => [
                            value ? `${Number(value).toFixed(1)}${metric.unit}` : 'Sem dados', 
                            name === 'measurement' ? 'Medição' : 'Meta Mensal'
                          ]}
                        />
                      }
                    />
                    <Line 
                      type="monotone" 
                      dataKey="measurement" 
                      stroke="hsl(var(--primary))"
                      strokeWidth={3}
                      dot={{ 
                        fill: 'hsl(var(--primary))', 
                        strokeWidth: 2, 
                        stroke: 'hsl(var(--background))',
                        r: 6
                      }}
                      activeDot={{ 
                        r: 8, 
                        fill: 'hsl(var(--primary-glow))',
                        stroke: 'hsl(var(--background))',
                        strokeWidth: 2
                      }}
                      connectNulls={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="goal" 
                      stroke="hsl(var(--warning))"
                      strokeWidth={2}
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
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="flex items-center justify-center h-80 text-muted-foreground">
                <div className="text-center">
                  <Target className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-oswald">Sem dados disponíveis</p>
                  <p className="text-sm font-rajdhani">Adicione medições e defina uma meta para ver o gráfico</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Goal Status */}
        {goal && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-gradient-dark border-border/50 shadow-intense">
              <CardHeader>
                <CardTitle className="text-primary font-oswald flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Status da Meta
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground font-rajdhani">Meta:</span>
                    <span className="text-primary font-oswald font-bold">
                      {goal.targetValue.toFixed(1)}{metric.unit}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground font-rajdhani">Atual:</span>
                    <span className="text-foreground font-oswald font-bold">
                      {goal.currentValue?.toFixed(1) || '--'}{metric.unit}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground font-rajdhani">Prazo:</span>
                    <span className="text-foreground font-rajdhani">
                      {goal.targetDate.toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-dark border-border/50 shadow-intense">
              <CardHeader>
                <CardTitle className="text-primary font-oswald">
                  Progresso Geral
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {goal.currentValue && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground font-rajdhani">Progresso:</span>
                        <span className="text-success font-oswald font-bold">
                          {((goal.currentValue / goal.targetValue) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-background/50 rounded-full h-3">
                        <div 
                          className="bg-gradient-primary h-3 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, (goal.currentValue / goal.targetValue) * 100)}%` }}
                        />
                      </div>
                    </>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground font-rajdhani">Medições:</span>
                    <span className="text-foreground font-oswald font-medium">
                      {metrics.filter(m => m[type] !== undefined).length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Recent History */}
        {metrics.length > 0 && (
          <Card className="bg-gradient-dark border-border/50 shadow-intense">
            <CardHeader>
              <CardTitle className="text-primary font-oswald">
                Histórico Recente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {metrics
                  .filter(m => m[type] !== undefined)
                  .slice(-10)
                  .reverse()
                  .map((metric, index) => (
                    <div 
                      key={metric.id}
                      className="flex justify-between items-center py-3 border-b border-border/30 last:border-0"
                    >
                      <span className="text-muted-foreground font-rajdhani">
                        {metric.date.toLocaleDateString('pt-BR')}
                      </span>
                      <span className="text-foreground font-oswald font-medium">
                        {metric[type]?.toFixed(1)}{metricLabels[type].unit}
                      </span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* No Data State */}
        {metrics.filter(m => m[type] !== undefined).length === 0 && (
          <Card className="bg-gradient-dark border-border/50 shadow-intense">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Target className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-oswald font-bold text-foreground mb-2">
                Nenhuma medição encontrada
              </h3>
              <p className="text-muted-foreground text-center mb-6 font-rajdhani">
                Comece adicionando suas primeiras medições de {metric.label.toLowerCase()}
              </p>
              <Button onClick={() => navigate('/')}>
                Adicionar Medição
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}