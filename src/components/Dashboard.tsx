import { useState, useEffect, useRef } from "react";
import { MetricCard } from "./MetricCard";
import { AddMetricForm } from "./AddMetricForm";
import { GoalForm } from "./GoalForm";
import { HealthMetric, Goal, MetricType } from "@/types/health";
import { calculateIntermediateGoals, updateGoalProgress } from "@/utils/goalCalculator";
import { Weight, Dumbbell, Zap, Activity, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { GoalsPanel } from "./GoalsPanel";

const metricIcons = {
  weight: <Weight className="h-5 w-5 text-white" />,
  muscleMass: <Dumbbell className="h-5 w-5 text-white" />,
  fatMass: <Zap className="h-5 w-5 text-white" />,
  bmi: <Activity className="h-5 w-5 text-white" />,
  fatPercentage: <Target className="h-5 w-5 text-white" />
};

const metricColors = {
  weight: "from-primary to-primary-glow",
  muscleMass: "from-accent to-accent-glow", 
  fatMass: "from-warning to-orange-400",
  bmi: "from-success to-success-glow",
  fatPercentage: "from-destructive to-red-400"
};

const metricLabels = {
  weight: { label: "Peso", unit: "kg" },
  muscleMass: { label: "Massa Muscular", unit: "kg" },
  fatMass: { label: "Massa de Gordura", unit: "kg" },
  bmi: { label: "IMC", unit: "" },
  fatPercentage: { label: "% de Gordura", unit: "%" }
};

export function Dashboard() {
  const [metrics, setMetrics] = useState<HealthMetric[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load data from localStorage on component mount
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

  // Save data to localStorage whenever metrics or goals change
  useEffect(() => {
    localStorage.setItem('healthMetrics', JSON.stringify(metrics));
  }, [metrics]);

  useEffect(() => {
    localStorage.setItem('healthGoals', JSON.stringify(goals));
  }, [goals]);

  const addMetric = (metricData: Omit<HealthMetric, 'id'>) => {
    const newMetric: HealthMetric = {
      ...metricData,
      id: Date.now().toString()
    };
    
    const updatedMetrics = [...metrics, newMetric].sort((a, b) => b.date.getTime() - a.date.getTime());
    setMetrics(updatedMetrics);
    
    // Update goals with new current values
    const currentValues = getCurrentValues(updatedMetrics);
    const updatedGoals = goals.map(goal => {
      const currentValue = currentValues[goal.type];
      if (currentValue !== undefined) {
        return updateGoalProgress(goal, currentValue);
      }
      return goal;
    });
    setGoals(updatedGoals);
  };

  const addGoal = (goalData: Omit<Goal, 'id' | 'weeklyGoals' | 'monthlyGoals'>) => {
    const currentValues = getCurrentValues();
    const base = { ...goalData, currentValue: currentValues[goalData.type] } as Goal;
    const { weeklyGoals, monthlyGoals } = calculateIntermediateGoals(base);
    
    const newGoal: Goal = {
      ...goalData,
      id: Date.now().toString(),
      weeklyGoals,
      monthlyGoals
    };
    
    setGoals(prev => {
      const others = prev.filter(g => g.type !== newGoal.type);
      return [...others, newGoal];
    });
  };

  const handleExport = () => {
    try {
      const data = { metrics, goals };
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `dados-corporais-${dateStr}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Dados exportados com sucesso!');
    } catch (e) {
      toast.error('Falha ao exportar os dados.');
    }
  };

  const handleImportFile = async (file: File) => {
    try {
      const text = await file.text();
      const json = JSON.parse(text);

      const parsedMetrics: HealthMetric[] = (json.metrics || []).map((m: any) => ({
        ...m,
        date: new Date(m.date)
      })).sort((a: HealthMetric, b: HealthMetric) => b.date.getTime() - a.date.getTime());

      const parsedGoals: Goal[] = (json.goals || []).map((g: any) => ({
        ...g,
        targetDate: new Date(g.targetDate),
        weeklyGoals: (g.weeklyGoals || []).map((w: any) => ({
          ...w,
          weekStart: new Date(w.weekStart),
          weekEnd: new Date(w.weekEnd)
        })),
        monthlyGoals: g.monthlyGoals || []
      }));

      setMetrics(parsedMetrics);
      setGoals(parsedGoals);

      toast.success('Dados importados com sucesso!');
    } catch (e) {
      console.error(e);
      toast.error('Arquivo inválido. Verifique o JSON.');
    }
  };

  const onImportClick = () => fileInputRef.current?.click();
  const onFileChange: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleImportFile(file);
      // Reset input to allow re-importing the same file
      e.target.value = '';
    }
  };

  const clearData = () => {
    localStorage.removeItem('healthMetrics');
    localStorage.removeItem('healthGoals');
    setMetrics([]);
    setGoals([]);
    toast.success('Dados limpos.');
  };

  const onUpdateGoal = (updated: Goal) => {
    setGoals(prev => prev.map(g => g.id === updated.id ? updated : g));
  };

  const getCurrentValues = (metricsData = metrics): Record<MetricType, number | undefined> => {
    const latestMetric = metricsData[0]; // Already sorted by date descending
    
    return {
      weight: latestMetric?.weight,
      muscleMass: latestMetric?.muscleMass,
      fatMass: latestMetric?.fatMass,
      bmi: latestMetric?.bmi,
      fatPercentage: latestMetric?.fatPercentage
    };
  };

  const getMetricGoal = (type: MetricType): Goal | undefined => {
    return goals.find(goal => goal.type === type);
  };

  const getPreviousMetric = (index: number = 1): HealthMetric | undefined => {
    return metrics[index];
  };

  const currentValues = getCurrentValues();
  const lastMetric = metrics[0];
  const previousMetric = getPreviousMetric();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent">
            Acompanhamento Corporal
          </h1>
          <p className="text-muted-foreground">
            Monitore sua evolução e alcance suas metas de saúde
          </p>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button variant="secondary" onClick={handleExport}>
            Exportar dados (JSON)
          </Button>
          <Button variant="outline" onClick={onImportClick}>
            Importar dados
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={onFileChange}
          />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Limpar dados</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Tem certeza que deseja limpar?</AlertDialogTitle>
                <AlertDialogDescription>
                  Essa ação removerá todas as medições e metas salvas neste dispositivo. Não poderá ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={clearData}>Limpar</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {(Object.keys(metricLabels) as MetricType[]).map((type) => (
            <MetricCard
              key={type}
              title={metricLabels[type].label}
              value={currentValues[type]}
              unit={metricLabels[type].unit}
              goal={getMetricGoal(type)}
              lastMetric={lastMetric}
              previousMetric={previousMetric}
              icon={metricIcons[type]}
              color={metricColors[type]}
            />
          ))}
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AddMetricForm onAddMetric={addMetric} />
          <GoalForm onAddGoal={addGoal} currentValues={currentValues} />
        </div>

        {/* Goals Panel */}
        {goals.length > 0 && (
          <GoalsPanel goals={goals} onUpdateGoal={onUpdateGoal} />
        )}


        {/* Recent Metrics Table (if there are metrics) */}
        {metrics.length > 0 && (
          <div className="bg-card rounded-lg shadow-soft p-6">
            <h2 className="text-xl font-semibold mb-4">Histórico Recente</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-2">Data</th>
                    <th className="text-left p-2">Peso</th>
                    <th className="text-left p-2">Massa Muscular</th>
                    <th className="text-left p-2">Massa de Gordura</th>
                    <th className="text-left p-2">IMC</th>
                    <th className="text-left p-2">% Gordura</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.slice(0, 5).map((metric) => (
                    <tr key={metric.id} className="border-b border-border/50">
                      <td className="p-2">{metric.date.toLocaleDateString('pt-BR')}</td>
                      <td className="p-2">{metric.weight ? `${metric.weight.toFixed(1)} kg` : '-'}</td>
                      <td className="p-2">{metric.muscleMass ? `${metric.muscleMass.toFixed(1)} kg` : '-'}</td>
                      <td className="p-2">{metric.fatMass ? `${metric.fatMass.toFixed(1)} kg` : '-'}</td>
                      <td className="p-2">{metric.bmi ? metric.bmi.toFixed(1) : '-'}</td>
                      <td className="p-2">{metric.fatPercentage ? `${metric.fatPercentage.toFixed(1)}%` : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}