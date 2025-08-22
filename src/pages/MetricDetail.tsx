import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Target, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GoalBreakdown } from "@/components/GoalBreakdown";
import { MetricChart } from "@/components/MetricChart";
import { HealthMetric, Goal, MetricType } from "@/types/health";
import { useState, useEffect } from "react";

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

  const updateGoal = (updated: Goal) => {
    const updatedGoals = goals.map(g => g.id === updated.id ? updated : g);
    setGoals(updatedGoals);
    localStorage.setItem('healthGoals', JSON.stringify(updatedGoals));
  };

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
              Análise detalhada e progresso
            </p>
          </div>
        </div>

        {/* Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MetricChart
            metrics={metrics}
            goals={goals}
            type={type}
            title={metric.label}
            unit={metric.unit}
            color={metricColors[type]}
          />
          
          {goal && (
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
          )}
        </div>

        {/* Goal Breakdown */}
        {goal && (
          <Card className="bg-gradient-dark border-border/50 shadow-intense">
            <CardHeader>
              <CardTitle className="text-primary font-oswald flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Acompanhamento Detalhado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <GoalBreakdown goal={goal} onUpdate={updateGoal} />
            </CardContent>
          </Card>
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
                  .slice(0, 10)
                  .map((metric, index) => (
                    <div 
                      key={metric.id}
                      className="flex justify-between items-center py-2 border-b border-border/30 last:border-0"
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
      </div>
    </div>
  );
}