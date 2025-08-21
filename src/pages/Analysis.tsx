import { useState, useEffect } from "react";
import { TrendingUp, Target, Activity, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MetricChart } from "@/components/MetricChart";
import { GoalProgressChart } from "@/components/GoalProgressChart";
import { HealthMetric, Goal, MetricType } from "@/types/health";

const metricLabels = {
  weight: { label: "Peso", unit: "kg" },
  muscleMass: { label: "Massa Muscular", unit: "kg" },
  fatMass: { label: "Massa de Gordura", unit: "kg" },
  bmi: { label: "IMC", unit: "" },
  fatPercentage: { label: "% de Gordura", unit: "%" }
};

const metricColors = {
  weight: "from-primary to-primary-glow",
  muscleMass: "from-accent to-accent-glow", 
  fatMass: "from-warning to-warning",
  bmi: "from-success to-success-glow",
  fatPercentage: "from-destructive to-destructive"
};

export default function Analysis() {
  const [metrics, setMetrics] = useState<HealthMetric[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);

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

  const getLatestMetric = (type: MetricType) => {
    const typeMetrics = metrics.filter(m => m[type] !== undefined);
    return typeMetrics.length > 0 ? typeMetrics[typeMetrics.length - 1] : null;
  };

  const getMetricTrend = (type: MetricType) => {
    const typeMetrics = metrics.filter(m => m[type] !== undefined);
    if (typeMetrics.length < 2) return 0;
    
    const latest = typeMetrics[typeMetrics.length - 1];
    const previous = typeMetrics[typeMetrics.length - 2];
    
    return latest[type]! - previous[type]!;
  };

  const getTrendColor = (trend: number, type: MetricType) => {
    if (trend === 0) return "secondary";
    
    // For weight loss and fat reduction, negative trend is good
    if ((type === 'weight' || type === 'fatMass' || type === 'fatPercentage') && trend < 0) {
      return "success";
    }
    // For muscle gain, positive trend is good
    if (type === 'muscleMass' && trend > 0) {
      return "success";
    }
    // For BMI, depends on current value
    if (type === 'bmi') {
      return trend < 0 ? "success" : "warning";
    }
    
    return trend > 0 ? "warning" : "success";
  };

  const getProgressStats = () => {
    const totalGoals = goals.length;
    const achievedGoals = goals.filter(g => {
      if (!g.currentValue) return false;
      const progress = (g.currentValue / g.targetValue) * 100;
      return progress >= 100;
    }).length;
    
    const onTrackGoals = goals.filter(g => {
      if (!g.currentValue) return false;
      const progress = (g.currentValue / g.targetValue) * 100;
      return progress >= 70 && progress < 100;
    }).length;

    return { totalGoals, achievedGoals, onTrackGoals };
  };

  const stats = getProgressStats();

  return (
    <div className="min-h-screen bg-background">
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-oswald font-bold text-primary">
            Análise de Progresso
          </h1>
          <p className="text-muted-foreground font-rajdhani">
            Acompanhe sua evolução e tendências de saúde
          </p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-dark border-border/50 shadow-intense">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center">
                  <Target className="h-6 w-6 text-background" />
                </div>
                <div>
                  <p className="text-2xl font-oswald font-bold text-primary">
                    {stats.achievedGoals}
                  </p>
                  <p className="text-sm text-muted-foreground font-rajdhani">
                    Metas Alcançadas
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-dark border-border/50 shadow-intense">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-success to-success-glow rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-background" />
                </div>
                <div>
                  <p className="text-2xl font-oswald font-bold text-success">
                    {stats.onTrackGoals}
                  </p>
                  <p className="text-sm text-muted-foreground font-rajdhani">
                    No Caminho Certo
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-dark border-border/50 shadow-intense">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-accent to-accent-glow rounded-lg flex items-center justify-center">
                  <Activity className="h-6 w-6 text-background" />
                </div>
                <div>
                  <p className="text-2xl font-oswald font-bold text-accent">
                    {metrics.length}
                  </p>
                  <p className="text-sm text-muted-foreground font-rajdhani">
                    Medições Totais
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Metric Trends */}
        <Card className="bg-gradient-dark border-border/50 shadow-intense">
          <CardHeader>
            <CardTitle className="text-primary font-oswald flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Tendências das Métricas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(metricLabels).map(([type, config]) => {
                const latest = getLatestMetric(type as MetricType);
                const trend = getMetricTrend(type as MetricType);
                const trendColor = getTrendColor(trend, type as MetricType);
                
                return (
                  <div key={type} className="p-4 border border-border/30 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-oswald font-medium text-foreground">
                        {config.label}
                      </h4>
                      <Badge variant={trendColor as any}>
                        {trend > 0 ? '+' : ''}{trend.toFixed(1)}{config.unit}
                      </Badge>
                    </div>
                    <p className="text-xl font-oswald font-bold text-primary">
                      {latest ? `${latest[type as MetricType]?.toFixed(1)}${config.unit}` : '--'}
                    </p>
                    <p className="text-xs text-muted-foreground font-rajdhani">
                      {latest ? latest.date.toLocaleDateString('pt-BR') : 'Sem dados'}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Goal Progress Chart */}
        <GoalProgressChart goals={goals} currentMetrics={getLatestMetric('weight')} />

        {/* Individual Metric Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Object.entries(metricLabels).map(([type, config]) => {
            const goal = goals.find(g => g.type === type);
            return (
              <MetricChart
                key={type}
                metrics={metrics}
                type={type as MetricType}
                title={config.label}
                unit={config.unit}
                color={metricColors[type as MetricType]}
                goal={goal}
              />
            );
          })}
        </div>

        {/* Insights Card */}
        {metrics.length > 0 && (
          <Card className="bg-gradient-dark border-border/50 shadow-intense">
            <CardHeader>
              <CardTitle className="text-primary font-oswald flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Insights de Progresso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-background/50 rounded-lg border border-border/30">
                    <h4 className="font-oswald font-medium text-foreground mb-2">
                      Consistência nas Medições
                    </h4>
                    <p className="text-sm text-muted-foreground font-rajdhani">
                      Você registrou {metrics.length} medições até agora. Continue assim!
                    </p>
                  </div>
                  
                  <div className="p-4 bg-background/50 rounded-lg border border-border/30">
                    <h4 className="font-oswald font-medium text-foreground mb-2">
                      Metas Ativas
                    </h4>
                    <p className="text-sm text-muted-foreground font-rajdhani">
                      {goals.length > 0 
                        ? `Você tem ${goals.length} metas ativas para acompanhar.`
                        : 'Defina suas primeiras metas para começar a acompanhar o progresso.'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {metrics.length === 0 && (
          <Card className="bg-gradient-dark border-border/50 shadow-intense">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Activity className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-oswald font-bold text-foreground mb-2">
                Sem dados para análise
              </h3>
              <p className="text-muted-foreground text-center mb-6 font-rajdhani">
                Comece adicionando suas primeiras medições para ver análises detalhadas
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}